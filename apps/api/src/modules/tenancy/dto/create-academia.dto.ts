import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsHexColor,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { SUBDOMAIN_FORMAT } from './check-subdomain.dto';

/**
 * Wizard completo (Documento 1/4): Paso 0 (cuenta del Owner) + Pasos 1-4
 * (academia/subdominio/plantilla/branding) llegan juntos en un solo request,
 * porque `AcademiaUsuario.tenantId` no es nullable — la cuenta del Owner no
 * puede existir antes de que la Academia exista (Documento 3, sección 2.2).
 * El Paso 5 (primer curso) es opcional y se maneja aparte, en Course Catalog.
 */
export class CreateAcademiaDto {
  @ApiProperty({
    example: 'owner@ejemplo.com',
    description: 'Paso 0 del wizard',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(72) // límite práctico de argon2/bcrypt para el input
  password!: string;

  @ApiProperty({ example: 'Mi Academia de Marketing' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nombre!: string;

  @ApiProperty({ example: 'micurso' })
  @IsString()
  @MinLength(3)
  @MaxLength(63)
  @Matches(SUBDOMAIN_FORMAT)
  subdominio!: string;

  @ApiProperty({ description: 'id de una de las 5 plantillas del catálogo' })
  @IsUUID('all') // acepta UUID v7 (Documento 2, decisión A3) — validator.js no distingue v7 explícitamente
  plantillaId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({ example: '#4F46E5' })
  @IsHexColor()
  colorPrimario!: string;

  @ApiProperty({ example: '#111827' })
  @IsHexColor()
  colorSecundario!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imagenPrincipalUrl?: string;
}
