import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CheckSubdomainDto } from './dto/check-subdomain.dto';
import { CreateAcademiaDto } from './dto/create-academia.dto';
import { SubdomainAvailabilityDto } from './dto/subdomain-availability.dto';
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
}
