import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Documento 8, sección 3: nombre/email solo son obligatorios si no hay ya
 * una sesión de Alumno activa — mismo criterio que `InscribirseDto`.
 */
export class CheckoutDto {
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
