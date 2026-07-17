import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class ReorderBloquesDto {
  @ApiProperty({
    type: [String],
    description: 'ids de bloque en el nuevo orden',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  bloqueIds!: string[];
}
