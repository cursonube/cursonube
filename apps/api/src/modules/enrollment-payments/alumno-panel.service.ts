import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  TENANT_SCOPED_PRISMA,
  TenantScopedPrismaClient,
} from '../../common/prisma/tenant-scoped-prisma.provider';

/**
 * Documento 11 (Panel del Alumno) — lecturas propias del alumno sobre datos
 * que ya existen (Inscripcion, ProgresoClase, Pago, Curso/Modulo/Clase). No
 * agrega modelo nuevo, solo la superficie de API que faltaba para que el
 * panel del alumno pueda consumir contenido (hasta ahora solo existían
 * endpoints de gestión para AcademiaUsuario y de progreso puntual).
 */
@Injectable()
export class AlumnoPanelService {
  constructor(
    @Inject(TENANT_SCOPED_PRISMA)
    private readonly tenantScopedPrisma: TenantScopedPrismaClient,
  ) {}

  /** Documento 11, sección 1: "Mis Cursos" — progreso + estado de acceso. */
  async misCursos(alumnoId: string) {
    const inscripciones = await this.tenantScopedPrisma.inscripcion.findMany({
      where: { alumnoId },
      include: {
        curso: { include: { modulos: { include: { clases: true } } } },
        progresoClases: true,
      },
      orderBy: { fechaInscripcion: 'desc' },
    });

    return inscripciones.map((inscripcion) => {
      const totalClases = inscripcion.curso.modulos.flatMap(
        (m) => m.clases,
      ).length;
      const completadas = inscripcion.progresoClases.filter(
        (p) => p.completado,
      ).length;

      return {
        inscripcionId: inscripcion.id,
        estado: inscripcion.estado,
        fechaInscripcion: inscripcion.fechaInscripcion,
        curso: {
          id: inscripcion.curso.id,
          titulo: inscripcion.curso.titulo,
          slug: inscripcion.curso.slug,
          imagenPortadaUrl: inscripcion.curso.imagenPortadaUrl,
        },
        progreso: {
          totalClases,
          clasesCompletadas: completadas,
          porcentaje:
            totalClases === 0
              ? 0
              : Math.round((completadas / totalClases) * 100),
        },
      };
    });
  }

  /** Documento 11, sección 1: "Mis Compras" — comprobante simple, sin email de recibo separado. */
  async misCompras(alumnoId: string) {
    return this.tenantScopedPrisma.pago.findMany({
      where: { inscripcion: { alumnoId } },
      include: { inscripcion: { include: { curso: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Documento 11, sección 1 ("Un curso al entrar") — sidebar de
   * módulos/clases + adjuntos + progreso, gateado por una Inscripcion real
   * (nunca por estar simplemente logueado: acceder al contenido de un curso
   * ajeno debe dar 404, mismo criterio que el resto del sistema).
   */
  async cursoContenido(alumnoId: string, cursoId: string) {
    const inscripcion = await this.tenantScopedPrisma.inscripcion.findFirst({
      where: { alumnoId, cursoId },
    });
    if (!inscripcion) {
      throw new NotFoundException('No estás inscripto en este curso');
    }

    const curso = await this.tenantScopedPrisma.curso.findFirst({
      where: { id: cursoId },
      include: {
        modulos: {
          orderBy: { orden: 'asc' },
          include: {
            clases: {
              orderBy: { orden: 'asc' },
              include: { adjuntos: { orderBy: { orden: 'asc' } } },
            },
          },
        },
      },
    });
    if (!curso) {
      throw new NotFoundException('El curso indicado no existe');
    }

    const progresos = await this.tenantScopedPrisma.progresoClase.findMany({
      where: { inscripcionId: inscripcion.id, completado: true },
    });
    const completadasIds = new Set(progresos.map((p) => p.claseId));

    return {
      inscripcionEstado: inscripcion.estado,
      curso: {
        id: curso.id,
        titulo: curso.titulo,
        descripcion: curso.descripcion,
      },
      modulos: curso.modulos.map((modulo) => ({
        id: modulo.id,
        titulo: modulo.titulo,
        clases: modulo.clases.map((clase) => ({
          id: clase.id,
          titulo: clase.titulo,
          videoProvider: clase.videoProvider,
          videoExternalId: clase.videoExternalId,
          contenidoTexto: clase.contenidoTexto,
          duracionEstimadaMinutos: clase.duracionEstimadaMinutos,
          completada: completadasIds.has(clase.id),
          adjuntos: clase.adjuntos,
        })),
      })),
    };
  }
}
