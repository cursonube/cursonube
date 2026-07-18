import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlanSlug } from '@prisma/client';
import { IsEmail, IsEnum, ValidateIf } from 'class-validator';

export class CambiarPlanDto {
  @ApiProperty({ enum: PlanSlug })
  @IsEnum(PlanSlug)
  planSlug!: PlanSlug;

  @ApiPropertyOptional({
    description:
      'Obligatorio salvo para bajar a Free — Mercado Pago exige un payer_email para crear la suscripción preapproval',
  })
  @ValidateIf((dto: CambiarPlanDto) => dto.planSlug !== 'Free')
  @IsEmail()
  payerEmail?: string;
}
