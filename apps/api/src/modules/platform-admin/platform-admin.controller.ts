import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/security/current-user.decorator';
import type { SessionTokenPayload } from '../../common/security/jwt.config';
import { StaffAuthGuard } from '../../common/security/staff-auth.guard';
import { CambiarPlanAcademiaDto } from './dto/cambiar-plan-academia.dto';
import { ListAcademiasDto } from './dto/list-academias.dto';
import { PlatformAdminService } from './platform-admin.service';

@ApiTags('platform-admin')
@Controller('staff')
@UseGuards(StaffAuthGuard)
export class PlatformAdminController {
  constructor(private readonly platformAdminService: PlatformAdminService) {}

  @Get('academias')
  listAcademias(@Query() dto: ListAcademiasDto) {
    return this.platformAdminService.listAcademias(dto);
  }

  @Get('academias/:id')
  getAcademia(@Param('id') id: string) {
    return this.platformAdminService.getAcademia(id);
  }

  @Post('academias/:id/suspender')
  suspender(@Param('id') id: string, @CurrentUser() staff: SessionTokenPayload) {
    return this.platformAdminService.suspender(id, staff);
  }

  @Post('academias/:id/reactivar')
  reactivar(@Param('id') id: string, @CurrentUser() staff: SessionTokenPayload) {
    return this.platformAdminService.reactivar(id, staff);
  }

  @Patch('academias/:id/plan')
  cambiarPlan(
    @Param('id') id: string,
    @Body() dto: CambiarPlanAcademiaDto,
    @CurrentUser() staff: SessionTokenPayload,
  ) {
    return this.platformAdminService.cambiarPlan(id, dto, staff);
  }

  @Get('academias/:id/audit-log')
  getAuditLog(@Param('id') id: string) {
    return this.platformAdminService.getAuditLog(id);
  }

  @Get('estadisticas')
  getEstadisticas() {
    return this.platformAdminService.getEstadisticas();
  }
}
