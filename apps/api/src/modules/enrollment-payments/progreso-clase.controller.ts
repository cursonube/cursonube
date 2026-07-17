import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AlumnoAuthGuard } from '../../common/security/alumno-auth.guard';
import { CurrentUser } from '../../common/security/current-user.decorator';
import type { SessionTokenPayload } from '../../common/security/jwt.config';
import { ProgresoClaseService } from './progreso-clase.service';

@ApiTags('enrollment-payments')
@UseGuards(AlumnoAuthGuard)
@Controller()
export class ProgresoClaseController {
  constructor(private readonly progresoClaseService: ProgresoClaseService) {}

  @Post('clases/:claseId/progreso')
  marcarCompletada(
    @Param('claseId') claseId: string,
    @CurrentUser() user: SessionTokenPayload,
  ) {
    return this.progresoClaseService.marcarCompletada(user.sub, claseId);
  }

  @Get('cursos/:cursoId/progreso')
  getProgreso(
    @Param('cursoId') cursoId: string,
    @CurrentUser() user: SessionTokenPayload,
  ) {
    return this.progresoClaseService.getProgreso(user.sub, cursoId);
  }
}
