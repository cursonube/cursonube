import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CursoService } from './curso.service';

/**
 * Público, sin guard — Documento 4, Flujo 5: la página del curso en el
 * sitio del creador debe poder mostrarse a un visitante sin cuenta. Ruta
 * separada de `CursoController` (que resuelve por `:id` y requiere guard)
 * para no mezclar una ruta pública con una protegida en el mismo controller.
 */
@ApiTags('course-catalog')
@Controller('cursos/publico')
export class CursoPublicoController {
  constructor(private readonly cursoService: CursoService) {}

  @Get(':slug')
  findPublicadoPorSlug(@Param('slug') slug: string) {
    return this.cursoService.findPublicadoPorSlug(slug);
  }
}
