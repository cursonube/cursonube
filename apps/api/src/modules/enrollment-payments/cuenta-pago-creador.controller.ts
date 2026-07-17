import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AcademiaUsuarioAuthGuard } from '../../common/security/academia-usuario-auth.guard';
import { CuentaPagoCreadorService } from './cuenta-pago-creador.service';

/**
 * Documento 8, sección 2. El callback es público (Mercado Pago redirige acá
 * directo, sin pasar por el header de tenant de apps/web) — la identidad de
 * la academia viaja en el `state` firmado, no en el contexto de la request.
 *
 * Sin página de frontend todavía para redirigir de vuelta (el panel del
 * creador no está construido) — el callback devuelve una confirmación
 * simple en vez de un redirect a una UI que todavía no existe.
 */
@ApiTags('enrollment-payments')
@Controller('pagos/mercado-pago')
export class CuentaPagoCreadorController {
  constructor(
    private readonly cuentaPagoCreadorService: CuentaPagoCreadorService,
  ) {}

  @Get('conectar')
  @UseGuards(AcademiaUsuarioAuthGuard)
  conectar(@Res() res: Response) {
    const url = this.cuentaPagoCreadorService.getAuthorizationUrl();
    return res.redirect(url);
  }

  @Get('callback')
  async callback(@Query('code') code: string, @Query('state') state: string) {
    const cuenta = await this.cuentaPagoCreadorService.handleCallback(
      code,
      state,
    );
    return {
      mensaje:
        'Cuenta de Mercado Pago conectada correctamente. Ya podés cerrar esta ventana.',
      estadoConexion: cuenta.estadoConexion,
    };
  }

  @Get('estado')
  @UseGuards(AcademiaUsuarioAuthGuard)
  estado() {
    return this.cuentaPagoCreadorService.getEstado();
  }
}
