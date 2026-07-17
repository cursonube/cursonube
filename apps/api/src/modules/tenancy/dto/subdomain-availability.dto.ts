import { ApiProperty } from '@nestjs/swagger';

export class SubdomainAvailabilityDto {
  @ApiProperty()
  disponible!: boolean;

  @ApiProperty({ required: false })
  motivo?: string;
}
