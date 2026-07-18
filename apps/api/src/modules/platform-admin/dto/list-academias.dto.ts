import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class ListAcademiasDto {
  @ApiPropertyOptional({ description: 'Busca por nombre o subdominio' })
  @IsOptional()
  @IsString()
  busqueda?: string;

  @ApiPropertyOptional({ enum: ['Activa', 'Suspendida', 'Cancelada'] })
  @IsOptional()
  @IsIn(['Activa', 'Suspendida', 'Cancelada'])
  estado?: 'Activa' | 'Suspendida' | 'Cancelada';
}
