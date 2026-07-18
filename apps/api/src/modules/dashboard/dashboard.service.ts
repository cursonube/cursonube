import { Inject, Injectable } from '@nestjs/common';
import {
  TENANT_SCOPED_PRISMA,
  TenantScopedPrismaClient,
} from '../../common/prisma/tenant-scoped-prisma.provider';

/**
 * Documento 10, sección 2 ("Inicio") — checklist de activación + métricas
 * clave + actividad reciente. Todo derivado de datos ya existentes
 * (Curso, Pago, Inscripcion, Lead, CuentaPagoCreador, AcademiaUsuario),
 * sin infraestructura nueva — es agregación pura.
 */
@Injectable()
export class DashboardService {
  constructor(
    @Inject(TENANT_SCOPED_PRISMA)
    private readonly tenantScopedPrisma: TenantScopedPrismaClient,
  ) {}

  private inicioDeMes() {
    const ahora = new Date();
    return new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  }

  private async getChecklist() {
    const [cursosCount, cuentaPago, academiaUsuariosCount] = await Promise.all([
      this.tenantScopedPrisma.curso.count(),
      this.tenantScopedPrisma.cuentaPagoCreador.findFirst({
        where: { estadoConexion: 'Conectada' },
      }),
      this.tenantScopedPrisma.academiaUsuario.count(),
    ]);

    return {
      tieneCursos: cursosCount > 0,
      tieneMercadoPagoConectado: Boolean(cuentaPago),
      tieneEquipo: academiaUsuariosCount > 1,
    };
  }

  private async getMetricas() {
    const inicioDeMes = this.inicioDeMes();

    const [ventasDelMes, alumnosNuevosDelMes, cursosPublicados, inscripciones] =
      await Promise.all([
        this.tenantScopedPrisma.pago.aggregate({
          where: { estado: 'Aprobado', createdAt: { gte: inicioDeMes } },
          _sum: { montoCentavos: true },
        }),
        this.tenantScopedPrisma.alumno.count({
          where: { createdAt: { gte: inicioDeMes } },
        }),
        this.tenantScopedPrisma.curso.count({ where: { estado: 'Publicado' } }),
        this.tenantScopedPrisma.inscripcion.findMany({
          where: { estado: { in: ['Activa', 'Completada'] } },
          select: { estado: true },
        }),
      ]);

    const completadas = inscripciones.filter(
      (i) => i.estado === 'Completada',
    ).length;
    const tasaFinalizacion =
      inscripciones.length === 0
        ? 0
        : Math.round((completadas / inscripciones.length) * 100);

    return {
      ventasDelMesCentavos: ventasDelMes._sum.montoCentavos ?? 0,
      alumnosNuevosDelMes,
      cursosPublicados,
      tasaFinalizacionPromedio: tasaFinalizacion,
    };
  }

  /**
   * Documento 10, sección 2: "un feed simple de los últimos eventos (nueva
   * venta, nuevo alumno, nuevo Lead) — construido sobre datos ya
   * existentes, sin infraestructura nueva". Se mezclan y ordenan acá en
   * memoria (volumen bajo, no justifica una tabla de eventos dedicada).
   */
  private async getActividadReciente() {
    const [pagos, inscripciones, leads] = await Promise.all([
      this.tenantScopedPrisma.pago.findMany({
        where: { estado: 'Aprobado' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { inscripcion: { include: { curso: true, alumno: true } } },
      }),
      this.tenantScopedPrisma.inscripcion.findMany({
        orderBy: { fechaInscripcion: 'desc' },
        take: 10,
        include: { curso: true, alumno: true },
      }),
      this.tenantScopedPrisma.lead.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    const eventos = [
      ...pagos.map((pago) => ({
        tipo: 'venta' as const,
        fecha: pago.createdAt,
        descripcion: `Nueva venta: ${pago.inscripcion.curso.titulo} — ${pago.inscripcion.alumno.nombre}`,
      })),
      ...inscripciones.map((inscripcion) => ({
        tipo: 'alumno' as const,
        fecha: inscripcion.fechaInscripcion,
        descripcion: `${inscripcion.alumno.nombre} se inscribió en ${inscripcion.curso.titulo}`,
      })),
      ...leads.map((lead) => ({
        tipo: 'lead' as const,
        fecha: lead.createdAt,
        descripcion: `Nuevo contacto (${lead.origen}): ${lead.nombre ?? lead.email}`,
      })),
    ];

    return eventos
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
      .slice(0, 10);
  }

  async getDashboard() {
    const [checklist, metricas, actividadReciente] = await Promise.all([
      this.getChecklist(),
      this.getMetricas(),
      this.getActividadReciente(),
    ]);

    return { checklist, metricas, actividadReciente };
  }
}
