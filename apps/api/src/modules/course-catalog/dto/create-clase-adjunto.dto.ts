import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TipoAdjunto } from '@prisma/client';

export class CreateClaseAdjuntoDto {
  @ApiProperty({ enum: TipoAdjunto })
  @IsEnum(TipoAdjunto)
  tipo!: TipoAdjunto;

  @ApiProperty({
    description:
      'URL del recurso — archivo ya alojado externamente o link (Documento 3); subida propia queda para cuando haya credenciales de Cloudflare R2',
  })
  @IsUrl()
  url!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  nombreVisible!: string;

  @ApiPropertyOptional()
  @IsOptional()
  orden?: number;
}
