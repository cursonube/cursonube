import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GRACIA_IMPAGO_DIAS } from './mercado-pago-billing.config';

/**
 * Documento 6, sección 4 / U1: "al vencer [el período de gracia] sin
 * regularizar, bloquea el panel de gestión". Nada dispara esa transición
 * por sí solo con el paso del tiempo — hace falta un barrido periódico que
 * la detecte, no basta con reaccionar a webhooks entrantes.
 *
 * `@nestjs/schedule` (cron in-process) alcanza para esto — no se justifica
 * levantar BullMQ/Redis solo para un barrido diario de bajo volumen
 * (Documento 2 reserva BullMQ para colas de trabajo, no para scheduling).
 */
@Injectable()
export class SuspensionSweepService {
  private readonly logger = new Logger(SuspensionSweepService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async barrerSuscripcionesVencidas() {
    const limite = new Date();
    limite.setDate(limite.getDate() - GRACIA_IMPAGO_DIAS);

    const vencidasFueraDeGracia =
      await this.prisma.suscripcionAcademia.findMany({
        where: { estado: 'Vencida', updatedAt: { lt: limite } },
        select: { tenantId: true },
      });

    if (vencidasFueraDeGracia.length === 0) {
      return;
    }

    const tenantIds = [
      ...new Set(vencidasFueraDeGracia.map((s) => s.tenantId)),
    ];
    const resultado = await this.prisma.academia.updateMany({
      where: { id: { in: tenantIds }, estado: 'Activa' },
      data: { estado: 'Suspendida' },
    });

    if (resultado.count > 0) {
      this.logger.warn(
        `Panel suspendido por impago tras agotar el período de gracia (${GRACIA_IMPAGO_DIAS} días) en ${resultado.count} academia(s).`,
      );
    }
  }
}
