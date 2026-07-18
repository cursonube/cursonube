import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Response } from 'express';
import { PasswordService } from '../../common/security/password.service';
import { SessionService } from '../../common/security/session.service';
import {
  TENANT_SCOPED_PRISMA,
  TenantScopedPrismaClient,
} from '../../common/prisma/tenant-scoped-prisma.provider';
import { TenantContextService } from '../../common/tenant-context/tenant-context.service';
import { LoginAcademiaUsuarioDto } from './dto/login-academia-usuario.dto';

@Injectable()
export class AcademiaUsuarioAuthService {
  constructor(
    @Inject(TENANT_SCOPED_PRISMA)
    private readonly tenantScopedPrisma: TenantScopedPrismaClient,
    private readonly tenantContext: TenantContextService,
    private readonly passwordService: PasswordService,
    private readonly sessionService: SessionService,
  ) {}

  /**
   * Documento 7, sección 2: login de Owner/Administrador/Profesor/Editor —
   * el tenant ya viene resuelto por TenantContextMiddleware a partir del
   * subdominio (Documento 6), no se recibe en el body.
   */
  async login(dto: LoginAcademiaUsuarioDto, res: Response) {
    const tenantId = this.tenantContext.requireTenantId();

    const usuario = await this.tenantScopedPrisma.academiaUsuario.findFirst({
      where: { email: dto.email },
    });

    // Mismo mensaje genérico si el email no existe o la contraseña es
    // incorrecta — no revelar cuál de las dos falló (Documento 16).
    if (!usuario || !usuario.passwordHash) {
      throw new UnauthorizedException('Email o contraseña incorrectos');
    }

    const passwordValida = await this.passwordService.verify(
      usuario.passwordHash,
      dto.password,
    );
    if (!passwordValida) {
      throw new UnauthorizedException('Email o contraseña incorrectos');
    }

    if (usuario.estado !== 'Activo') {
      throw new UnauthorizedException(
        usuario.estado === 'InvitadoPendiente'
          ? 'Todavía no activaste tu cuenta — revisá el email de invitación'
          : 'Esta cuenta está desactivada',
      );
    }

    this.sessionService.issueSessionCookies(res, {
      sub: usuario.id,
      aud: 'academia-usuario',
      tenantId,
      rol: usuario.rol,
    });

    return {
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    };
  }

  logout(res: Response) {
    this.sessionService.clearSessionCookies(res);
  }

  /** Datos frescos de la sesión actual — nunca se confía solo en el JWT para esto. */
  async me(userId: string) {
    const usuario = await this.tenantScopedPrisma.academiaUsuario.findFirst({
      where: { id: userId },
    });
    if (!usuario) {
      throw new UnauthorizedException('Sesión inválida');
    }
    return {
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      estado: usuario.estado,
    };
  }
}
