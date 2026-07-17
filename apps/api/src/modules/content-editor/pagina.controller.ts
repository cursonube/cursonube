import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AcademiaUsuarioAuthGuard } from '../../common/security/academia-usuario-auth.guard';
import { PaginaService } from './pagina.service';

@ApiTags('content-editor')
@UseGuards(AcademiaUsuarioAuthGuard)
@Controller('paginas')
export class PaginaController {
  constructor(private readonly paginaService: PaginaService) {}

  @Get()
  list() {
    return this.paginaService.list();
  }

  @Get(':paginaId')
  getOne(@Param('paginaId') paginaId: string) {
    return this.paginaService.getWithBloques(paginaId);
  }
}
