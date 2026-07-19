import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginaService } from './pagina.service';

/**
 * Público, sin guard — Documento 5: el renderizador del sitio de la
 * academia. Separado de `PaginaController` (admin, guardado) para no
 * mezclar una ruta pública con una protegida en el mismo controller.
 */
@ApiTags('content-editor')
@Controller('sitio-publico')
export class SitioPublicoController {
  constructor(private readonly paginaService: PaginaService) {}

  @Get('pagina')
  getPagina(@Query('slug') slug: string = '') {
    return this.paginaService.getPublicadaPorSlug(slug);
  }
}
