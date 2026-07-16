import { Module } from '@nestjs/common';

/**
 * Bounded context: CursonubeStaff, AcademiaUsuario (Owner/Admin/Profesor/Editor), Alumno.
 * Tres audiencias de autenticación distintas — Documento 7 (Autenticación y Permisos).
 */
@Module({})
export class IdentityAccessModule {}
