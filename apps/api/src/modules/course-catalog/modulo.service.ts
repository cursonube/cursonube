import {
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
import { CreateModuloDto } from './dto/create-modulo.dto';
import { UpdateModuloDto } from './dto/update-modulo.dto';

/**
 * `Modulo` no tiene `tenantId` propio (Documento 3) — se aísla vía `Curso`.
 * Mismo patrón que `Bloque`/`Pagina` en Content Editor.
 */
@Injectable()
export class ModuloService {
  constructor(
    @Inject(TENANT_SCOPED_PRISMA)
    private readonly tenantScopedPrisma: TenantScopedPrismaClient,
    private readonly tenantContext: TenantContextService,
  ) {}

  private async assertCursoDelTenant(cursoId: string) {
    const curso = await this.tenantScopedPrisma.curso.findFirst({
      where: { id: cursoId },
    });
    if (!curso) {
      throw new NotFoundException('El curso indicado no existe');
    }
    return curso;
  }

  private async findModuloDelTenantOrFail(moduloId: string) {
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

  async listByCurso(cursoId: string) {
    await this.assertCursoDelTenant(cursoId);
    return this.tenantScopedPrisma.modulo.findMany({
      where: { cursoId },
      orderBy: { orden: 'asc' },
    });
  }

  async create(cursoId: string, dto: CreateModuloDto) {
    await this.assertCursoDelTenant(cursoId);
    const orden =
      dto.orden ??
      (await this.tenantScopedPrisma.modulo.count({ where: { cursoId } }));

    return this.tenantScopedPrisma.modulo.create({
      data: { id: generateId(), cursoId, titulo: dto.titulo, orden },
    });
  }

  async update(moduloId: string, dto: UpdateModuloDto) {
    await this.findModuloDelTenantOrFail(moduloId);
    return this.tenantScopedPrisma.modulo.update({
      where: { id: moduloId },
      data: { titulo: dto.titulo },
    });
  }

  /**
   * TODO (desarrollo, Enrollment): si el Curso ya tiene alguna Inscripcion,
   * esto debería soft-delete en vez de bloquear (Documento 9, sección 6) —
   * hoy simplemente se bloquea porque ProgresoClase/Inscripcion todavía no
   * tienen flujo real que preservar.
   */
  async remove(moduloId: string) {
    const modulo = await this.findModuloDelTenantOrFail(moduloId);

    const inscripciones = await this.tenantScopedPrisma.inscripcion.count({
      where: { cursoId: modulo.cursoId },
    });
    if (inscripciones > 0) {
      throw new ConflictException(
        'No se puede eliminar un módulo de un curso con alumnos inscriptos',
      );
    }

    await this.tenantScopedPrisma.$transaction(async (tx) => {
      await tx.claseAdjunto.deleteMany({ where: { clase: { moduloId } } });
      await tx.clase.deleteMany({ where: { moduloId } });
      await tx.modulo.delete({ where: { id: moduloId } });
    });
  }

  async reorder(cursoId: string, moduloIds: string[]) {
    await this.assertCursoDelTenant(cursoId);

    const existentes = await this.tenantScopedPrisma.modulo.findMany({
      where: { cursoId },
      select: { id: true },
    });
    const idsExistentes = new Set(existentes.map((m) => m.id));
    const valido =
      moduloIds.length === idsExistentes.size &&
      moduloIds.every((id) => idsExistentes.has(id));

    if (!valido) {
      throw new NotFoundException(
        'La lista de módulos no coincide con los módulos actuales del curso',
      );
    }

    await this.tenantScopedPrisma.$transaction(
      moduloIds.map((id, orden) =>
        this.tenantScopedPrisma.modulo.update({
          where: { id },
          data: { orden },
        }),
      ),
    );
  }
}
