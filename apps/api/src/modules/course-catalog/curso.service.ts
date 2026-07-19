import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { slugify } from '../../common/slug/slugify';
import { generateId } from '../../common/id/generate-id';
import {
  TENANT_SCOPED_PRISMA,
  TenantScopedPrismaClient,
} from '../../common/prisma/tenant-scoped-prisma.provider';
import { TenantContextService } from '../../common/tenant-context/tenant-context.service';
import { AddInstructorDto } from './dto/add-instructor.dto';
import { CreateCursoDto } from './dto/create-curso.dto';
import { UpdateCursoDto } from './dto/update-curso.dto';

@Injectable()
export class CursoService {
  constructor(
    @Inject(TENANT_SCOPED_PRISMA)
    private readonly tenantScopedPrisma: TenantScopedPrismaClient,
    private readonly tenantContext: TenantContextService,
  ) {}

  /** Slug único por tenant (Documento 3) — agrega sufijo numérico si colisiona. */
  private async generarSlugUnico(titulo: string): Promise<string> {
    const base = slugify(titulo);
    let candidato = base;
    let intento = 1;

    while (
      await this.tenantScopedPrisma.curso.findFirst({
        where: { slug: candidato },
        select: { id: true },
      })
    ) {
      intento += 1;
      candidato = `${base}-${intento}`;
    }

    return candidato;
  }

  async create(dto: CreateCursoDto) {
    const slug = await this.generarSlugUnico(dto.titulo);

    return this.tenantScopedPrisma.curso.create({
      data: {
        id: generateId(),
        tenantId: this.tenantContext.requireTenantId(),
        titulo: dto.titulo,
        slug,
        descripcion: dto.descripcion,
        tipoAcceso: dto.tipoAcceso,
        precioCentavos:
          dto.tipoAcceso === 'PagoUnico' ? dto.precioCentavos : null,
        moneda: dto.tipoAcceso === 'PagoUnico' ? dto.moneda : null,
        imagenPortadaUrl: dto.imagenPortadaUrl,
        estado: 'Borrador',
      },
    });
  }

  list() {
    return this.tenantScopedPrisma.curso.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const curso = await this.tenantScopedPrisma.curso.findFirst({
      where: { id },
      include: {
        modulos: {
          orderBy: { orden: 'asc' },
          include: { clases: { orderBy: { orden: 'asc' } } },
        },
        instructores: { include: { academiaUsuario: true } },
      },
    });
    if (!curso) {
      throw new NotFoundException('El curso indicado no existe');
    }
    return curso;
  }

  async update(id: string, dto: UpdateCursoDto) {
    await this.findOne(id); // valida tenant

    return this.tenantScopedPrisma.curso.update({
      where: { id },
      data: {
        titulo: dto.titulo,
        descripcion: dto.descripcion,
        tipoAcceso: dto.tipoAcceso,
        precioCentavos: dto.tipoAcceso === 'Gratis' ? null : dto.precioCentavos,
        moneda: dto.tipoAcceso === 'Gratis' ? null : dto.moneda,
        imagenPortadaUrl: dto.imagenPortadaUrl,
      },
    });
  }

  /**
   * Documento 9, decisión C3: requiere al menos un módulo con una clase.
   * TODO (desarrollo): restringir a roles Owner/Administrador/Profesor
   * cuando exista la matriz de permisos completa (Documento 7, P4) — hoy
   * cualquier AcademiaUsuario autenticado puede publicar.
   */
  async publish(id: string) {
    const curso = await this.findOne(id);
    const tieneContenido = curso.modulos.some((m) => m.clases.length > 0);

    if (!tieneContenido) {
      throw new BadRequestException(
        'El curso necesita al menos un módulo con una clase para poder publicarse',
      );
    }

    return this.tenantScopedPrisma.curso.update({
      where: { id },
      data: { estado: 'Publicado' },
    });
  }

  /**
   * Documento 9, decisión C2: nunca revoca acceso de alumnos ya inscriptos
   * (eso se aplica en el módulo Enrollment, no acá — acá solo se saca del
   * catálogo público).
   */
  async unpublish(id: string) {
    await this.findOne(id);
    return this.tenantScopedPrisma.curso.update({
      where: { id },
      data: { estado: 'Borrador' },
    });
  }

  /**
   * Borrado real solo si nadie se inscribió todavía — una vez que exista una
   * Inscripcion, el curso pasa a soft-delete obligatorio (Documento 3, M1),
   * no implementado en este método porque Enrollment todavía no se construyó.
   */
  async remove(id: string) {
    await this.findOne(id);

    const inscripciones = await this.tenantScopedPrisma.inscripcion.count({
      where: { cursoId: id },
    });
    if (inscripciones > 0) {
      throw new ConflictException(
        'No se puede eliminar un curso con alumnos inscriptos',
      );
    }

    await this.tenantScopedPrisma.$transaction(async (tx) => {
      await tx.claseAdjunto.deleteMany({
        where: { clase: { modulo: { cursoId: id } } },
      });
      await tx.clase.deleteMany({ where: { modulo: { cursoId: id } } });
      await tx.modulo.deleteMany({ where: { cursoId: id } });
      await tx.cursoInstructor.deleteMany({ where: { cursoId: id } });
      await tx.curso.delete({ where: { id } });
    });
  }

  async addInstructor(cursoId: string, dto: AddInstructorDto) {
    await this.findOne(cursoId);

    const academiaUsuario =
      await this.tenantScopedPrisma.academiaUsuario.findFirst({
        where: { id: dto.academiaUsuarioId },
      });
    if (!academiaUsuario) {
      throw new NotFoundException('El usuario indicado no existe');
    }
    if (academiaUsuario.rol !== 'Profesor' && academiaUsuario.rol !== 'Owner') {
      throw new BadRequestException(
        'Solo usuarios con rol Profesor u Owner pueden ser instructores de un curso',
      );
    }

    const yaEsInstructor =
      await this.tenantScopedPrisma.cursoInstructor.findFirst({
        where: { cursoId, academiaUsuarioId: dto.academiaUsuarioId },
      });
    if (yaEsInstructor) {
      throw new ConflictException('Ese usuario ya es instructor de este curso');
    }

    return this.tenantScopedPrisma.cursoInstructor.create({
      data: { cursoId, academiaUsuarioId: dto.academiaUsuarioId },
    });
  }

  async removeInstructor(cursoId: string, academiaUsuarioId: string) {
    await this.findOne(cursoId);
    await this.tenantScopedPrisma.cursoInstructor.deleteMany({
      where: { cursoId, academiaUsuarioId },
    });
  }

  /**
   * Documento 4, Flujo 5 / Documento 8, sección 2, punto 4 — vista pública
   * (sin guard) para la página del curso en el sitio del creador. Nunca
   * expone `videoExternalId`/`contenidoTexto`/adjuntos de las clases: eso es
   * contenido del curso, solo visible una vez inscripto (Documento 9).
   * `puedeComprarse` oculta el botón "Comprar" si el curso es pago y el
   * creador no tiene una cuenta de Mercado Pago conectada — nunca se deja
   * llegar a un alumno al checkout para que falle ahí.
   */
  async findPublicadoPorSlug(slug: string) {
    const curso = await this.tenantScopedPrisma.curso.findFirst({
      where: { slug, estado: 'Publicado' },
      include: {
        modulos: {
          orderBy: { orden: 'asc' },
          include: {
            clases: {
              orderBy: { orden: 'asc' },
              select: {
                id: true,
                titulo: true,
                orden: true,
                duracionEstimadaMinutos: true,
              },
            },
          },
        },
      },
    });
    if (!curso) {
      throw new NotFoundException(
        'El curso indicado no existe o no está publicado',
      );
    }

    let puedeComprarse = true;
    if (curso.tipoAcceso === 'PagoUnico') {
      const cuenta = await this.tenantScopedPrisma.cuentaPagoCreador.findFirst(
        { where: { proveedor: 'MercadoPago', estadoConexion: 'Conectada' } },
      );
      puedeComprarse = !!cuenta;
    }

    return {
      id: curso.id,
      titulo: curso.titulo,
      descripcion: curso.descripcion,
      tipoAcceso: curso.tipoAcceso,
      precioCentavos: curso.precioCentavos,
      moneda: curso.moneda,
      imagenPortadaUrl: curso.imagenPortadaUrl,
      puedeComprarse,
      modulos: curso.modulos.map((m) => ({
        titulo: m.titulo,
        orden: m.orden,
        clases: m.clases.map((c) => ({
          titulo: c.titulo,
          orden: c.orden,
          duracionEstimadaMinutos: c.duracionEstimadaMinutos,
        })),
      })),
    };
  }

  /**
   * Documento 5, sección 3 — bloque "Cursos" del sitio público: listado de
   * cursos publicados. El bloque distingue "destacados"/"todos" en su
   * propiedad `seleccion`, pero no existe todavía un flag de "destacado" en
   * el modelo de Curso — hasta que se agregue, ambas opciones muestran el
   * mismo listado completo (simplificación documentada, no un olvido).
   */
  listPublicados() {
    return this.tenantScopedPrisma.curso.findMany({
      where: { estado: 'Publicado' },
      select: {
        id: true,
        titulo: true,
        slug: true,
        tipoAcceso: true,
        precioCentavos: true,
        moneda: true,
        imagenPortadaUrl: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
