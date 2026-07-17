import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AddInstructorDto {
  @ApiProperty()
  @IsUUID('all')
  academiaUsuarioId!: string;
}
