import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  COURSE_COMPLETED_EVENT,
  CourseCompletedEvent,
} from '../../common/events/course-completed.event';
import {
  TENANT_SCOPED_PRISMA,
  TenantScopedPrismaClient,
} from '../../common/prisma/tenant-scoped-prisma.provider';
import { TenantContextService } from '../../common/tenant-context/tenant-context.service';

/**
 * Documento 9, sección 4/5 — progreso granular por clase (no solo un %),
 * necesario para "continuar donde lo dejaste", el check de elegibilidad de
 * certificado, y el tilde de completado por clase (Documento 3).
 */
@Injectable()
export class ProgresoClaseService {
  constructor(
    @Inject(TENANT_SCOPED_PRISMA)
    private readonly tenantScopedPrisma: TenantScopedPrismaClient,
    private readonly tenantContext: TenantContextService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private async findInscripcionDelAlumno(alumnoId: string, claseId: string) {
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

    const inscripcion = await this.tenantScopedPrisma.inscripcion.findFirst({
      where: {
        alumnoId,
        cursoId: clase.modulo.cursoId,
        estado: { in: ['Activa', 'Completada'] },
      },
    });
    if (!inscripcion) {
      throw new BadRequestException(
        'No estás inscripto en el curso de esta clase',
      );
    }

    return { clase, inscripcion };
  }

  /** Documento 4, Flujo 7 — marcar completada (automático por video o manual). */
  async marcarCompletada(alumnoId: string, claseId: string) {
    const { clase, inscripcion } = await this.findInscripcionDelAlumno(
      alumnoId,
      claseId,
    );

    await this.tenantScopedPrisma.progresoClase.upsert({
      where: {
        inscripcionId_claseId: { inscripcionId: inscripcion.id, claseId },
      },
      update: { completado: true, fechaCompletado: new Date() },
      create: {
        inscripcionId: inscripcion.id,
        claseId,
        completado: true,
        fechaCompletado: new Date(),
      },
    });

    await this.verificarCursoCompleto(inscripcion.id, clase.modulo.cursoId);

    return this.getProgreso(alumnoId, clase.modulo.cursoId);
  }

  async getProgreso(alumnoId: string, cursoId: string) {
    const curso = await this.tenantScopedPrisma.curso.findFirst({
      where: { id: cursoId },
      include: { modulos: { include: { clases: true } } },
    });
    if (!curso) {
      throw new NotFoundException('El curso indicado no existe');
    }

    const inscripcion = await this.tenantScopedPrisma.inscripcion.findFirst({
      where: { alumnoId, cursoId },
    });
    if (!inscripcion) {
      throw new BadRequestException('No estás inscripto en este curso');
    }

    const todasLasClases = curso.modulos.flatMap((m) => m.clases);
    const progresos = await this.tenantScopedPrisma.progresoClase.findMany({
      where: { inscripcionId: inscripcion.id },
    });
    const completadasIds = new Set(
      progresos.filter((p) => p.completado).map((p) => p.claseId),
    );

    return {
      totalClases: todasLasClases.length,
      clasesCompletadas: completadasIds.size,
      porcentaje:
        todasLasClases.length === 0
          ? 0
          : Math.round((completadasIds.size / todasLasClases.length) * 100),
      claseIdsCompletadas: [...completadasIds],
      cursoCompletado: inscripcion.estado === 'Completada',
    };
  }

  /** Documento 9, sección 5: dispara CourseCompletedEvent al llegar al 100%. */
  private async verificarCursoCompleto(inscripcionId: string, cursoId: string) {
    const curso = await this.tenantScopedPrisma.curso.findFirst({
      where: { id: cursoId },
      include: { modulos: { include: { clases: true } } },
    });
    if (!curso) return;

    const todasLasClases = curso.modulos.flatMap((m) => m.clases);
    if (todasLasClases.length === 0) return;

    const progresos = await this.tenantScopedPrisma.progresoClase.findMany({
      where: { inscripcionId, completado: true },
    });
    const completadasIds = new Set(progresos.map((p) => p.claseId));
    const todasCompletadas = todasLasClases.every((c) =>
      completadasIds.has(c.id),
    );

    if (!todasCompletadas) return;

    const tenantId = this.tenantContext.requireTenantId();
    await this.tenantScopedPrisma.inscripcion.update({
      where: { id: inscripcionId },
      data: { estado: 'Completada', fechaCompletado: new Date() },
    });

    this.eventEmitter.emit(
      COURSE_COMPLETED_EVENT,
      new CourseCompletedEvent(inscripcionId, tenantId),
    );
  }
}
