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
@Controller('academias')
export class TenancyController {
  constructor(private readonly tenancyService: TenancyService) {}

  @Get('disponibilidad')
  @ApiOkResponse({ type: SubdomainAvailabilityDto })
  checkSubdomain(@Query() query: CheckSubdomainDto) {
    return this.tenancyService.checkSubdomainAvailability(query.subdominio);
  }

  @Post()
  create(@Body() dto: CreateAcademiaDto) {
    return this.tenancyService.createAcademia(dto);
  }

  @Get('mi-academia')
  @UseGuards(AcademiaUsuarioAuthGuard)
  getMiAcademia() {
    return this.tenancyService.getMiAcademia();
  }

  @Patch('mi-academia')
  @UseGuards(AcademiaUsuarioAuthGuard)
  updateMiAcademia(
    @Body() dto: UpdateAcademiaDto,
    @CurrentUser() user: SessionTokenPayload,
  ) {
    return this.tenancyService.updateAcademia(dto, user);
  }
}
