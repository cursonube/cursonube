import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AcademiaUsuarioAuthGuard } from '../../common/security/academia-usuario-auth.guard';
import { CurrentUser } from '../../common/security/current-user.decorator';
import type { SessionTokenPayload } from '../../common/security/jwt.config';
import { AlumnoAdminService } from './alumno-admin.service';

@ApiTags('enrollment-payments')
@UseGuards(AcademiaUsuarioAuthGuard)
@Controller()
export class AlumnoAdminController {
  constructor(private readonly alumnoAdminService: AlumnoAdminService) {}

  @Get('alumnos')
  list(@Query('cursoId') cursoId?: string) {
    return this.alumnoAdminService.listAlumnos(cursoId);
  }

  @Get('alumnos/:alumnoId')
  detalle(@Param('alumnoId') alumnoId: string) {
    return this.alumnoAdminService.getAlumnoDetalle(alumnoId);
  }

  @Post('inscripciones/:inscripcionId/revocar')
  revocar(
    @Param('inscripcionId') inscripcionId: string,
    @CurrentUser() user: SessionTokenPayload,
  ) {
    return this.alumnoAdminService.revocarInscripcion(inscripcionId, user);
  }
}
