import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AcademiaUsuarioAuthGuard } from '../../common/security/academia-usuario-auth.guard';
import { CurrentUser } from '../../common/security/current-user.decorator';
import type { SessionTokenPayload } from '../../common/security/jwt.config';
import { CheckSubdomainDto } from './dto/check-subdomain.dto';
import { CreateAcademiaDto } from './dto/create-academia.dto';
import { SubdomainAvailabilityDto } from './dto/subdomain-availability.dto';
import { UpdateAcademiaDto } from './dto/update-academia.dto';
import { TenancyService } from './tenancy.service';

@ApiTags('tenancy')
@Controller()
export class TenancyController {
  constructor(private readonly tenancyService: TenancyService) {}

  /** Documento 4, Flujo 1, Paso 3 — catálogo de plantillas, mismo criterio que GET /planes. */
  @Get('plantillas')
  listPlantillas() {
    return this.tenancyService.listPlantillas();
  }

  @Get('academias/disponibilidad')
  @ApiOkResponse({ type: SubdomainAvailabilityDto })
  checkSubdomain(@Query() query: CheckSubdomainDto) {
    return this.tenancyService.checkSubdomainAvailability(query.subdominio);
  }

  @Post('academias')
  create(@Body() dto: CreateAcademiaDto) {
    return this.tenancyService.createAcademia(dto);
  }

  /** Documento 5 — branding público para el header del sitio (sin guard). */
  @Get('academias/branding-publico')
  getBrandingPublico() {
    return this.tenancyService.getBrandingPublico();
  }

  @Get('academias/mi-academia')
  @UseGuards(AcademiaUsuarioAuthGuard)
  getMiAcademia() {
    return this.tenancyService.getMiAcademia();
  }

  @Patch('academias/mi-academia')
  @UseGuards(AcademiaUsuarioAuthGuard)
  updateMiAcademia(
    @Body() dto: UpdateAcademiaDto,
    @CurrentUser() user: SessionTokenPayload,
  ) {
    return this.tenancyService.updateAcademia(dto, user);
  }
}
