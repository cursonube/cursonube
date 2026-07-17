import { Module } from '@nestjs/common';
import { SecurityModule } from '../../common/security/security.module';
import { CuentaPagoCreadorController } from './cuenta-pago-creador.controller';
import { CuentaPagoCreadorService } from './cuenta-pago-creador.service';
import { InscripcionController } from './inscripcion.controller';
import { InscripcionService } from './inscripcion.service';
import { ProgresoClaseController } from './progreso-clase.controller';
import { ProgresoClaseService } from './progreso-clase.service';

/**
 * Bounded context: CuentaPagoCreador, Inscripcion, ProgresoClase, Pago.
 * Pagos alumno→creador vía Mercado Pago (OAuth), guest checkout.
 * Documento 8 (Sistema de Pagos).
 *
 * Implementado hoy: inscripción a cursos Gratis (guest-checkout completo),
 * progreso por clase (dispara CourseCompletedEvent al 100%), conexión OAuth
 * de CuentaPagoCreador (con credenciales reales, verificación pendiente de
 * un dominio HTTPS). Checkout de cursos pagos y webhooks quedan pendientes.
 */
@Module({
  imports: [SecurityModule],
  controllers: [
    InscripcionController,
    CuentaPagoCreadorController,
    ProgresoClaseController,
  ],
  providers: [
    InscripcionService,
    CuentaPagoCreadorService,
    ProgresoClaseService,
  ],
})
export class EnrollmentPaymentsModule {}
