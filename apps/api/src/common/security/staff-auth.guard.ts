import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { ACCESS_TOKEN_COOKIE } from './jwt.config';
import { SessionService } from './session.service';

/**
 * Guard para el Panel interno de Cursonube (Documento 7, sección 2) —
 * `CursonubeStaff` no es tenant-scoped (Documento 3), a diferencia de
 * `AcademiaUsuarioAuthGuard`/`AlumnoAuthGuard` no hay ningún chequeo de
 * tenant acá.
 */
@Injectable()
export class StaffAuthGuard implements CanActivate {
  constructor(private readonly sessionService: SessionService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const token = req.cookies?.[ACCESS_TOKEN_COOKIE];

    if (!token) {
      throw new UnauthorizedException('No hay sesión activa');
    }

    const payload = this.sessionService.verifyAccessToken(token);

    if (payload.aud !== 'staff') {
      throw new UnauthorizedException('Token de otra audiencia');
    }

    (req as Request & { user: typeof payload }).user = payload;
    return true;
  }
}
