import { Module } from '@nestjs/common';

/**
 * Bounded context: CursonubeStaff (2FA obligatorio), AuditLog, panel interno
 * de administración (academias, planes, suscripciones, estadísticas).
 * Documento 10, sección "Panel interno de administración".
 */
@Module({})
export class PlatformAdminModule {}
