import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TipoPagina } from '@prisma/client';
import { generateId } from '../../common/id/generate-id';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  TENANT_SCOPED_PRISMA,
  TenantScopedPrismaClient,
} from '../../common/prisma/tenant-scoped-prisma.provider';
import { TenantContextService } from '../../common/tenant-context/tenant-context.service';
import { PasswordService } from '../../common/security/password.service';
import { getDefaultBlocksForPagina } from '../content-editor/default-blocks';
import { CreateAcademiaDto } from './dto/create-academia.dto';
import { SubdomainAvailabilityDto } from './dto/subdomain-availability.dto';
import { RESERVED_SUBDOMAINS } from './reserved-subdomains';

/**
 * Páginas fijas creadas automáticamente por el wizard, ya publicadas y con
 * su composición de bloques por defecto (Documento 5, sección 4) —
 * "nunca debe existir una pantalla vacía" (Documento 1). El helper de
 * composición por defecto es una función pura del módulo Content Editor,
 * importada acá sin depender del resto de ese módulo (ver ese archivo).
 */
const PAGINAS_FIJAS: Array<{ tipo: TipoPagina; slug: string; titulo: string }> =
  [
    { tipo: 'Home', slug: '', titulo: 'Inicio' },
    { tipo: 'Cursos', slug: 'cursos', titulo: 'Cursos' },
    { tipo: 'SobreNosotros', slug: 'sobre-nosotros', titulo: 'Sobre Nosotros' },
    { tipo: 'Contacto', slug: 'contacto', titulo: 'Contacto' },
    { tipo: 'Faq', slug: 'faq', titulo: 'Preguntas Frecuentes' },
    { tipo: 'Politicas', slug: 'politicas', titulo: 'Políticas' },
    { tipo: 'Login', slug: 'login', titulo: 'Iniciar Sesión' },
  ];

@Injectable()
export class TenancyService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(TENANT_SCOPED_PRISMA)
    private readonly tenantScopedPrisma: TenantScopedPrismaClient,
    private readonly tenantContext: TenantContextService,
    private readonly passwordService: PasswordService,
  ) {}

  /**
   * Documento 4, Flujo 1, Paso 2 — verificación en tiempo real.
   */
  async checkSubdomainAvailability(
    subdominio: string,
  ): Promise<SubdomainAvailabilityDto> {
    if (RESERVED_SUBDOMAINS.has(subdominio)) {
      return { disponible: false, motivo: 'Este subdominio está reservado' };
    }

    // Academia no es tenant-scoped, pero sí soft-delete — se consulta con el
    // cliente extendido para que el filtro deletedAt se aplique igual.
    const existente = await this.tenantScopedPrisma.academia.findFirst({
      where: { subdominio },
      select: { id: true },
    });

    if (existente) {
      return { disponible: false, motivo: 'Este subdominio ya está en uso' };
    }

    return { disponible: true };
  }

  /**
   * Documento 1/4, wizard completo: Paso 0 (cuenta del Owner) + Pasos 1-4
   * (academia/branding), atómico en una sola transacción, más Documento 6,
   * sección 2 (aprovisionamiento síncrono: páginas fijas, plan Free por
   * defecto). El primer curso (Paso 5, opcional) no se crea acá.
   */
  async createAcademia(dto: CreateAcademiaDto) {
    const disponibilidad = await this.checkSubdomainAvailability(
      dto.subdominio,
    );
    if (!disponibilidad.disponible) {
      throw new ConflictException(disponibilidad.motivo);
    }

    const plantilla = await this.tenantScopedPrisma.plantilla.findUnique({
      where: { id: dto.plantillaId },
    });
    if (!plantilla) {
      throw new NotFoundException('La plantilla indicada no existe');
    }

    const planFree = await this.prisma.plan.findUnique({
      where: { slug: 'Free' },
    });
    if (!planFree) {
      throw new NotFoundException(
        'No existe el plan Free en el catálogo — ¿se corrió el seed? (pnpm db:seed)',
      );
    }

    const passwordHash = await this.passwordService.hash(dto.password);
    const academiaId = generateId();

    // AcademiaUsuario y Pagina son tenant-scoped (Documento 3): se crean
    // "como" el tenant recién generado, aunque la request que crea la
    // academia todavía no tenía TenantContext (no podía tenerlo — el tenant
    // no existía hasta este momento).
    return this.tenantContext.run({ tenantId: academiaId }, () =>
      this.tenantScopedPrisma.$transaction(async (tx) => {
        const academia = await tx.academia.create({
          data: {
            id: academiaId,
            nombre: dto.nombre,
            subdominio: dto.subdominio,
            plantillaId: dto.plantillaId,
            logoUrl: dto.logoUrl,
            colorPrimario: dto.colorPrimario,
            colorSecundario: dto.colorSecundario,
            imagenPrincipalUrl: dto.imagenPrincipalUrl,
            planId: planFree.id,
            onboardingCompleto: false,
          },
        });

        // Documento 7, sección 3: una cuenta de creador = una academia.
        await tx.academiaUsuario.create({
          data: {
            id: generateId(),
            tenantId: academiaId,
            email: dto.email,
            passwordHash,
            rol: 'Owner',
            estado: 'Activo',
          },
        });

        const paginasConId = PAGINAS_FIJAS.map((pagina) => ({
          ...pagina,
          id: generateId(),
        }));

        await tx.pagina.createMany({
          data: paginasConId.map((pagina) => ({
            id: pagina.id,
            tenantId: academiaId,
            tipo: pagina.tipo,
            slug: pagina.slug,
            titulo: pagina.titulo,
            estado: 'Publicada' as const,
          })),
        });

        const bloques = paginasConId.flatMap((pagina) =>
          getDefaultBlocksForPagina(pagina.tipo, dto.nombre).map(
            (bloque, indice) => ({
              id: generateId(),
              paginaId: pagina.id,
              tipo: bloque.tipo,
              orden: indice,
              propiedades: bloque.propiedades,
            }),
          ),
        );

        if (bloques.length > 0) {
          await tx.bloque.createMany({ data: bloques });
        }

        return academia;
      }),
    );
  }
}
