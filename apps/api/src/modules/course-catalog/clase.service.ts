import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { generateId } from '../../common/id/generate-id';
import {
  TENANT_SCOPED_PRISMA,
  TenantScopedPrismaClient,
} from '../../common/prisma/tenant-scoped-prisma.provider';
import { TenantContextService } from '../../common/tenant-context/tenant-context.service';
import { extractYoutubeVideoId, validateYoutubeVideo } from './youtube.util';
import { CreateClaseDto } from './dto/create-clase.dto';
import { UpdateClaseDto } from './dto/update-clase.dto';

/**
 * `Clase` no tiene `tenantId` propio (Documento 3) — se aísla vía
 * `Modulo` → `Curso`, dos niveles hacia arriba (a diferencia de `Bloque`,
 * que solo tiene un nivel vía `Pagina`).
 */
@Injectable()
export class ClaseService {
  constructor(
    @Inject(TENANT_SCOPED_PRISMA)
    private readonly tenantScopedPrisma: TenantScopedPrismaClient,
    private readonly tenantContext: TenantContextService,
  ) {}

  private async assertModuloDelTenant(moduloId: string) {
    const modulo = await this.tenantScopedPrisma.modulo.findFirst({
      where: { id: moduloId },
      include: { curso: true },
    });
    if (
      !modulo ||
      modulo.curso.tenantId !== this.tenantContext.requireTenantId()
    ) {
      throw new NotFoundException('El módulo indicado no existe');
    }
    return modulo;
  }

  private async findClaseDelTenantOrFail(claseId: string) {
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

  /** Documento 9, sección 2: valida existencia contra la oEmbed API antes de guardar. */
  private async resolveVideo(videoUrl?: string) {
    if (!videoUrl) {
      return { videoProvider: null, videoExternalId: null };
    }

    const videoId = extractYoutubeVideoId(videoUrl);
    if (!videoId) {
      throw new BadRequestException(
        'El link no es de YouTube — únicamente YouTube No Listado en el MVP (Documento 1)',
      );
    }

    await validateYoutubeVideo(videoId);
    return {
      videoProvider: 'YoutubeNoListado' as const,
      videoExternalId: videoId,
    };
  }

  async listByModulo(moduloId: string) {
    await this.assertModuloDelTenant(moduloId);
    return this.tenantScopedPrisma.clase.findMany({
      where: { moduloId },
      orderBy: { orden: 'asc' },
      include: { adjuntos: true },
    });
  }

  async create(moduloId: string, dto: CreateClaseDto) {
    await this.assertModuloDelTenant(moduloId);
    const video = await this.resolveVideo(dto.videoUrl);
    const orden =
      dto.orden ??
      (await this.tenantScopedPrisma.clase.count({ where: { moduloId } }));

    return this.tenantScopedPrisma.clase.create({
      data: {
        id: generateId(),
        moduloId,
        titulo: dto.titulo,
        videoProvider: video.videoProvider,
        videoExternalId: video.videoExternalId,
        contenidoTexto: dto.contenidoTexto,
        duracionEstimadaMinutos: dto.duracionEstimadaMinutos,
        orden,
      },
    });
  }

  async update(claseId: string, dto: UpdateClaseDto) {
    await this.findClaseDelTenantOrFail(claseId);

    const data: Record<string, unknown> = {
      titulo: dto.titulo,
      contenidoTexto: dto.contenidoTexto,
      duracionEstimadaMinutos: dto.duracionEstimadaMinutos,
    };

    if (dto.videoUrl !== undefined) {
      const video = await this.resolveVideo(dto.videoUrl);
      data.videoProvider = video.videoProvider;
      data.videoExternalId = video.videoExternalId;
    }

    return this.tenantScopedPrisma.clase.update({
      where: { id: claseId },
      data,
    });
  }

  async remove(claseId: string) {
    const clase = await this.findClaseDelTenantOrFail(claseId);

    const inscripciones = await this.tenantScopedPrisma.inscripcion.count({
      where: { cursoId: clase.modulo.cursoId },
    });
    if (inscripciones > 0) {
      throw new ConflictException(
        'No se puede eliminar una clase de un curso con alumnos inscriptos',
      );
    }

    await this.tenantScopedPrisma.$transaction(async (tx) => {
      await tx.claseAdjunto.deleteMany({ where: { claseId } });
      await tx.clase.delete({ where: { id: claseId } });
    });
  }

  async reorder(moduloId: string, claseIds: string[]) {
    await this.assertModuloDelTenant(moduloId);

    const existentes = await this.tenantScopedPrisma.clase.findMany({
      where: { moduloId },
      select: { id: true },
    });
    const idsExistentes = new Set(existentes.map((c) => c.id));
    const valido =
      claseIds.length === idsExistentes.size &&
      claseIds.every((id) => idsExistentes.has(id));

    if (!valido) {
      throw new NotFoundException(
        'La lista de clases no coincide con las clases actuales del módulo',
      );
    }

    await this.tenantScopedPrisma.$transaction(
      claseIds.map((id, orden) =>
        this.tenantScopedPrisma.clase.update({
          where: { id },
          data: { orden },
        }),
      ),
    );
  }
}
