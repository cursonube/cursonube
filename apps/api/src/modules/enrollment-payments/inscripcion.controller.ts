import { Body, Controller, Param, Post, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { InscribirseDto } from './dto/inscribirse.dto';
import { InscripcionService } from './inscripcion.service';

/**
 * Público, sin guard — Documento 4, Flujo 5: un visitante sin cuenta debe
 * poder inscribirse a un curso gratis directamente desde el sitio público.
 */
@ApiTags('enrollment-payments')
@Controller('cursos/:cursoId/inscripciones')
export class InscripcionController {
  constructor(private readonly inscripcionService: InscripcionService) {}

  @Post()
  inscribirse(
    @Param('cursoId') cursoId: string,
    @Body() dto: InscribirseDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.inscripcionService.inscribirseGratis(cursoId, dto, req, res);
  }
}
