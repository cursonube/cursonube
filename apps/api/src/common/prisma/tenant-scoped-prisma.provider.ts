import { Provider } from '@nestjs/common';
import { TenantContextService } from '../tenant-context/tenant-context.service';
import { PrismaService } from './prisma.service';
import { createTenantScopedExtension } from './tenant-scoped.extension';

export const TENANT_SCOPED_PRISMA = Symbol('TENANT_SCOPED_PRISMA');

function buildTenantScopedPrisma(
  prisma: PrismaService,
  tenantContext: TenantContextService,
) {
  return prisma.$extends(createTenantScopedExtension(tenantContext));
}

/** Tipo del cliente de Prisma con el filtro de tenant/soft-delete ya aplicado. */
export type TenantScopedPrismaClient = ReturnType<
  typeof buildTenantScopedPrisma
>;

/**
 * Provider a inyectar en cualquier módulo de negocio que toque datos de
 * tenant (Documento 2, sección 5) — nunca inyectar `PrismaService` a secas
 * para esos casos, eso salta el filtro automático.
 */
export const tenantScopedPrismaProvider: Provider = {
  provide: TENANT_SCOPED_PRISMA,
  useFactory: buildTenantScopedPrisma,
  inject: [PrismaService, TenantContextService],
};
