import { Module } from '@nestjs/common';
import { SecurityModule } from '../../common/security/security.module';
import { AlumnoAdminController } from './alumno-admin.controller';
import { AlumnoAdminService } from './alumno-admin.service';
import { AlumnoPanelController } from './alumno-panel.controller';
import { AlumnoPanelService } from './alumno-panel.service';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
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
 * checkout Pro para cursos pagos + webhook de confirmación, progreso por
 * clase (dispara CourseCompletedEvent al 100%), conexión OAuth de
 * CuentaPagoCreador (con credenciales reales, verificación pendiente de un
 * dominio HTTPS — igual que el checkout de pago, sin poder probarse en vivo
 * hasta entonces).
 */
@Module({
  imports: [SecurityModule],
  controllers: [
    InscripcionController,
    CheckoutController,
    CuentaPagoCreadorController,
    ProgresoClaseController,
    AlumnoPanelController,
    AlumnoAdminController,
  ],
  providers: [
    InscripcionService,
    CheckoutService,
    CuentaPagoCreadorService,
    ProgresoClaseService,
    AlumnoPanelService,
    AlumnoAdminService,
  ],
})
export class EnrollmentPaymentsModule {}
