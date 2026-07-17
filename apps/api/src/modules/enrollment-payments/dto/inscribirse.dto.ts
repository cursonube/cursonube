import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Documento 4, Flujo 5: nombre/email solo son obligatorios si no hay ya una
 * sesión de Alumno activa (el servicio lo valida, no el DTO — acá ambos son
 * opcionales para permitir el caso "ya estoy logueado").
 */
export class InscribirseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  nombre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;
}
