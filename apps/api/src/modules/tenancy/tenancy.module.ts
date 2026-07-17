import { Module } from '@nestjs/common';
import { SecurityModule } from '../../common/security/security.module';
import { TenancyController } from './tenancy.controller';
import { TenancyService } from './tenancy.service';

/**
 * Bounded context: Academias, subdominios, dominio propio (V1.1), branding/plantilla.
 * Documento 2 (Arquitectura), sección 2.1.
 */
@Module({
  imports: [SecurityModule],
  controllers: [TenancyController],
  providers: [TenancyService],
})
export class TenancyModule {}
