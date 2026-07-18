import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AlumnoAuthGuard } from '../../common/security/alumno-auth.guard';
import { CurrentUser } from '../../common/security/current-user.decorator';
import {
  SET_PASSWORD_TOKEN_COOKIE,
  SessionTokenPayload,
} from '../../common/security/jwt.config';
import { AlumnoAuthService } from './alumno-auth.service';
import { CambiarPasswordAlumnoDto } from './dto/cambiar-password-alumno.dto';
import { DefinirPasswordDto } from './dto/definir-password.dto';
import { LoginAlumnoDto } from './dto/login-alumno.dto';

@ApiTags('identity-access')
@Controller('auth/alumno')
export class AlumnoAuthController {
  constructor(private readonly alumnoAuthService: AlumnoAuthService) {}

  @Post('login')
  login(
    @Body() dto: LoginAlumnoDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.alumnoAuthService.login(dto, res);
  }

  @Post('definir-password')
  definirPassword(
    @Req() req: Request,
    @Body() dto: DefinirPasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.[SET_PASSWORD_TOKEN_COOKIE];
    if (!token) {
      throw new UnauthorizedException(
        'Falta el link de activación de la cuenta',
      );
    }
    return this.alumnoAuthService.definirPassword(token, dto, res);
  }

  @Get('me')
  @UseGuards(AlumnoAuthGuard)
  me(@CurrentUser() user: SessionTokenPayload) {
    return this.alumnoAuthService.me(user.sub);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    this.alumnoAuthService.logout(res);
    return { ok: true };
  }

  @Post('cambiar-password')
  @UseGuards(AlumnoAuthGuard)
  cambiarPassword(
    @CurrentUser() user: SessionTokenPayload,
    @Body() dto: CambiarPasswordAlumnoDto,
  ) {
    return this.alumnoAuthService.cambiarPassword(user.sub, dto);
  }
}
