import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Response } from 'express';
import { PasswordService } from '../../common/security/password.service';
import { SessionService } from '../../common/security/session.service';
import {
  TENANT_SCOPED_PRISMA,
  TenantScopedPrismaClient,
} from '../../common/prisma/tenant-scoped-prisma.provider';
import { TenantContextService } from '../../common/tenant-context/tenant-context.service';
import { CambiarPasswordAlumnoDto } from './dto/cambiar-password-alumno.dto';
import { DefinirPasswordDto } from './dto/definir-password.dto';
import { LoginAlumnoDto } from './dto/login-alumno.dto';

@Injectable()
export class AlumnoAuthService {
  constructor(
    @Inject(TENANT_SCOPED_PRISMA)
    private readonly tenantScopedPrisma: TenantScopedPrismaClient,
    private readonly tenantContext: TenantContextService,
    private readonly passwordService: PasswordService,
    private readonly sessionService: SessionService,
  ) {}

  async login(dto: LoginAlumnoDto, res: Response) {
    const tenantId = this.tenantContext.requireTenantId();

    const alumno = await this.tenantScopedPrisma.alumno.findFirst({
      where: { email: dto.email },
    });

    if (!alumno || !alumno.passwordHash) {
      throw new UnauthorizedException('Email o contraseña incorrectos');
    }

    const passwordValida = await this.passwordService.verify(
      alumno.passwordHash,
      dto.password,
    );
    if (!passwordValida) {
      throw new UnauthorizedException('Email o contraseña incorrectos');
    }

    this.sessionService.issueSessionCookies(res, {
      sub: alumno.id,
      aud: 'alumno',
      tenantId,
      rol: 'Alumno',
    });

    return { id: alumno.id, email: alumno.email, nombre: alumno.nombre };
  }

  /**
   * Documento 1, D6 — último paso del guest-checkout: consume el token de
   * "definir contraseña" emitido durante la inscripción, setea la
   * contraseña, y recién ahí emite la sesión real (login automático).
   */
  async definirPassword(
    setPasswordToken: string,
    dto: DefinirPasswordDto,
    res: Response,
  ) {
    const payload =
      this.sessionService.verifySetPasswordToken(setPasswordToken);

    if (payload.tenantId !== this.tenantContext.requireTenantId()) {
      throw new UnauthorizedException('El link no corresponde a esta academia');
    }

    const passwordHash = await this.passwordService.hash(dto.password);
    const alumno = await this.tenantScopedPrisma.alumno.update({
      where: { id: payload.sub },
      data: { passwordHash },
    });

    this.sessionService.clearSetPasswordCookie(res);
    this.sessionService.issueSessionCookies(res, {
      sub: alumno.id,
      aud: 'alumno',
      tenantId: payload.tenantId,
      rol: 'Alumno',
    });

    return { id: alumno.id, email: alumno.email, nombre: alumno.nombre };
  }

  logout(res: Response) {
    this.sessionService.clearSessionCookies(res);
  }

  async me(alumnoId: string) {
    const alumno = await this.tenantScopedPrisma.alumno.findFirst({
      where: { id: alumnoId },
    });
    if (!alumno) {
      throw new UnauthorizedException('Sesión inválida');
    }
    return { id: alumno.id, email: alumno.email, nombre: alumno.nombre };
  }

  /**
   * Documento 11, sección 1 ("Mi Cuenta") — cambio de contraseña estando ya
   * logueado, distinto del flujo de "definir contraseña" del guest-checkout
   * (acá se exige la contraseña actual). El cambio de email con
   * verificación por link (mismo documento) queda pendiente de la
   * infraestructura de email transaccional (Resend), todavía no construida.
   */
  async cambiarPassword(alumnoId: string, dto: CambiarPasswordAlumnoDto) {
    const alumno = await this.tenantScopedPrisma.alumno.findFirst({
      where: { id: alumnoId },
    });
    if (!alumno || !alumno.passwordHash) {
      throw new UnauthorizedException('Sesión inválida');
    }

    const passwordValida = await this.passwordService.verify(
      alumno.passwordHash,
      dto.passwordActual,
    );
    if (!passwordValida) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    const passwordHash = await this.passwordService.hash(dto.passwordNueva);
    await this.tenantScopedPrisma.alumno.update({
      where: { id: alumnoId },
      data: { passwordHash },
    });

    return { actualizado: true };
  }
}
