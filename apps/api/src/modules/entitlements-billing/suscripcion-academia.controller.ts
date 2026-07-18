import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AcademiaUsuarioAuthGuard } from '../../common/security/academia-usuario-auth.guard';
import { CurrentUser } from '../../common/security/current-user.decorator';
import type { SessionTokenPayload } from '../../common/security/jwt.config';
import { SkipSuspensionCheck } from '../../common/security/skip-suspension-check.decorator';
import { CambiarPlanDto } from './dto/cambiar-plan.dto';
import { SuscripcionAcademiaService } from './suscripcion-academia.service';

@ApiTags('entitlements-billing')
@Controller()
export class SuscripcionAcademiaController {
  constructor(
    private readonly suscripcionAcademiaService: SuscripcionAcademiaService,
  ) {}

  @Get('planes')
  listPlanes() {
    return this.suscripcionAcademiaService.listPlanes();
  }

  /**
   * Documento 6, sección 4: el Owner necesita poder ver/cambiar su plan
   * incluso con el panel suspendido por impago — si no, no hay forma de
   * salir del bloqueo desde adentro.
   */
  @Get('billing/suscripcion')
  @UseGuards(AcademiaUsuarioAuthGuard)
  @SkipSuspensionCheck()
  getEstado(@CurrentUser() user: SessionTokenPayload) {
    return this.suscripcionAcademiaService.getEstado(user);
  }

  @Post('billing/suscripcion')
  @UseGuards(AcademiaUsuarioAuthGuard)
  @SkipSuspensionCheck()
  cambiarPlan(
    @CurrentUser() user: SessionTokenPayload,
    @Body() dto: CambiarPlanDto,
  ) {
    return this.suscripcionAcademiaService.cambiarPlan(
      user,
      dto.planSlug,
      dto.payerEmail ?? '',
    );
  }

  /**
   * Público — Mercado Pago llama acá directo, sin pasar por el header de
   * tenant de apps/web (mismo caso que el callback OAuth de Enrollment
   * Payments). La firma se verifica antes de procesar nada (Documento 8,
   * sección 4).
   */
  @Post('billing/webhook/mercado-pago')
  @HttpCode(HttpStatus.OK)
  async webhook(
    @Body() body: { type: string; data: { id: string } },
    @Headers('x-signature') xSignature: string | undefined,
    @Headers('x-request-id') xRequestId: string | undefined,
  ) {
    const firmaValida = this.suscripcionAcademiaService.verifyWebhookSignature(
      body.data?.id,
      xSignature,
      xRequestId,
    );
    if (!firmaValida) {
      throw new BadRequestException(
        'Firma de webhook inválida — no se pudo confirmar que venga de Mercado Pago',
      );
    }
    return this.suscripcionAcademiaService.procesarWebhook(body);
  }
}
