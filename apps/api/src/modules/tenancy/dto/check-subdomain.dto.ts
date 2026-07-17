import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

// Documento 1: minúsculas, sin espacios, solo [a-z0-9-]. 63 = límite real de
// un label de DNS — el subdominio se convierte en un hostname real.
export const SUBDOMAIN_FORMAT = /^[a-z0-9-]+$/;

export class CheckSubdomainDto {
  @ApiProperty({ example: 'micurso' })
  @IsString()
  @MinLength(3)
  @MaxLength(63)
  @Matches(SUBDOMAIN_FORMAT, {
    message: 'El subdominio solo puede contener minúsculas, números y guiones',
  })
  subdominio!: string;
}
