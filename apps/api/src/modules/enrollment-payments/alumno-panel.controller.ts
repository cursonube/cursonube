import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AlumnoAuthGuard } from '../../common/security/alumno-auth.guard';
import { CurrentUser } from '../../common/security/current-user.decorator';
import type { SessionTokenPayload } from '../../common/security/jwt.config';
import { AlumnoPanelService } from './alumno-panel.service';

@ApiTags('enrollment-payments')
@UseGuards(AlumnoAuthGuard)
@Controller()
export class AlumnoPanelController {
  constructor(private readonly alumnoPanelService: AlumnoPanelService) {}

  @Get('alumno/mis-cursos')
  misCursos(@CurrentUser() user: SessionTokenPayload) {
    return this.alumnoPanelService.misCursos(user.sub);
  }

  @Get('alumno/mis-compras')
  misCompras(@CurrentUser() user: SessionTokenPayload) {
    return this.alumnoPanelService.misCompras(user.sub);
  }

  @Get('cursos/:cursoId/contenido')
  cursoContenido(
    @Param('cursoId') cursoId: string,
    @CurrentUser() user: SessionTokenPayload,
  ) {
    return this.alumnoPanelService.cursoContenido(user.sub, cursoId);
  }
}
