import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AcademiaUsuarioAuthGuard } from './academia-usuario-auth.guard';
import { AlumnoAuthGuard } from './alumno-auth.guard';
import { EncryptionService } from './encryption.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
import { StaffAuthGuard } from './staff-auth.guard';

@Module({
  imports: [JwtModule.register({})], // secretos/expiración se pasan explícitos por llamada (ver session.service.ts)
  providers: [
    PasswordService,
    SessionService,
    EncryptionService,
    AcademiaUsuarioAuthGuard,
    AlumnoAuthGuard,
    StaffAuthGuard,
  ],
  exports: [
    JwtModule,
    PasswordService,
    SessionService,
    EncryptionService,
    AcademiaUsuarioAuthGuard,
    AlumnoAuthGuard,
    StaffAuthGuard,
  ],
})
export class SecurityModule {}
