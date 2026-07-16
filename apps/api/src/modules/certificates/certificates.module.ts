import { Module } from '@nestjs/common';

/**
 * Bounded context: Certificado (PDF + codigo_verificacion generado desde el MVP).
 * Se dispara sobre CourseCompletedEvent emitido por Course Catalog / Enrollment.
 * Documento 9, sección 5.
 */
@Module({})
export class CertificatesModule {}
