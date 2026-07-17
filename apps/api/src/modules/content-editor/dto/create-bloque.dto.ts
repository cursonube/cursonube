import { ApiProperty } from '@nestjs/swagger';
import { TipoBloque } from '@prisma/client';
import { IsEnum, IsObject, IsOptional } from 'class-validator';

const TIPOS_BLOQUE = [
  'Hero',
  'Texto',
  'Imagen',
  'Video',
  'Cursos',
  'Instructor',
  'Testimonios',
  'Faq',
  'Cta',
  'Newsletter',
  'Contacto',
  'Footer',
] as const;

export class CreateBloqueDto {
  @ApiProperty({ enum: TIPOS_BLOQUE })
  @IsEnum(TIPOS_BLOQUE)
  tipo!: TipoBloque;

  /**
   * Documento 5, sección 5: el shape exacto por tipo de bloque se valida acá
   * a nivel de aplicación en una pasada futura (schema por tipo) — por ahora
   * se acepta cualquier objeto, la DB nunca lo valida (JSONB, Documento 3
   * decisión M3).
   */
  @ApiProperty({ type: 'object', additionalProperties: true })
  @IsObject()
  propiedades!: Record<string, unknown>;

  @IsOptional()
  orden?: number;
}
