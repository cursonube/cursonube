import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateClaseDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  titulo!: string;

  @ApiPropertyOptional({
    description: 'Link de YouTube No Listado — se valida contra la oEmbed API',
  })
  @IsOptional()
  @IsUrl()
  videoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  contenidoTexto?: string;

  @ApiPropertyOptional({
    description:
      'Manual — la oEmbed API de YouTube no provee duración (Documento 9)',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  duracionEstimadaMinutos?: number;

  @IsOptional()
  orden?: number;
}
