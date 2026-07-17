import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { generateId } from '../../common/id/generate-id';
import { ACCESS_TOKEN_COOKIE } from '../../common/security/jwt.config';
import { SessionService } from '../../common/security/session.service';
import {
  TENANT_SCOPED_PRISMA,
  TenantScopedPrismaClient,
} from '../../common/prisma/tenant-scoped-prisma.provider';
import { TenantContextService } from '../../common/tenant-context/tenant-context.service';
import { InscribirseDto } from './dto/inscribirse.dto';

/**
 * Documento 4, Flujo 5 (recorte de MVP: solo la rama "Gratis" — la rama
 * "Pago" necesita la integración con Mercado Pago, todavía no construida
 * por falta de credenciales de desarrollo; ver docs/08-sistema-de-pagos.md).
 */
@Injectable()
export class InscripcionService {
  constructor(
    @Inject(TENANT_SCOPED_PRISMA)
    private readonly tenantScopedPrisma: TenantScopedPrismaClient,
    private readonly tenantContext: TenantContextService,
    private readonly sessionService: SessionService,
  ) {}

  async inscribirseGratis(
    cursoId: string,
    dto: InscribirseDto,
    req: Request,
    res: Response,
  ) {
    const tenantId = this.tenantContext.requireTenantId();

    const curso = await this.tenantScopedPrisma.curso.findFirst({
      where: { id: cursoId, estado: 'Publicado' },
    });
    if (!curso) {
      throw new NotFoundException(
        'El curso indicado no existe o no está publicado',
      );
    }
    if (curso.tipoAcceso !== 'Gratis') {
      throw new BadRequestException(
        'Este curso es pago — el checkout con Mercado Pago todavía no está disponible',
      );
    }

    const { alumno, requierePassword } = await this.resolveAlumno(
      dto,
      req,
      tenantId,
    );

    const yaInscripto = await this.tenantScopedPrisma.inscripcion.findFirst({
      where: { alumnoId: alumno.id, cursoId },
    });
    if (yaInscripto) {
      throw new ConflictException('Ya estás inscripto en este curso');
    }

    const inscripcion = await this.tenantScopedPrisma.inscripcion.create({
      data: {
        id: generateId(),
        tenantId,
        alumnoId: alumno.id,
        cursoId,
        estado: 'Activa',
      },
    });

    if (requierePassword) {
      // Documento 1, D6: cuenta creada, todavía sin contraseña — el frontend
      // debe mostrar "creá tu contraseña" antes de dar acceso al curso.
      this.sessionService.issueSetPasswordCookie(res, {
        sub: alumno.id,
        tenantId,
        purpose: 'set-password',
      });
    }

    return { inscripcion, requierePassword };
  }

  /**
   * Resuelve quién es el alumno que se está inscribiendo:
   * 1. Si ya hay una sesión de Alumno válida para este tenant, se usa esa.
   * 2. Si no, se busca por email (nombre/email obligatorios en este caso).
   *    - Si el email ya tiene cuenta CON contraseña: exige login (nunca se
   *      adjunta la compra sin autenticar — Documento 4, Flujo 5).
   *    - Si el email ya tiene cuenta SIN contraseña (guest anterior que no
   *      completó ese paso): se reusa esa cuenta.
   *    - Si no existe: se crea.
   */
  private async resolveAlumno(
    dto: InscribirseDto,
    req: Request,
    tenantId: string,
  ) {
    const existingToken = req.cookies?.[ACCESS_TOKEN_COOKIE];
    const session = this.sessionService.tryVerifyAccessToken(existingToken);

    if (session && session.aud === 'alumno' && session.tenantId === tenantId) {
      const alumno = await this.tenantScopedPrisma.alumno.findFirst({
        where: { id: session.sub },
      });
      if (!alumno) {
        throw new UnauthorizedException('Sesión inválida');
      }
      return { alumno, requierePassword: false };
    }

    if (!dto.nombre || !dto.email) {
      throw new BadRequestException('Nombre y email son obligatorios');
    }

    const existente = await this.tenantScopedPrisma.alumno.findFirst({
      where: { email: dto.email },
    });

    if (existente) {
      if (existente.passwordHash) {
        throw new UnauthorizedException(
          'Ya tenés una cuenta con este email en esta academia — iniciá sesión para continuar',
        );
      }
      return { alumno: existente, requierePassword: true };
    }

    const nuevo = await this.tenantScopedPrisma.alumno.create({
      data: {
        id: generateId(),
        tenantId,
        email: dto.email,
        nombre: dto.nombre,
      },
    });
    return { alumno: nuevo, requierePassword: true };
  }
}
