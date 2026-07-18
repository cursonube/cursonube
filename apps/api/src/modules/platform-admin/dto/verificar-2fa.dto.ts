import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class Verificar2faDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  codigo!: string;
}
