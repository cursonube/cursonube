import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { generateId } from '../../common/id/generate-id';
import {
  TENANT_SCOPED_PRISMA,
  TenantScopedPrismaClient,
} from '../../common/prisma/tenant-scoped-prisma.provider';
import { TenantContextService } from '../../common/tenant-context/tenant-context.service';
import { CreateBloqueDto } from './dto/create-bloque.dto';
import { UpdateBloqueDto } from './dto/update-bloque.dto';

/**
 * `Bloque` y `Pagina` (su padre) — Documento 3: `Pagina` sí tiene `tenantId`
 * (la extensión de Prisma la filtra automáticamente), pero `Bloque` NO tiene
 * `tenantId` propio, se aísla indirectamente vía `paginaId`. Por eso este
 * servicio valida a mano que la Pagina padre pertenezca al tenant actual
 * antes de tocar cualquier Bloque — la extensión automática (Documento 2,
 * sección 5) no alcanza a cubrir este caso por sí sola.
 */
@Injectable()
export class BloqueService {
  constructor(
    @Inject(TENANT_SCOPED_PRISMA)
    private readonly tenantScopedPrisma: TenantScopedPrismaClient,
    private readonly tenantContext: TenantContextService,
  ) {}

  private async assertPaginaDelTenant(paginaId: string) {
    // Pagina es tenant-scoped: si esto encuentra algo, ya sabemos que
    // pertenece al tenant actual (Documento 2, sección 5).
    const pagina = await this.tenantScopedPrisma.pagina.findFirst({
      where: { id: paginaId },
    });
    if (!pagina) {
      throw new NotFoundException('La página indicada no existe');
    }
    return pagina;
  }

  /**
   * 404, nunca 403, para un bloque de otro tenant — no confirmarle a un
   * atacante que el recurso existe en algún lado (Documento 16).
   */
  private async findBloqueDelTenantOrFail(bloqueId: string) {
    const bloque = await this.tenantScopedPrisma.bloque.findFirst({
      where: { id: bloqueId },
      include: { pagina: true },
    });

    if (
      !bloque ||
      bloque.pagina.tenantId !== this.tenantContext.requireTenantId()
    ) {
      throw new NotFoundException('El bloque indicado no existe');
    }

    return bloque;
  }

  async listByPagina(paginaId: string) {
    await this.assertPaginaDelTenant(paginaId);
    return this.tenantScopedPrisma.bloque.findMany({
      where: { paginaId },
      orderBy: { orden: 'asc' },
    });
  }

  async create(paginaId: string, dto: CreateBloqueDto) {
    await this.assertPaginaDelTenant(paginaId);

    const orden =
      dto.orden ??
      (await this.tenantScopedPrisma.bloque.count({ where: { paginaId } }));

    return this.tenantScopedPrisma.bloque.create({
      data: {
        id: generateId(),
        paginaId,
        tipo: dto.tipo,
        propiedades: dto.propiedades as Prisma.InputJsonValue,
        orden,
      },
    });
  }

  async update(bloqueId: string, dto: UpdateBloqueDto) {
    await this.findBloqueDelTenantOrFail(bloqueId);
    return this.tenantScopedPrisma.bloque.update({
      where: { id: bloqueId },
      data: { propiedades: dto.propiedades as Prisma.InputJsonValue },
    });
  }

  async duplicate(bloqueId: string) {
    const original = await this.findBloqueDelTenantOrFail(bloqueId);
    const count = await this.tenantScopedPrisma.bloque.count({
      where: { paginaId: original.paginaId },
    });
    return this.tenantScopedPrisma.bloque.create({
      data: {
        id: generateId(),
        paginaId: original.paginaId,
        tipo: original.tipo,
        propiedades: original.propiedades as Prisma.InputJsonValue,
        orden: count,
      },
    });
  }

  async remove(bloqueId: string) {
    await this.findBloqueDelTenantOrFail(bloqueId);
    await this.tenantScopedPrisma.bloque.delete({ where: { id: bloqueId } });
  }

  /**
   * Documento 4, Flujo 3: reordenar por drag/mover arriba-abajo. Recibe la
   * lista completa de ids en el orden final; valida que todos pertenezcan a
   * la misma página del tenant actual antes de aplicar nada.
   */
  async reorder(paginaId: string, bloqueIds: string[]) {
    await this.assertPaginaDelTenant(paginaId);

    const bloquesExistentes = await this.tenantScopedPrisma.bloque.findMany({
      where: { paginaId },
      select: { id: true },
    });
    const idsExistentes = new Set(bloquesExistentes.map((b) => b.id));

    const idsValidos =
      bloqueIds.length === idsExistentes.size &&
      bloqueIds.every((id) => idsExistentes.has(id));

    if (!idsValidos) {
      throw new NotFoundException(
        'La lista de bloques no coincide con los bloques actuales de la página',
      );
    }

    await this.tenantScopedPrisma.$transaction(
      bloqueIds.map((id, orden) =>
        this.tenantScopedPrisma.bloque.update({
          where: { id },
          data: { orden },
        }),
      ),
    );
  }
}
