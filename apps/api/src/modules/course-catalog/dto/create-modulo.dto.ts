import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateModuloDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  titulo!: string;

  @IsOptional()
  orden?: number;
}
