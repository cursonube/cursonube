import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AcademiaUsuarioAuthGuard } from '../../common/security/academia-usuario-auth.guard';
import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadService } from './lead.service';

@ApiTags('content-editor')
@Controller('leads')
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  /**
   * Público — lo llaman los bloques Newsletter/Contacto del sitio público
   * (Documento 5, sección 6). Documento 6, sección 7: la captura de Leads
   * es explícitamente uno de los endpoints públicos sensibles con rate
   * limiting básico por IP desde el MVP.
   */
  @Post()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  create(@Body() dto: CreateLeadDto) {
    return this.leadService.create(dto);
  }

  @Get()
  @UseGuards(AcademiaUsuarioAuthGuard)
  list() {
    return this.leadService.list();
  }
}
