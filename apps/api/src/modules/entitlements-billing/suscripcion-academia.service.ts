import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { generateId } from '../../common/id/generate-id';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  TENANT_SCOPED_PRISMA,
  TenantScopedPrismaClient,
} from '../../common/prisma/tenant-scoped-prisma.provider';
import { TenantContextService } from '../../common/tenant-context/tenant-context.service';
import type { SessionTokenPayload } from '../../common/security/jwt.config';
import {
  CURSONUBE_MP_ACCESS_TOKEN,
  CURSONUBE_MP_WEBHOOK_SECRET,
  MP_PREAPPROVAL_URL,
} from './mercado-pago-billing.config';

interface MpPreapprovalResponse {
  id: string;
  status: string;
  init_point?: string;
  [key: string]: unknown;
}

interface MpWebhookPayload {
  type: string;
  data: { id: string };
  [key: string]: unknown;
}

/**
 * Documento 8, sección 6 — Billing propio de Cursonube (Cursonube -> Academia),
 * vía Mercado Pago Suscripciones (`preapproval`). Distinto del checkout de
 * Enrollment Payments: acá la cuenta de Mercado Pago es la de Cursonube
 * (Documento 8, sección 1), no la de un creador conectado por OAuth.
 *
 * `SuscripcionAcademia` es tenant-scoped (Documento 3) pero `Academia` y
 * `Plan` no lo son — `Academia` es la raíz del tenant y `Plan` es catálogo
 * global (Documento 2, sección 2.3) — de ahí la mezcla de Prisma crudo y
 * tenant-scoped en este servicio, mismo patrón que `TenancyService`.
 */
@Injectable()
export class SuscripcionAcademiaService {
  private readonly logger = new Logger(SuscripcionAcademiaService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(TENANT_SCOPED_PRISMA)
    private readonly tenantScopedPrisma: TenantScopedPrismaClient,
    private readonly tenantContext: TenantContextService,
  ) {}

  private assertOwner(user: SessionTokenPayload) {
    // Documento 7, decisión P2: Plan y facturación es exclusivo del rol
    // Owner. La matriz Rol->Permiso centralizada (P4) queda para más
    // adelante — este chequeo puntual es intencional mientras tanto.
    if (user.rol !== 'Owner') {
      throw new ForbiddenException(
        'Solo el Owner de la academia puede gestionar el plan y la facturación',
      );
    }
  }

  async listPlanes() {
    return this.prisma.plan.findMany({
      where: { activo: true },
      orderBy: { precioMensualCentavos: 'asc' },
    });
  }

  async getEstado(user: SessionTokenPayload) {
    this.assertOwner(user);
    const tenantId = this.tenantContext.requireTenantId();

    const academia = await this.prisma.academia.findFirstOrThrow({
      where: { id: tenantId },
      include: { plan: true },
    });

    const suscripcion =
      await this.tenantScopedPrisma.suscripcionAcademia.findFirst({
        where: { estado: { in: ['Activa', 'Pausada', 'Vencida'] } },
        orderBy: { createdAt: 'desc' },
      });

    return {
      academiaEstado: academia.estado,
      plan: academia.plan,
      suscripcion,
    };
  }

  /**
   * Documento 8, sección 6, punto 1: al elegir/cambiar de plan pago, se
   * crea/actualiza una suscripción `preapproval`. Bajar a Free no requiere
   * Mercado Pago — se cancela la suscripción existente (si había) y se
   * cambia el plan directo, sin facturación futura.
   */
  async cambiarPlan(
    user: SessionTokenPayload,
    planSlug: 'Free' | 'Starter' | 'Pro' | 'Business',
    payerEmail: string,
  ) {
    this.assertOwner(user);
    const tenantId = this.tenantContext.requireTenantId();

    const plan = await this.prisma.plan.findFirst({
      where: { slug: planSlug, activo: true },
    });
    if (!plan) {
      throw new NotFoundException(
        'El plan indicado no existe o no está activo',
      );
    }

    const suscripcionVigente =
      await this.tenantScopedPrisma.suscripcionAcademia.findFirst({
        where: { estado: { in: ['Activa', 'Pausada', 'Vencida'] } },
      });

    if (planSlug === 'Free') {
      if (suscripcionVigente) {
        await this.cancelarPreapproval(
          suscripcionVigente.externalSubscriptionId,
        );
        await this.tenantScopedPrisma.suscripcionAcademia.update({
          where: { id: suscripcionVigente.id },
          data: { estado: 'Cancelada' },
        });
      }
      // Bajar a Free también levanta una suspensión previa por impago — ya
      // no hay nada que cobrar, no tiene sentido seguir bloqueando el panel.
      await this.prisma.academia.update({
        where: { id: tenantId },
        data: { planId: plan.id, estado: 'Activa' },
      });
      return { planId: plan.id, requiereAutorizacion: false };
    }

    if (suscripcionVigente) {
      await this.cancelarPreapproval(suscripcionVigente.externalSubscriptionId);
      await this.tenantScopedPrisma.suscripcionAcademia.update({
        where: { id: suscripcionVigente.id },
        data: { estado: 'Cancelada' },
      });
    }

    const preapproval = await this.crearPreapproval(plan, payerEmail);

    await this.tenantScopedPrisma.suscripcionAcademia.create({
      data: {
        id: generateId(),
        tenantId,
        planId: plan.id,
        proveedorBilling: 'MercadoPago',
        externalSubscriptionId: preapproval.id,
        estado: 'Activa',
        fechaInicio: new Date(),
      },
    });

    await this.prisma.academia.update({
      where: { id: tenantId },
      data: { planId: plan.id },
    });

    return {
      planId: plan.id,
      requiereAutorizacion: true,
      initPoint: preapproval.init_point,
    };
  }

  private async crearPreapproval(
    plan: {
      precioMensualCentavos: number | null;
      moneda: string | null;
      slug: string;
    },
    payerEmail: string,
  ): Promise<MpPreapprovalResponse> {
    const response = await fetch(MP_PREAPPROVAL_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CURSONUBE_MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason: `Plan ${plan.slug} - Cursonube`,
        payer_email: payerEmail,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: (plan.precioMensualCentavos ?? 0) / 100,
          currency_id: plan.moneda ?? 'ARS',
        },
        back_url: 'https://cursonube.com/panel/facturacion',
      }),
    });

    if (!response.ok) {
      const detalle = await response.text();
      this.logger.error(
        `Mercado Pago rechazó la creación de la suscripción: ${detalle}`,
      );
      throw new BadRequestException(
        'No se pudo crear la suscripción en Mercado Pago',
      );
    }

    return (await response.json()) as MpPreapprovalResponse;
  }

  private async cancelarPreapproval(externalSubscriptionId: string) {
    const response = await fetch(
      `${MP_PREAPPROVAL_URL}/${externalSubscriptionId}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${CURSONUBE_MP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'cancelled' }),
      },
    );
    if (!response.ok) {
      const detalle = await response.text();
      this.logger.error(
        `No se pudo cancelar la suscripción ${externalSubscriptionId} en Mercado Pago: ${detalle}`,
      );
      // No relanzamos — igual queremos que el cambio de plan local siga
      // adelante; una suscripción cancelada localmente pero viva en MP se
      // detecta y concilia manualmente (fuera de alcance del MVP).
    }
  }

  /**
   * Documento 8, sección 4: todo webhook se verifica antes de procesarse.
   * Formato real de Mercado Pago: header `x-signature: ts=...,v1=...` +
   * `x-request-id`, HMAC-SHA256 sobre el manifest
   * `id:{data.id};request-id:{x-request-id};ts:{ts};` con el secreto
   * configurado en el panel de la aplicación.
   */
  verifyWebhookSignature(
    dataId: string,
    xSignature: string | undefined,
    xRequestId: string | undefined,
  ): boolean {
    if (!xSignature || !xRequestId || !CURSONUBE_MP_WEBHOOK_SECRET) {
      return false;
    }

    const partes = Object.fromEntries(
      xSignature.split(',').map((par) => {
        const [k, v] = par.split('=');
        return [k?.trim(), v?.trim()];
      }),
    );
    const ts = partes.ts;
    const v1 = partes.v1;
    if (!ts || !v1) {
      return false;
    }

    const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId};ts:${ts};`;
    const firmaEsperada = createHmac('sha256', CURSONUBE_MP_WEBHOOK_SECRET)
      .update(manifest)
      .digest('hex');

    const bufferEsperado = Buffer.from(firmaEsperada, 'utf8');
    const bufferRecibido = Buffer.from(v1, 'utf8');
    if (bufferEsperado.length !== bufferRecibido.length) {
      return false;
    }
    return timingSafeEqual(bufferEsperado, bufferRecibido);
  }

  /**
   * Documento 8, sección 4: procesamiento idempotente. No hay un registro
   * financiero propio por cobro de suscripción en el modelo de datos (a
   * diferencia de `Pago` para alumno->creador) — la idempotencia acá es la
   * propia asignación de `estado`, que no tiene efecto si ya estaba en ese
   * valor.
   */
  async procesarWebhook(payload: MpWebhookPayload) {
    if (payload.type !== 'subscription_preapproval') {
      // Otros tipos (ej. subscription_authorized_payment individual) no
      // cambian el estado agregado que nos interesa acá — el estado de la
      // suscripción en sí (`preapproval.status`) ya resume el resultado.
      return { procesado: false };
    }

    const preapprovalId = payload.data.id;
    const suscripcion = await this.prisma.suscripcionAcademia.findFirst({
      where: { externalSubscriptionId: preapprovalId },
    });
    if (!suscripcion) {
      this.logger.warn(
        `Webhook de una suscripción no reconocida: ${preapprovalId}`,
      );
      return { procesado: false };
    }

    const response = await fetch(`${MP_PREAPPROVAL_URL}/${preapprovalId}`, {
      headers: { Authorization: `Bearer ${CURSONUBE_MP_ACCESS_TOKEN}` },
    });
    if (!response.ok) {
      this.logger.error(
        `No se pudo consultar el estado real de la suscripción ${preapprovalId} en Mercado Pago`,
      );
      return { procesado: false };
    }
    const detalle = (await response.json()) as { status: string };

    const nuevoEstado =
      detalle.status === 'authorized'
        ? 'Activa'
        : detalle.status === 'paused'
          ? 'Pausada'
          : detalle.status === 'cancelled'
            ? 'Cancelada'
            : 'Vencida';

    await this.prisma.suscripcionAcademia.update({
      where: { id: suscripcion.id },
      data: { estado: nuevoEstado },
    });

    // Reactivación: si vuelve a estar Activa, se levanta cualquier
    // suspensión previa del panel por impago.
    if (nuevoEstado === 'Activa') {
      await this.prisma.academia.updateMany({
        where: { id: suscripcion.tenantId, estado: 'Suspendida' },
        data: { estado: 'Activa' },
      });
    }

    return { procesado: true, estado: nuevoEstado };
  }
}
