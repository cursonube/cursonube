import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AcademiaUsuarioAuthGuard } from './academia-usuario-auth.guard';
import { AlumnoAuthGuard } from './alumno-auth.guard';
import { EncryptionService } from './encryption.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';

@Module({
  imports: [JwtModule.register({})], // secretos/expiración se pasan explícitos por llamada (ver session.service.ts)
  providers: [
    PasswordService,
    SessionService,
    EncryptionService,
    AcademiaUsuarioAuthGuard,
    AlumnoAuthGuard,
  ],
  exports: [
    JwtModule,
    PasswordService,
    SessionService,
    EncryptionService,
    AcademiaUsuarioAuthGuard,
    AlumnoAuthGuard,
  ],
})
export class SecurityModule {}
