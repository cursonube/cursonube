import { Injectable, Logger } from '@nestjs/common';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // recomendado para GCM

/**
 * Cifrado en reposo — Documento 16, sección 2: AES-256-GCM, clave gestionada
 * fuera del repo (secrets manager en producción, Documento 16 sección 6).
 * Usado hoy para `CuentaPagoCreador.accessTokenEncriptado` (Documento 3).
 */
@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly key: Buffer;

  constructor() {
    const secret =
      process.env.ENCRYPTION_KEY ?? 'dev-only-encryption-key-change-me';
    if (
      process.env.NODE_ENV === 'production' &&
      secret.startsWith('dev-only')
    ) {
      this.logger.error(
        'ENCRYPTION_KEY no configurada en producción — usando default de desarrollo. Ver Documento 16, sección 6.',
      );
    }
    // scrypt deriva una clave de 32 bytes (AES-256) a partir del secreto —
    // evita depender de que ENCRYPTION_KEY tenga exactamente el largo justo.
    this.key = scryptSync(secret, 'cursonube-encryption-salt', 32);
  }

  encrypt(plain: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plain, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    // iv + authTag + ciphertext, todo en un solo string base64 para guardar en una columna.
    return Buffer.concat([iv, authTag, encrypted]).toString('base64');
  }

  decrypt(encoded: string): string {
    const buffer = Buffer.from(encoded, 'base64');
    const iv = buffer.subarray(0, IV_LENGTH);
    const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + 16);
    const ciphertext = buffer.subarray(IV_LENGTH + 16);

    const decipher = createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString('utf8');
  }
}
