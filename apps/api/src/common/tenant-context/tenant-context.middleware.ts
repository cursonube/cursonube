import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from './tenant-context.service';

/**
 * Header que apps/web agrega a cada request hecha en nombre de una academia
 * (resuelta por su propio middleware de subdominio, Documento 6/17). Lleva
 * el subdominio en texto plano — este middleware es quien lo traduce al
 * `tenantId` interno.
 */
export const TENANT_SUBDOMAIN_HEADER = 'x-cursonube-tenant-subdomain';

/**
 * Resolución de tenant en el backend — Documento 6, sección 1, pasos 2-3.
 *
 * TODO (desarrollo, no scaffolding): cachear esta resolución en Redis por
 * hostname (Documento 6, sección 1, paso 2) — hoy pega contra Postgres en
 * cada request, aceptable para desarrollo temprano pero no para producción.
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const subdominio = req.header(TENANT_SUBDOMAIN_HEADER);

    if (!subdominio) {
      // Sin header: la request sigue sin TenantContext. Los endpoints que
      // requieren tenant fallan explícitamente vía requireTenantId() — nunca
      // se asume un tenant por defecto.
      return next();
    }

    const academia = await this.prisma.academia.findFirst({
      where: { subdominio, deletedAt: null },
      select: { id: true },
    });

    if (!academia) {
      return next();
    }

    this.tenantContext.run({ tenantId: academia.id }, () => next());
  }
}
