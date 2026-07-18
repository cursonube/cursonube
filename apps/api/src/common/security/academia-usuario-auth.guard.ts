import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../tenant-context/tenant-context.service';
import { ACCESS_TOKEN_COOKIE } from './jwt.config';
import { SessionService } from './session.service';
import { SKIP_SUSPENSION_CHECK_KEY } from './skip-suspension-check.decorator';

/**
 * Guard para rutas del panel de gestión (Owner/Administrador/Profesor/
 * Editor) — Documento 7, sección 2. Un guard concreto por audiencia (no uno
 * genérico parametrizable) porque hoy solo existe esta audiencia
 * implementada; Alumno y Staff tendrán el suyo cuando se construyan.
 *
 * También implementa el bloqueo por impago (Documento 6, sección 4 / U1):
 * toda ruta detrás de este guard ES el "panel de gestión" que la política
 * bloquea — el sitio público y el panel del Alumno no pasan por acá, así
 * que quedan exentos automáticamente, tal como exige la decisión U1.
 */
@Injectable()
export class AcademiaUsuarioAuthGuard implements CanActivate {
  constructor(
    private readonly sessionService: SessionService,
    private readonly tenantContext: TenantContextService,
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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

    const skipSuspensionCheck = this.reflector.getAllAndOverride<boolean>(
      SKIP_SUSPENSION_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!skipSuspensionCheck) {
      const academia = await this.prisma.academia.findFirst({
        where: { id: payload.tenantId },
        select: { estado: true },
      });
      if (academia?.estado === 'Suspendida') {
        throw new ForbiddenException(
          'El panel de gestión está bloqueado por falta de pago — regularizá tu suscripción con Cursonube para recuperar el acceso',
        );
      }
    }

    (req as Request & { user: typeof payload }).user = payload;
    return true;
  }
}
