import { Module } from '@nestjs/common';
import { SecurityModule } from '../../common/security/security.module';
import { CertificadoController } from './certificado.controller';
import { CertificadoService } from './certificado.service';

/**
 * Bounded context: Certificado (PDF + codigo_verificacion generado desde el MVP).
 * Se dispara sobre CourseCompletedEvent emitido por Enrollment. Documento 9, sección 5.
 */
@Module({
  imports: [SecurityModule],
  controllers: [CertificadoController],
  providers: [CertificadoService],
})
export class CertificatesModule {}
