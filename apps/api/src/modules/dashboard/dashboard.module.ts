import { Module } from '@nestjs/common';
import { SecurityModule } from '../../common/security/security.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

/**
 * Bounded context: agregación de solo lectura para "Inicio" (Documento 10,
 * sección 2) — no introduce ningún modelo propio, lee de Curso, Pago,
 * Inscripcion, Lead, CuentaPagoCreador y AcademiaUsuario (otros módulos).
 */
@Module({
  imports: [SecurityModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
