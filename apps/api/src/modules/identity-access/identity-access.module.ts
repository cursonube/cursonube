import { Module } from '@nestjs/common';
import { SecurityModule } from '../../common/security/security.module';
import { AcademiaUsuarioAuthController } from './academia-usuario-auth.controller';
import { AcademiaUsuarioAuthService } from './academia-usuario-auth.service';
import { AlumnoAuthController } from './alumno-auth.controller';
import { AlumnoAuthService } from './alumno-auth.service';

/**
 * Bounded context: CursonubeStaff, AcademiaUsuario (Owner/Admin/Profesor/Editor), Alumno.
 * Tres audiencias de autenticación distintas — Documento 7 (Autenticación y Permisos).
 *
 * Implementado hoy: AcademiaUsuario y Alumno (login + guard + guest-checkout
 * set-password). CursonubeStaff (2FA, Documento 7 sección 6) e invitaciones
 * de Profesor/Editor quedan para una próxima pasada.
 */
@Module({
  imports: [SecurityModule],
  controllers: [AcademiaUsuarioAuthController, AlumnoAuthController],
  providers: [AcademiaUsuarioAuthService, AlumnoAuthService],
})
export class IdentityAccessModule {}
