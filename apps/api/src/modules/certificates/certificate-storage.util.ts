import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Almacenamiento local en disco para esta etapa de desarrollo — ver nota en
 * certificate-pdf.util.ts sobre la migración pendiente a Cloudflare R2
 * (Documento 2), bloqueada por falta de credenciales, mismo criterio que
 * Mercado Pago.
 */
const STORAGE_DIR = join(process.cwd(), 'storage', 'certificados');

function ensureStorageDir() {
  mkdirSync(STORAGE_DIR, { recursive: true });
}

export function saveCertificatePdf(
  certificadoId: string,
  buffer: Buffer,
): void {
  ensureStorageDir();
  writeFileSync(join(STORAGE_DIR, `${certificadoId}.pdf`), buffer);
}

export function readCertificatePdf(certificadoId: string): Buffer {
  return readFileSync(join(STORAGE_DIR, `${certificadoId}.pdf`));
}
