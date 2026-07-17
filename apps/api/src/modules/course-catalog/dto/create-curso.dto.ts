import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoAcceso } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUppercase,
  Length,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateCursoDto {
  @ApiProperty({ example: 'Marketing Digital para Emprendedores' })
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  titulo!: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  descripcion!: string;

  @ApiProperty({ enum: ['Gratis', 'PagoUnico'] })
  @IsEnum(['Gratis', 'PagoUnico'])
  tipoAcceso!: TipoAcceso;

  // Documento 9: pago único + gratis en MVP (Product Book) — precio/moneda
  // son obligatorios solo cuando tipoAcceso = PagoUnico.
  @ApiPropertyOptional()
  @ValidateIf((dto: CreateCursoDto) => dto.tipoAcceso === 'PagoUnico')
  @IsInt()
  @IsPositive()
  precioCentavos?: number;

  @ApiPropertyOptional({ example: 'ARS' })
  @ValidateIf((dto: CreateCursoDto) => dto.tipoAcceso === 'PagoUnico')
  @IsString()
  @IsUppercase()
  @Length(3, 3)
  moneda?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imagenPortadaUrl?: string;
}
