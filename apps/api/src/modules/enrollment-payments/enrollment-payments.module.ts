import { Module } from '@nestjs/common';

/**
 * Bounded context: CuentaPagoCreador, Inscripcion, ProgresoClase, Pago.
 * Pagos alumno→creador vía Mercado Pago (OAuth), guest checkout.
 * Documento 8 (Sistema de Pagos).
 */
@Module({})
export class EnrollmentPaymentsModule {}
