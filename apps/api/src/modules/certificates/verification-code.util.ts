import { randomBytes } from 'node:crypto';

/**
 * Documento 3: `Certificado.codigo_verificacion`, único global, generado
 * desde el MVP aunque la página de verificación por QR sea V1.1.
 */
export function generateVerificationCode(): string {
  return randomBytes(5).toString('hex').toUpperCase();
}
