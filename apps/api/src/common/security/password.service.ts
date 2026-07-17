import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

/**
 * Hash de contraseñas — Documento 16, sección 2: Argon2, nunca texto plano,
 * en las tres audiencias (CursonubeStaff, AcademiaUsuario, Alumno).
 */
@Injectable()
export class PasswordService {
  hash(plain: string): Promise<string> {
    return argon2.hash(plain);
  }

  verify(hash: string, plain: string): Promise<boolean> {
    return argon2.verify(hash, plain);
  }
}
