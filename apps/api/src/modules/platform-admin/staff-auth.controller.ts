import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CurrentUser } from '../../common/security/current-user.decorator';
import type { SessionTokenPayload } from '../../common/security/jwt.config';
import { StaffAuthGuard } from '../../common/security/staff-auth.guard';
import { LoginStaffDto } from './dto/login-staff.dto';
import { Verificar2faDto } from './dto/verificar-2fa.dto';
import { StaffAuthService } from './staff-auth.service';

/**
 * Documento 7, sección 2 — dominio interno, no expuesto a academias/alumnos.
 * Vive en el dominio raíz (`/staff/...`), nunca bajo un subdominio de tenant.
 */
@ApiTags('platform-admin')
@Controller('staff/auth')
export class StaffAuthController {
  constructor(private readonly staffAuthService: StaffAuthService) {}

  @Post('login')
  login(@Body() dto: LoginStaffDto, @Res({ passthrough: true }) res: Response) {
    return this.staffAuthService.login(dto, res);
  }

  @Post('2fa/verificar')
  verificar2fa(
    @Body() dto: Verificar2faDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.staffAuthService.verificar2fa(dto, req, res);
  }

  @Get('me')
  @UseGuards(StaffAuthGuard)
  me(@CurrentUser() user: SessionTokenPayload) {
    return this.staffAuthService.me(user.sub);
  }

  @Post('logout')
  @UseGuards(StaffAuthGuard)
  logout(@Res({ passthrough: true }) res: Response) {
    this.staffAuthService.logout(res);
    return { ok: true };
  }
}
