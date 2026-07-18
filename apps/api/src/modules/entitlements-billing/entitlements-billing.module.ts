import { Module } from '@nestjs/common';
import { SecurityModule } from '../../common/security/security.module';
import { SuscripcionAcademiaController } from './suscripcion-academia.controller';
import { SuscripcionAcademiaService } from './suscripcion-academia.service';
import { SuspensionSweepService } from './suspension-sweep.service';

/**
 * Bounded context: Planes de Cursonube (data-driven), SuscripcionAcademia,
 * billing propio de Cursonube vía Mercado Pago Suscripciones.
 * Documento 1 (decisión D3) y Documento 8.
 */
@Module({
  imports: [SecurityModule],
  controllers: [SuscripcionAcademiaController],
  providers: [SuscripcionAcademiaService, SuspensionSweepService],
})
export class EntitlementsBillingModule {}
