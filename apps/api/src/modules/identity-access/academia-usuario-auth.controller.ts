import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AcademiaUsuarioAuthGuard } from '../../common/security/academia-usuario-auth.guard';
import { CurrentUser } from '../../common/security/current-user.decorator';
import type { SessionTokenPayload } from '../../common/security/jwt.config';
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

  @Get('me')
  @UseGuards(AcademiaUsuarioAuthGuard)
  me(@CurrentUser() user: SessionTokenPayload) {
    return this.authService.me(user.sub);
  }
}
