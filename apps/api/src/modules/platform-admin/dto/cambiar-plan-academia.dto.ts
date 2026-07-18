import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

/** Documento 4, Flujo 9, punto 4 — cambio de plan manual para casos de soporte. */
export class CambiarPlanAcademiaDto {
  @ApiProperty({ enum: ['Free', 'Starter', 'Pro', 'Business'] })
  @IsIn(['Free', 'Starter', 'Pro', 'Business'])
  planSlug!: 'Free' | 'Starter' | 'Pro' | 'Business';
}
