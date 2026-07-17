import { Module } from '@nestjs/common';
import { SecurityModule } from '../../common/security/security.module';
import { AcademiaUsuarioAuthController } from './academia-usuario-auth.controller';
import { AcademiaUsuarioAuthService } from './academia-usuario-auth.service';

/**
 * Bounded context: CursonubeStaff, AcademiaUsuario (Owner/Admin/Profesor/Editor), Alumno.
 * Tres audiencias de autenticación distintas — Documento 7 (Autenticación y Permisos).
 *
 * Implementado hoy: solo AcademiaUsuario (login + guard). Alumno (guest
 * checkout, Documento 1 D6), CursonubeStaff (2FA, Documento 7 sección 6) e
 * invitaciones de Profesor/Editor quedan para una próxima pasada.
 */
@Module({
  imports: [SecurityModule],
  controllers: [AcademiaUsuarioAuthController],
  providers: [AcademiaUsuarioAuthService],
})
export class IdentityAccessModule {}
