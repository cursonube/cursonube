import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AcademiaUsuarioAuthGuard } from '../../common/security/academia-usuario-auth.guard';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@UseGuards(AcademiaUsuarioAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  get() {
    return this.dashboardService.getDashboard();
  }
}
