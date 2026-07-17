import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma/prisma.module';
import { TenantContextMiddleware } from './common/tenant-context/tenant-context.middleware';
import { TenantContextModule } from './common/tenant-context/tenant-context.module';
import { TenancyModule } from './modules/tenancy/tenancy.module';
import { IdentityAccessModule } from './modules/identity-access/identity-access.module';
import { EntitlementsBillingModule } from './modules/entitlements-billing/entitlements-billing.module';
import { CourseCatalogModule } from './modules/course-catalog/course-catalog.module';
import { ContentEditorModule } from './modules/content-editor/content-editor.module';
import { EnrollmentPaymentsModule } from './modules/enrollment-payments/enrollment-payments.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PlatformAdminModule } from './modules/platform-admin/platform-admin.module';

@Module({
  imports: [
    // Documento 2, sección 2: eventos de dominio in-process entre módulos
    // (ej. CourseCompletedEvent), nunca un broker externo en esta etapa.
    EventEmitterModule.forRoot(),
    PrismaModule,
    TenantContextModule,
    TenancyModule,
    IdentityAccessModule,
    EntitlementsBillingModule,
    CourseCatalogModule,
    ContentEditorModule,
    EnrollmentPaymentsModule,
    CertificatesModule,
    NotificationsModule,
    PlatformAdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Documento 6, sección 1: resolución de tenant en toda request. Los
    // endpoints que no reciben el header de subdominio simplemente no
    // obtienen TenantContext (ver TenantContextMiddleware).
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}
