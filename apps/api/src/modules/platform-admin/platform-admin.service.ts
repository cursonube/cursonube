import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { generateId } from '../../common/id/generate-id';
import type { SessionTokenPayload } from '../../common/security/jwt.config';
import { CambiarPlanAcademiaDto } from './dto/cambiar-plan-academia.dto';
import { ListAcademiasDto } from './dto/list-academias.dto';

/**
 * Documento 4, Flujo 9 — Panel de Administración interno (Staff de
 * Cursonube). Cruza todos los tenants a propósito (es el único lugar del
 * sistema que legítimamente lo hace) — por eso usa `PrismaService` crudo en
 * vez de `TenantScopedPrismaClient` en todo este servicio.
 */
@Injectable()
export class PlatformAdminService {
  constructor(private readonly prisma: PrismaService) {}

  listAcademias(dto: ListAcademiasDto) {
    return this.prisma.academia.findMany({
      where: {
        ...(dto.estado ? { estado: dto.estado } : {}),
        ...(dto.busqueda
          ? {
              OR: [
                { nombre: { contains: dto.busqueda, mode: 'insensitive' } },
                { subdominio: { contains: dto.busqueda, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async requireAcademia(id: string) {
    const academia = await this.prisma.academia.findUnique({
      where: { id },
      include: { plan: true },
    });
    if (!academia) {
      throw new NotFoundException('La academia indicada no existe');
    }
    return academia;
  }

  async getAcademia(id: string) {
    const academia = await this.requireAcademia(id);

    const [suscripcion, alumnosCount, pagos] = await Promise.all([
      this.prisma.suscripcionAcademia.findFirst({
        where: { tenantId: id },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.alumno.count({ where: { tenantId: id } }),
      this.prisma.pago.findMany({
        where: { tenantId: id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    return { academia, suscripcion, alumnosCount, pagos };
  }

  async suspender(id: string, staff: SessionTokenPayload) {
    await this.requireAcademia(id);
    const academia = await this.prisma.academia.update({
      where: { id },
      data: { estado: 'Suspendida' },
    });
    await this.registrarAuditLog(staff.sub, id, 'academia.suspendida', {});
    return academia;
  }

  async reactivar(id: string, staff: SessionTokenPayload) {
    await this.requireAcademia(id);
    const academia = await this.prisma.academia.update({
      where: { id },
      data: { estado: 'Activa' },
    });
    await this.registrarAuditLog(staff.sub, id, 'academia.reactivada', {});
    return academia;
  }

  /** Documento 4, Flujo 9, punto 4 — cambio de plan manual para casos de soporte. */
  async cambiarPlan(
    id: string,
    dto: CambiarPlanAcademiaDto,
    staff: SessionTokenPayload,
  ) {
    await this.requireAcademia(id);
    const plan = await this.prisma.plan.findUnique({
      where: { slug: dto.planSlug },
    });
    if (!plan) {
      throw new NotFoundException('El plan indicado no existe');
    }

    const academia = await this.prisma.academia.update({
      where: { id },
      data: { planId: plan.id },
    });
    await this.registrarAuditLog(staff.sub, id, 'plan.modificado', {
      planSlug: dto.planSlug,
    });
    return academia;
  }

  async getAuditLog(id: string) {
    await this.requireAcademia(id);
    return this.prisma.auditLog.findMany({
      where: { tenantId: id },
      include: { staff: { select: { email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Documento 4, Flujo 9, punto 5 — estadísticas globales. */
  async getEstadisticas() {
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const [tenantsActivos, altasDelMes, academiasActivas] = await Promise.all([
      this.prisma.academia.count({ where: { estado: 'Activa' } }),
      this.prisma.academia.count({ where: { createdAt: { gte: inicioMes } } }),
      this.prisma.academia.findMany({
        where: { estado: 'Activa' },
        include: { plan: true },
      }),
    ]);

    const mrrCentavos = academiasActivas.reduce(
      (suma, academia) => suma + (academia.plan.precioMensualCentavos ?? 0),
      0,
    );

    return { tenantsActivos, altasDelMes, mrrCentavos };
  }

  private async registrarAuditLog(
    staffId: string,
    tenantId: string | null,
    accion: string,
    metadata: Record<string, unknown>,
  ) {
    await this.prisma.auditLog.create({
      data: {
        id: generateId(),
        staffId,
        tenantId,
        accion,
        metadata: metadata as Prisma.InputJsonValue,
      },
    });
  }
}
