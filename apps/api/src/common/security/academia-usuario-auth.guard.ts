import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { TenantContextService } from '../tenant-context/tenant-context.service';
import { ACCESS_TOKEN_COOKIE } from './jwt.config';
import { SessionService } from './session.service';

/**
 * Guard para rutas del panel de gestión (Owner/Administrador/Profesor/
 * Editor) — Documento 7, sección 2. Un guard concreto por audiencia (no uno
 * genérico parametrizable) porque hoy solo existe esta audiencia
 * implementada; Alumno y Staff tendrán el suyo cuando se construyan.
 */
@Injectable()
export class AcademiaUsuarioAuthGuard implements CanActivate {
  constructor(
    private readonly sessionService: SessionService,
    private readonly tenantContext: TenantContextService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const token = req.cookies?.[ACCESS_TOKEN_COOKIE];

    if (!token) {
      throw new UnauthorizedException('No hay sesión activa');
    }

    const payload = this.sessionService.verifyAccessToken(token);

    if (payload.aud !== 'academia-usuario') {
      throw new UnauthorizedException('Token de otra audiencia');
    }

    // Un token emitido para el tenant A nunca debe aceptarse en una request
    // resuelta contra el tenant B (Documento 6, sección 3: doble barrera).
    if (payload.tenantId !== this.tenantContext.getTenantId()) {
      throw new UnauthorizedException('Sesión no corresponde a esta academia');
    }

    (req as Request & { user: typeof payload }).user = payload;
    return true;
  }
}
