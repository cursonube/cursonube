import { Global, Module } from '@nestjs/common';
import { TenantContextModule } from '../tenant-context/tenant-context.module';
import { PrismaService } from './prisma.service';
import {
  TENANT_SCOPED_PRISMA,
  tenantScopedPrismaProvider,
} from './tenant-scoped-prisma.provider';

@Global()
@Module({
  imports: [TenantContextModule],
  providers: [PrismaService, tenantScopedPrismaProvider],
  exports: [PrismaService, TENANT_SCOPED_PRISMA],
})
export class PrismaModule {}
