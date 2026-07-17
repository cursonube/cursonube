import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  CourseCompletedEvent,
  COURSE_COMPLETED_EVENT,
} from '../../common/events/course-completed.event';
import { generateId } from '../../common/id/generate-id';
import {
  TENANT_SCOPED_PRISMA,
  TenantScopedPrismaClient,
} from '../../common/prisma/tenant-scoped-prisma.provider';
import { TenantContextService } from '../../common/tenant-context/tenant-context.service';
import { generateCertificatePdf } from './certificate-pdf.util';
import {
  readCertificatePdf,
  saveCertificatePdf,
} from './certificate-storage.util';
import { generateVerificationCode } from './verification-code.util';

@Injectable()
export class CertificadoService {
  private readonly logger = new Logger(CertificadoService.name);

  constructor(
    @Inject(TENANT_SCOPED_PRISMA)
    private readonly tenantScopedPrisma: TenantScopedPrismaClient,
    private readonly tenantContext: TenantContextService,
  ) {}

  /**
   * Documento 2/9: Enrollment dispara este evento, Certificates lo escucha
   * sin que Enrollment sepa que este módulo existe. Se reafirma el
   * TenantContext explícitamente con el tenantId del evento — no depende de
   * que el listener herede el contexto ambiente del emisor (Documento 6,
   * sección 3), lo que además deja esto listo para mover a una cola real
   * (BullMQ, Documento 2) sin cambiar esta lógica.
   */
  @OnEvent(COURSE_COMPLETED_EVENT)
  async onCourseCompleted(event: CourseCompletedEvent) {
    await this.tenantContext.run({ tenantId: event.tenantId }, async () => {
      try {
        await this.generarCertificado(event.inscripcionId);
      } catch (error) {
        this.logger.error(
          `No se pudo generar el certificado para la inscripción ${event.inscripcionId}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    });
  }

  private async generarCertificado(inscripcionId: string) {
    const existente = await this.tenantScopedPrisma.certificado.findFirst({
      where: { inscripcionId },
    });
    if (existente) {
      return existente; // idempotente — nunca duplica un certificado ya emitido.
    }

    const inscripcion = await this.tenantScopedPrisma.inscripcion.findFirst({
      where: { id: inscripcionId },
      include: { alumno: true, curso: true, academia: true },
    });
    if (!inscripcion) {
      throw new NotFoundException('La inscripción indicada no existe');
    }

    const codigoVerificacion = generateVerificationCode();
    const fechaEmision = new Date();

    const pdfBuffer = await generateCertificatePdf({
      alumnoNombre: inscripcion.alumno.nombre,
      cursoTitulo: inscripcion.curso.titulo,
      academiaNombre: inscripcion.academia.nombre,
      fechaEmision,
      codigoVerificacion,
    });

    const certificadoId = generateId();
    saveCertificatePdf(certificadoId, pdfBuffer);

    return this.tenantScopedPrisma.certificado.create({
      data: {
        id: certificadoId,
        tenantId: this.tenantContext.requireTenantId(),
        inscripcionId,
        urlPdf: `/api/v1/certificados/${certificadoId}/descargar`,
        codigoVerificacion,
        fechaEmision,
      },
    });
  }

  async listMios(alumnoId: string) {
    return this.tenantScopedPrisma.certificado.findMany({
      where: { inscripcion: { alumnoId } },
      include: { inscripcion: { include: { curso: true } } },
      orderBy: { fechaEmision: 'desc' },
    });
  }

  async getPdfParaDescarga(
    certificadoId: string,
    alumnoId: string,
  ): Promise<Buffer> {
    const certificado = await this.tenantScopedPrisma.certificado.findFirst({
      where: { id: certificadoId },
      include: { inscripcion: true },
    });
    if (!certificado || certificado.inscripcion.alumnoId !== alumnoId) {
      throw new NotFoundException('El certificado indicado no existe');
    }
    return readCertificatePdf(certificado.id);
  }
}
