import { Module } from '@nestjs/common';
import { SecurityModule } from '../../common/security/security.module';
import { PlatformAdminController } from './platform-admin.controller';
import { PlatformAdminService } from './platform-admin.service';
import { StaffAuthController } from './staff-auth.controller';
import { StaffAuthService } from './staff-auth.service';

/**
 * Bounded context: CursonubeStaff (2FA obligatorio), AuditLog, panel interno
 * de administración (academias, planes, suscripciones, estadísticas).
 * Documento 10, sección "Panel interno de administración".
 */
@Module({
  imports: [SecurityModule],
  controllers: [StaffAuthController, PlatformAdminController],
  providers: [StaffAuthService, PlatformAdminService],
})
export class PlatformAdminModule {}
