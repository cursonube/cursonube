import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AcademiaUsuarioAuthGuard } from '../../common/security/academia-usuario-auth.guard';
import { CurrentUser } from '../../common/security/current-user.decorator';
import type { SessionTokenPayload } from '../../common/security/jwt.config';
import { SkipSuspensionCheck } from '../../common/security/skip-suspension-check.decorator';
import { AcademiaUsuarioAuthService } from './academia-usuario-auth.service';
import { LoginAcademiaUsuarioDto } from './dto/login-academia-usuario.dto';

@ApiTags('identity-access')
@Controller('auth/academia')
export class AcademiaUsuarioAuthController {
  constructor(private readonly authService: AcademiaUsuarioAuthService) {}

  @Post('login')
  login(
    @Body() dto: LoginAcademiaUsuarioDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(dto, res);
  }

  /**
   * Documento 6, sección 4 (U1): exento de la suspensión por impago — el
   * layout del panel llama acá para saber quién sos y armar el sidebar en
   * TODA página protegida, incluida la propia de Plan y Facturación. Si
   * este endpoint se bloqueara, la página que el Owner necesita para
   * regularizar el pago sería inalcanzable (bug real encontrado en
   * verificación: el layout entero explotaba con 403 sin manejarlo).
   */
  @Get('me')
  @UseGuards(AcademiaUsuarioAuthGuard)
  @SkipSuspensionCheck()
  me(@CurrentUser() user: SessionTokenPayload) {
    return this.authService.me(user.sub);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    this.authService.logout(res);
    return { ok: true };
  }
}
