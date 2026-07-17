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

/** Guard para rutas del panel del Alumno — Documento 7, sección 2. */
@Injectable()
export class AlumnoAuthGuard implements CanActivate {
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

    if (payload.aud !== 'alumno') {
      throw new UnauthorizedException('Token de otra audiencia');
    }

    if (payload.tenantId !== this.tenantContext.getTenantId()) {
      throw new UnauthorizedException('Sesión no corresponde a esta academia');
    }

    (req as Request & { user: typeof payload }).user = payload;
    return true;
  }
}
