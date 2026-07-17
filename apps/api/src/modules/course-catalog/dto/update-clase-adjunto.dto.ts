import { PartialType } from '@nestjs/swagger';
import { CreateClaseAdjuntoDto } from './create-clase-adjunto.dto';

export class UpdateClaseAdjuntoDto extends PartialType(CreateClaseAdjuntoDto) {}
