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

  /**
   * Documento 5 — renderizador público del sitio: solo páginas ya
   * publicadas. `slug` vacío identifica la página Home (Documento 6, sección
   * 2), por eso viaja como query param y no como path param (un segmento de
   * URL vacío no matchea contra `:slug`).
   */
  async getPublicadaPorSlug(slug: string) {
    const pagina = await this.tenantScopedPrisma.pagina.findFirst({
      where: { slug, estado: 'Publicada' },
      include: { bloques: { orderBy: { orden: 'asc' } } },
    });
    if (!pagina) {
      throw new NotFoundException(
        'La página indicada no existe o no está publicada',
      );
    }
    return pagina;
  }
}
