import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CheckoutDto } from './dto/checkout.dto';
import { CheckoutService } from './checkout.service';

/**
 * Público, sin guard — Documento 4, Flujo 5 / Documento 8, sección 3: un
 * visitante sin cuenta debe poder comprar un curso pago directamente desde
 * el sitio público, igual que `InscripcionController` para cursos gratis.
 */
@ApiTags('enrollment-payments')
@Controller()
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('cursos/:cursoId/checkout')
  crearPreferencia(
    @Param('cursoId') cursoId: string,
    @Body() dto: CheckoutDto,
    @Req() req: Request,
  ) {
    return this.checkoutService.crearPreferencia(cursoId, dto, req);
  }

  /**
   * Público — Mercado Pago llama acá directo, sin pasar por el header de
   * tenant de apps/web (el tenant se resuelve adentro vía `user_id` del
   * payload, ver `CheckoutService.procesarWebhook`). La firma se verifica
   * antes de procesar nada (Documento 8, sección 4).
   */
  @Post('pagos/mercado-pago/checkout-webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(
    @Body() body: { type: string; data: { id: string }; user_id?: number | string },
    @Headers('x-signature') xSignature: string | undefined,
    @Headers('x-request-id') xRequestId: string | undefined,
  ) {
    const firmaValida = this.checkoutService.verifyWebhookSignature(
      body.data?.id,
      xSignature,
      xRequestId,
    );
    if (!firmaValida) {
      throw new BadRequestException(
        'Firma de webhook inválida — no se pudo confirmar que venga de Mercado Pago',
      );
    }
    return this.checkoutService.procesarWebhook(body);
  }
}
