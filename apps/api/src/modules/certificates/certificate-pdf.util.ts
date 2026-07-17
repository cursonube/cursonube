// pdfkit exporta vía module.exports plano (CommonJS) — el import por
// defecto de ESM/TS interpreta mal ese shape en este runtime; import-equals
// es la forma correcta de interop para este caso, no un require() evitable.
// eslint-disable-next-line @typescript-eslint/no-require-imports
import PDFDocument = require('pdfkit');

export interface CertificateData {
  alumnoNombre: string;
  cursoTitulo: string;
  academiaNombre: string;
  fechaEmision: Date;
  codigoVerificacion: string;
}

/**
 * Documento 9, sección 5: el PDF usa un snapshot de estos datos — quedan
 * fijos para siempre, sin importar cambios posteriores al curso/academia
 * (Documento 9, decisión C1).
 *
 * Almacenamiento en disco local para esta etapa de desarrollo — Documento 2
 * definía Cloudflare R2, que queda pendiente de credenciales reales (mismo
 * criterio que Mercado Pago). El nombre del archivo y el modelo de datos no
 * cambian cuando se migre a R2, solo dónde se guarda el buffer generado acá.
 */
export function generateCertificatePdf(data: CertificateData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4',
      margin: 50,
    });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const fecha = data.fechaEmision.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    doc
      .rect(20, 20, doc.page.width - 40, doc.page.height - 40)
      .lineWidth(2)
      .stroke('#4F46E5');

    doc
      .fontSize(14)
      .fillColor('#6B7280')
      .text(data.academiaNombre.toUpperCase(), { align: 'center' })
      .moveDown(2);

    doc
      .fontSize(32)
      .fillColor('#111827')
      .text('Certificado de Finalización', { align: 'center' })
      .moveDown(2);

    doc
      .fontSize(14)
      .fillColor('#374151')
      .text('Se certifica que', { align: 'center' })
      .moveDown(0.5);

    doc
      .fontSize(26)
      .fillColor('#4F46E5')
      .text(data.alumnoNombre, { align: 'center' })
      .moveDown(0.5);

    doc
      .fontSize(14)
      .fillColor('#374151')
      .text('completó satisfactoriamente el curso', { align: 'center' })
      .moveDown(0.5);

    doc
      .fontSize(20)
      .fillColor('#111827')
      .text(data.cursoTitulo, { align: 'center' })
      .moveDown(2);

    doc
      .fontSize(11)
      .fillColor('#6B7280')
      .text(`Emitido el ${fecha}`, { align: 'center' })
      .moveDown(0.5)
      .text(`Código de verificación: ${data.codigoVerificacion}`, {
        align: 'center',
      });

    doc.end();
  });
}
