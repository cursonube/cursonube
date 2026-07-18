import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrigenLead } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateLeadDto {
  @ApiProperty({ enum: OrigenLead })
  @IsEnum(OrigenLead)
  origen!: OrigenLead;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ description: 'Solo lo completa el bloque Contacto' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  nombre?: string;

  @ApiPropertyOptional({ description: 'Solo lo completa el bloque Contacto' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  mensaje?: string;
}
