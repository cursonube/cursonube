import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { generateId } from '../../common/id/generate-id';
import {
  TENANT_SCOPED_PRISMA,
  TenantScopedPrismaClient,
} from '../../common/prisma/tenant-scoped-prisma.provider';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TenantContextService } from '../../common/tenant-context/tenant-context.service';
import { EncryptionService } from '../../common/security/encryption.service';
import { verifyMercadoPagoWebhookSignature } from '../../common/security/mercado-pago-webhook.util';
import {
  ACCESS_TOKEN_COOKIE,
  JWT_ACCESS_SECRET,
} from '../../common/security/jwt.config';
import { CheckoutDto } from './dto/checkout.dto';
import {
  MP_CHECKOUT_WEBHOOK_SECRET,
  MP_PAYMENTS_URL,
  MP_PREFERENCES_URL,
} from './mercado-pago.config';

interface CheckoutReferencePayload {
  tenantId: string;
  cursoId: string;
  alumnoId?: string;
  nombre?: string;
  email?: string;
  purpose: 'checkout';
}

interface MpPreferenceResponse {
  id: string;
  init_point?: string;
  [key: string]: unknown;
}

interface MpPaymentWebhookPayload {
  type: string;
  data: { id: string };
  user_id?: number | string;
  [key: string]: unknown;
}

interface MpPaymentDetail {
  status: string;
  external_reference: string;
  transaction_amount: number;
  currency_id: string;
  [key: string]: unknown;
}

/**
 * Documento 8, secciones 2-4 — Checkout Pro alumno->creador. A diferencia de
 * `InscripcionService.inscribirseGratis` (síncrono), acá la `Inscripcion`
 * solo se crea cuando el webhook confirma el pago — nunca antes, porque
 * `Pago.inscripcionId` no es nullable y no hay nada que registrar hasta que
 * el dinero efectivamente se mueve.
 *
 * Procesamiento de webhook síncrono (no vía cola BullMQ) — Documento 8,
 * sección 4 pide procesamiento en background; se mantiene consistencia con
 * `SuscripcionAcademiaService.procesarWebhook` (ya implementado síncrono) en
 * vez de introducir infraestructura nueva asimétrica para un solo flujo.
 * Gap aceptado y documentado, no un olvido.
 */
@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(TENANT_SCOPED_PRISMA)
    private readonly tenantScopedPrisma: TenantScopedPrismaClient,
    private readonly tenantContext: TenantContextService,
    private readonly encryptionService: EncryptionService,
    private readonly jwtService: JwtService,
  ) {}

  async crearPreferencia(cursoId: string, dto: CheckoutDto, req: Request) {
    const tenantId = this.tenantContext.requireTenantId();

    const curso = await this.tenantScopedPrisma.curso.findFirst({
      where: { id: cursoId, estado: 'Publicado' },
    });
    if (!curso) {
      throw new NotFoundException(
        'El curso indicado no existe o no está publicado',
      );
    }
    if (curso.tipoAcceso !== 'PagoUnico') {
      throw new BadRequestException(
        'Este curso es gratuito — no requiere checkout, inscribite directamente',
      );
    }

    const cuenta = await this.tenantScopedPrisma.cuentaPagoCreador.findFirst({
      where: { proveedor: 'MercadoPago', estadoConexion: 'Conectada' },
    });
    if (!cuenta) {
      throw new BadRequestException(
        'Esta academia todavía no tiene Mercado Pago conectado — este curso no puede comprarse',
      );
    }

    const identidad = await this.resolveIdentidad(dto, req, tenantId);

    if (identidad.alumnoId) {
      const yaInscripto = await this.tenantScopedPrisma.inscripcion.findFirst(
        { where: { alumnoId: identidad.alumnoId, cursoId } },
      );
      if (yaInscripto) {
        throw new ConflictException('Ya estás inscripto en este curso');
      }
    }

    const externalReference = this.jwtService.sign(
      {
        tenantId,
        cursoId,
        alumnoId: identidad.alumnoId,
        nombre: identidad.nombre,
        email: identidad.email,
        purpose: 'checkout',
      } satisfies CheckoutReferencePayload,
      { secret: JWT_ACCESS_SECRET, expiresIn: '1h' },
    );

    const accessToken = this.encryptionService.decrypt(
      cuenta.accessTokenEncriptado,
    );

    const response = await fetch(MP_PREFERENCES_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            title: curso.titulo,
            quantity: 1,
            unit_price: (curso.precioCentavos ?? 0) / 100,
            currency_id: curso.moneda ?? 'ARS',
          },
        ],
        payer: identidad.email ? { email: identidad.email } : undefined,
        external_reference: externalReference,
        back_urls: {
          success: 'https://cursonube.com/compra/exito',
          failure: 'https://cursonube.com/compra/error',
          pending: 'https://cursonube.com/compra/pendiente',
        },
        auto_return: 'approved',
      }),
    });

    if (!response.ok) {
      const detalle = await response.text();
      this.logger.error(
        `Mercado Pago rechazó la creación de la preferencia de checkout: ${detalle}`,
      );
      throw new BadRequestException(
        'No se pudo iniciar el checkout con Mercado Pago',
      );
    }

    const preferencia = (await response.json()) as MpPreferenceResponse;
    return { initPoint: preferencia.init_point };
  }

  /**
   * Resuelve la identidad del comprador para viajar en `external_reference`.
   * No valida acá si un email ya tiene cuenta con contraseña (a diferencia
   * de `InscripcionService.resolveAlumno`) — esa decisión se toma recién al
   * confirmarse el pago (ver `procesarWebhook`), porque en este punto el
   * alumno todavía no pagó nada.
   */
  private async resolveIdentidad(
    dto: CheckoutDto,
    req: Request,
    tenantId: string,
  ) {
    const existingToken = req.cookies?.[ACCESS_TOKEN_COOKIE];
    const session = this.tryVerifyAccessToken(existingToken);

    if (session && session.aud === 'alumno' && session.tenantId === tenantId) {
      const alumno = await this.tenantScopedPrisma.alumno.findFirst({
        where: { id: session.sub },
      });
      if (!alumno) {
        throw new UnauthorizedException('Sesión inválida');
      }
      return { alumnoId: alumno.id, nombre: alumno.nombre, email: alumno.email };
    }

    if (!dto.nombre || !dto.email) {
      throw new BadRequestException('Nombre y email son obligatorios');
    }
    return { alumnoId: undefined, nombre: dto.nombre, email: dto.email };
  }

  private tryVerifyAccessToken(token: string | undefined) {
    if (!token) {
      return null;
    }
    try {
      return this.jwtService.verify(token, { secret: JWT_ACCESS_SECRET }) as {
        sub: string;
        aud: string;
        tenantId?: string;
      };
    } catch {
      return null;
    }
  }

  verifyWebhookSignature(
    dataId: string,
    xSignature: string | undefined,
    xRequestId: string | undefined,
  ): boolean {
    return verifyMercadoPagoWebhookSignature(
      MP_CHECKOUT_WEBHOOK_SECRET,
      dataId,
      xSignature,
      xRequestId,
    );
  }

  /**
   * Documento 8, sección 3-4: la fuente de verdad es este webhook, nunca el
   * redirect del browser. Idempotente vía `Pago.externalPaymentId`.
   */
  async procesarWebhook(payload: MpPaymentWebhookPayload) {
    if (payload.type !== 'payment') {
      return { procesado: false };
    }

    const dataId = payload.data.id;
    const mpUserId = String(payload.user_id ?? '');

    const cuenta = await this.prisma.cuentaPagoCreador.findFirst({
      where: { proveedor: 'MercadoPago', externalAccountId: mpUserId },
    });
    if (!cuenta) {
      this.logger.warn(
        `Webhook de checkout de una cuenta de Mercado Pago no reconocida: ${mpUserId}`,
      );
      return { procesado: false };
    }

    return this.tenantContext.run(
      { tenantId: cuenta.tenantId },
      async () => {
        const accessToken = this.encryptionService.decrypt(
          cuenta.accessTokenEncriptado,
        );
        const response = await fetch(`${MP_PAYMENTS_URL}/${dataId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) {
          this.logger.error(
            `No se pudo consultar el pago ${dataId} en Mercado Pago`,
          );
          return { procesado: false };
        }
        const detalle = (await response.json()) as MpPaymentDetail;

        if (detalle.status === 'refunded' || detalle.status === 'charged_back') {
          return this.procesarReembolso(dataId);
        }
        if (detalle.status !== 'approved') {
          // rechazado/cancelado/pendiente: sin Inscripcion ni Pago que crear
          // (Documento 8, sección 3, punto 3 — solo "aprobado" activa algo).
          return { procesado: true, estado: detalle.status };
        }

        const referencia = this.verificarExternalReference(
          detalle.external_reference,
        );

        const pagoExistente = await this.tenantScopedPrisma.pago.findFirst({
          where: { externalPaymentId: dataId },
        });
        if (pagoExistente) {
          return { procesado: true, estado: 'Aprobado' };
        }

        const alumno = await this.resolverAlumnoParaWebhook(
          referencia,
          cuenta.tenantId,
        );

        let inscripcion = await this.tenantScopedPrisma.inscripcion.findFirst({
          where: { alumnoId: alumno.id, cursoId: referencia.cursoId },
        });
        if (!inscripcion) {
          inscripcion = await this.tenantScopedPrisma.inscripcion.create({
            data: {
              id: generateId(),
              tenantId: cuenta.tenantId,
              alumnoId: alumno.id,
              cursoId: referencia.cursoId,
              estado: 'Activa',
            },
          });
        }

        await this.tenantScopedPrisma.pago.create({
          data: {
            id: generateId(),
            tenantId: cuenta.tenantId,
            inscripcionId: inscripcion.id,
            proveedor: 'MercadoPago',
            externalPaymentId: dataId,
            montoCentavos: Math.round(detalle.transaction_amount * 100),
            moneda: detalle.currency_id,
            estado: 'Aprobado',
          },
        });

        return { procesado: true, estado: 'Aprobado' };
      },
    );
  }

  /**
   * A diferencia de `InscripcionService.resolveAlumno` (bloquea si el email
   * ya tiene contraseña, exige login), acá el pago ya se efectivizó — no
   * bloquear y sí adjuntar la compra a la cuenta existente por email es la
   * única opción razonable (Documento 1, D6): la alternativa sería cobrar y
   * no dar acceso a nadie.
   */
  private async resolverAlumnoParaWebhook(
    referencia: CheckoutReferencePayload,
    tenantId: string,
  ) {
    if (referencia.alumnoId) {
      const existente = await this.tenantScopedPrisma.alumno.findFirst({
        where: { id: referencia.alumnoId },
      });
      if (existente) {
        return existente;
      }
    }

    if (referencia.email) {
      const existente = await this.tenantScopedPrisma.alumno.findFirst({
        where: { email: referencia.email },
      });
      if (existente) {
        return existente;
      }
    }

    return this.tenantScopedPrisma.alumno.create({
      data: {
        id: generateId(),
        tenantId,
        email: referencia.email ?? '',
        nombre: referencia.nombre ?? 'Alumno',
      },
    });
  }

  private async procesarReembolso(dataId: string) {
    const pago = await this.tenantScopedPrisma.pago.findFirst({
      where: { externalPaymentId: dataId },
    });
    if (!pago) {
      this.logger.warn(
        `Webhook de reembolso de un pago no reconocido: ${dataId}`,
      );
      return { procesado: false };
    }

    await this.tenantScopedPrisma.pago.update({
      where: { id: pago.id },
      data: { estado: 'Reembolsado' },
    });
    await this.tenantScopedPrisma.inscripcion.update({
      where: { id: pago.inscripcionId },
      data: { estado: 'Cancelada' },
    });

    return { procesado: true, estado: 'Reembolsado' };
  }

  private verificarExternalReference(
    externalReference: string,
  ): CheckoutReferencePayload {
    try {
      const payload = this.jwtService.verify<CheckoutReferencePayload>(
        externalReference,
        { secret: JWT_ACCESS_SECRET },
      );
      if (payload.purpose !== 'checkout') {
        throw new Error('wrong purpose');
      }
      return payload;
    } catch {
      throw new UnauthorizedException(
        'La referencia externa del pago es inválida o expiró',
      );
    }
  }
}
