import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CambiarPasswordAlumnoDto {
  @ApiProperty()
  @IsString()
  passwordActual!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  passwordNueva!: string;
}
