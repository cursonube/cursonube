import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AcademiaUsuarioAuthGuard } from './academia-usuario-auth.guard';
import { AlumnoAuthGuard } from './alumno-auth.guard';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';

@Module({
  imports: [JwtModule.register({})], // secretos/expiración se pasan explícitos por llamada (ver session.service.ts)
  providers: [
    PasswordService,
    SessionService,
    AcademiaUsuarioAuthGuard,
    AlumnoAuthGuard,
  ],
  exports: [
    PasswordService,
    SessionService,
    AcademiaUsuarioAuthGuard,
    AlumnoAuthGuard,
  ],
})
export class SecurityModule {}
