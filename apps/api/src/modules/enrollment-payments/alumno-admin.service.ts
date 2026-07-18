import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  TENANT_SCOPED_PRISMA,
  TenantScopedPrismaClient,
} from '../../common/prisma/tenant-scoped-prisma.provider';
import type { SessionTokenPayload } from '../../common/security/jwt.config';

/**
 * Documento 10, sección 3 ("Alumnos") — vista del creador sobre sus propios
 * alumnos, distinta del panel del propio Alumno (`alumno-panel.service.ts`).
 * Documento 7 no tiene todavía la matriz Rol->Permiso completa (P4,
 * deferred) — Profesor debería ver solo sus propios cursos, no
 * implementado en esta pasada (mismo criterio que otros módulos: cualquier
 * AcademiaUsuario autenticado puede listar/ver, revocar exige Owner o
 * Administrador).
 */
@Injectable()
export class AlumnoAdminService {
  constructor(
    @Inject(TENANT_SCOPED_PRISMA)
    private readonly tenantScopedPrisma: TenantScopedPrismaClient,
  ) {}

  async listAlumnos(cursoId?: string) {
    const alumnos = await this.tenantScopedPrisma.alumno.findMany({
      where: cursoId ? { inscripciones: { some: { cursoId } } } : {},
      include: {
        inscripciones: {
          where: cursoId ? { cursoId } : {},
          include: {
            curso: { include: { modulos: { include: { clases: true } } } },
            progresoClases: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return alumnos.map((alumno) => ({
      id: alumno.id,
      nombre: alumno.nombre,
      email: alumno.email,
      inscripciones: alumno.inscripciones.map((inscripcion) => {
        const totalClases = inscripcion.curso.modulos.flatMap(
          (m) => m.clases,
        ).length;
        return {
          inscripcionId: inscripcion.id,
          curso: { id: inscripcion.curso.id, titulo: inscripcion.curso.titulo },
          estado: inscripcion.estado,
          fechaInscripcion: inscripcion.fechaInscripcion,
          clasesCompletadas: inscripcion.progresoClases.filter(
            (p) => p.completado,
          ).length,
          totalClases,
        };
      }),
    }));
  }

  async getAlumnoDetalle(alumnoId: string) {
    const alumno = await this.tenantScopedPrisma.alumno.findFirst({
      where: { id: alumnoId },
      include: {
        inscripciones: {
          include: {
            curso: true,
            pagos: true,
            certificado: true,
          },
          orderBy: { fechaInscripcion: 'desc' },
        },
      },
    });
    if (!alumno) {
      throw new NotFoundException('El alumno indicado no existe');
    }

    return {
      id: alumno.id,
      nombre: alumno.nombre,
      email: alumno.email,
      cursos: alumno.inscripciones.map((inscripcion) => ({
        inscripcionId: inscripcion.id,
        curso: { id: inscripcion.curso.id, titulo: inscripcion.curso.titulo },
        estado: inscripcion.estado,
        fechaInscripcion: inscripcion.fechaInscripcion,
        fechaCompletado: inscripcion.fechaCompletado,
      })),
      pagos: alumno.inscripciones.flatMap((inscripcion) =>
        inscripcion.pagos.map((pago) => ({
          id: pago.id,
          curso: inscripcion.curso.titulo,
          montoCentavos: pago.montoCentavos,
          moneda: pago.moneda,
          estado: pago.estado,
          createdAt: pago.createdAt,
        })),
      ),
      certificados: alumno.inscripciones
        .filter((inscripcion) => inscripcion.certificado)
        .map((inscripcion) => ({
          id: inscripcion.certificado!.id,
          curso: inscripcion.curso.titulo,
          codigoVerificacion: inscripcion.certificado!.codigoVerificacion,
          fechaEmision: inscripcion.certificado!.fechaEmision,
        })),
    };
  }

  /**
   * Documento 10, sección 3: Owner/Admin pueden desactivar el acceso de un
   * alumno puntual a UN curso (revoca esa Inscripcion, no la cuenta
   * completa) — casos de soporte o sospecha de fraude.
   */
  async revocarInscripcion(inscripcionId: string, user: SessionTokenPayload) {
    if (user.rol !== 'Owner' && user.rol !== 'Administrador') {
      throw new ForbiddenException(
        'Solo el Owner o un Administrador pueden revocar el acceso de un alumno',
      );
    }

    const inscripcion = await this.tenantScopedPrisma.inscripcion.findFirst({
      where: { id: inscripcionId },
    });
    if (!inscripcion) {
      throw new NotFoundException('La inscripción indicada no existe');
    }

    return this.tenantScopedPrisma.inscripcion.update({
      where: { id: inscripcionId },
      data: { estado: 'Cancelada' },
    });
  }
}
