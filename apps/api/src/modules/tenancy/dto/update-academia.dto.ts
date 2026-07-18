import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsHexColor,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { SUBDOMAIN_FORMAT } from './check-subdomain.dto';

export class UpdateAcademiaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nombre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsHexColor()
  colorPrimario?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsHexColor()
  colorSecundario?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imagenPrincipalUrl?: string;

  @ApiPropertyOptional({
    description:
      'Documento 6, decisión T1 — solo cambiable dentro de la ventana post-creación',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(63)
  @Matches(SUBDOMAIN_FORMAT, {
    message: 'El subdominio solo puede contener minúsculas, números y guiones',
  })
  subdominio?: string;

  @ApiPropertyOptional({
    description:
      'Documento 6, sección 5 — la verificación de propiedad + SSL automático dependen del proveedor de hosting (Documento 14), todavía no desplegado; por ahora se guarda el valor sin verificar',
  })
  @IsOptional()
  @IsString()
  dominioPropio?: string;
}
