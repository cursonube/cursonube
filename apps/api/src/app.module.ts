import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma/prisma.module';
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
    PrismaModule,
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
export class AppModule {}
