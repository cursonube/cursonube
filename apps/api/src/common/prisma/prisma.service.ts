import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Wrapper de PrismaClient para inyección de dependencias en NestJS.
 *
 * TODO (desarrollo, no scaffolding): envolver esto en un TenantScopedRepository
 * que inyecte automáticamente el filtro `tenantId` + `deletedAt: null` en toda
 * query de negocio (Documento 2, sección 5), y setear `app.tenant_id` por
 * conexión/transacción para que las policies de Row-Level Security de Postgres
 * (Documento 2, sección 4 / Documento 6, sección 3) apliquen como segunda barrera.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
