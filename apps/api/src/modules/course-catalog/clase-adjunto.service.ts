import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { generateId } from '../../common/id/generate-id';
import {
  TENANT_SCOPED_PRISMA,
  TenantScopedPrismaClient,
} from '../../common/prisma/tenant-scoped-prisma.provider';
import { TenantContextService } from '../../common/tenant-context/tenant-context.service';
import { CreateClaseAdjuntoDto } from './dto/create-clase-adjunto.dto';
import { UpdateClaseAdjuntoDto } from './dto/update-clase-adjunto.dto';

/**
 * `ClaseAdjunto` no tiene `tenantId` propio (Documento 3) — se aísla vía
 * `Clase` → `Modulo` → `Curso`, igual que `Clase` se aísla vía `Modulo`.
 */
@Injectable()
export class ClaseAdjuntoService {
  constructor(
    @Inject(TENANT_SCOPED_PRISMA)
    private readonly tenantScopedPrisma: TenantScopedPrismaClient,
    private readonly tenantContext: TenantContextService,
  ) {}

  private async assertClaseDelTenant(claseId: string) {
    const clase = await this.tenantScopedPrisma.clase.findFirst({
      where: { id: claseId },
      include: { modulo: { include: { curso: true } } },
    });
    if (
      !clase ||
      clase.modulo.curso.tenantId !== this.tenantContext.requireTenantId()
    ) {
      throw new NotFoundException('La clase indicada no existe');
    }
    return clase;
  }

  private async findAdjuntoDelTenantOrFail(adjuntoId: string) {
    const adjunto = await this.tenantScopedPrisma.claseAdjunto.findFirst({
      where: { id: adjuntoId },
      include: { clase: { include: { modulo: { include: { curso: true } } } } },
    });
    if (
      !adjunto ||
      adjunto.clase.modulo.curso.tenantId !==
        this.tenantContext.requireTenantId()
    ) {
      throw new NotFoundException('El adjunto indicado no existe');
    }
    return adjunto;
  }

  async listByClase(claseId: string) {
    await this.assertClaseDelTenant(claseId);
    return this.tenantScopedPrisma.claseAdjunto.findMany({
      where: { claseId },
      orderBy: { orden: 'asc' },
    });
  }

  async create(claseId: string, dto: CreateClaseAdjuntoDto) {
    await this.assertClaseDelTenant(claseId);
    const orden =
      dto.orden ??
      (await this.tenantScopedPrisma.claseAdjunto.count({
        where: { claseId },
      }));

    return this.tenantScopedPrisma.claseAdjunto.create({
      data: {
        id: generateId(),
        claseId,
        tipo: dto.tipo,
        url: dto.url,
        nombreVisible: dto.nombreVisible,
        orden,
      },
    });
  }

  async update(adjuntoId: string, dto: UpdateClaseAdjuntoDto) {
    await this.findAdjuntoDelTenantOrFail(adjuntoId);
    return this.tenantScopedPrisma.claseAdjunto.update({
      where: { id: adjuntoId },
      data: {
        tipo: dto.tipo,
        url: dto.url,
        nombreVisible: dto.nombreVisible,
      },
    });
  }

  async remove(adjuntoId: string) {
    await this.findAdjuntoDelTenantOrFail(adjuntoId);
    await this.tenantScopedPrisma.claseAdjunto.delete({
      where: { id: adjuntoId },
    });
  }

  async reorder(claseId: string, adjuntoIds: string[]) {
    await this.assertClaseDelTenant(claseId);

    const existentes = await this.tenantScopedPrisma.claseAdjunto.findMany({
      where: { claseId },
      select: { id: true },
    });
    const idsExistentes = new Set(existentes.map((a) => a.id));
    const valido =
      adjuntoIds.length === idsExistentes.size &&
      adjuntoIds.every((id) => idsExistentes.has(id));

    if (!valido) {
      throw new NotFoundException(
        'La lista de adjuntos no coincide con los adjuntos actuales de la clase',
      );
    }

    await this.tenantScopedPrisma.$transaction(
      adjuntoIds.map((id, orden) =>
        this.tenantScopedPrisma.claseAdjunto.update({
          where: { id },
          data: { orden },
        }),
      ),
    );
  }
}
