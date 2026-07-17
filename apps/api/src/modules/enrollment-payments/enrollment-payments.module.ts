import { Module } from '@nestjs/common';
import { SecurityModule } from '../../common/security/security.module';
import { InscripcionController } from './inscripcion.controller';
import { InscripcionService } from './inscripcion.service';

/**
 * Bounded context: CuentaPagoCreador, Inscripcion, ProgresoClase, Pago.
 * Pagos alumno→creador vía Mercado Pago (OAuth), guest checkout.
 * Documento 8 (Sistema de Pagos).
 *
 * Implementado hoy: inscripción a cursos Gratis (guest-checkout completo,
 * Documento 1 D6 / Documento 4 Flujo 5). CuentaPagoCreador, checkout de
 * cursos pagos y webhooks de Mercado Pago quedan pendientes hasta contar
 * con credenciales de desarrollo reales — ver nota en docs/08.
 */
@Module({
  imports: [SecurityModule],
  controllers: [InscripcionController],
  providers: [InscripcionService],
})
export class EnrollmentPaymentsModule {}
