import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  TENANT_SCOPED_PRISMA,
  TenantScopedPrismaClient,
} from '../../common/prisma/tenant-scoped-prisma.provider';

@Injectable()
export class PaginaService {
  constructor(
    @Inject(TENANT_SCOPED_PRISMA)
    private readonly tenantScopedPrisma: TenantScopedPrismaClient,
  ) {}

  list() {
    return this.tenantScopedPrisma.pagina.findMany({
      orderBy: { tipo: 'asc' },
    });
  }

  async getWithBloques(paginaId: string) {
    const pagina = await this.tenantScopedPrisma.pagina.findFirst({
      where: { id: paginaId },
      include: { bloques: { orderBy: { orden: 'asc' } } },
    });
    if (!pagina) {
      throw new NotFoundException('La página indicada no existe');
    }
    return pagina;
  }
}
