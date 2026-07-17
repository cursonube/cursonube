import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AcademiaUsuarioAuthGuard } from '../../common/security/academia-usuario-auth.guard';
import { ClaseAdjuntoService } from './clase-adjunto.service';
import { CreateClaseAdjuntoDto } from './dto/create-clase-adjunto.dto';
import { ReorderClaseAdjuntosDto } from './dto/reorder-clase-adjuntos.dto';
import { UpdateClaseAdjuntoDto } from './dto/update-clase-adjunto.dto';

@ApiTags('course-catalog')
@UseGuards(AcademiaUsuarioAuthGuard)
@Controller('clases/:claseId/adjuntos')
export class ClaseAdjuntoController {
  constructor(private readonly claseAdjuntoService: ClaseAdjuntoService) {}

  @Get()
  list(@Param('claseId') claseId: string) {
    return this.claseAdjuntoService.listByClase(claseId);
  }

  @Post()
  create(
    @Param('claseId') claseId: string,
    @Body() dto: CreateClaseAdjuntoDto,
  ) {
    return this.claseAdjuntoService.create(claseId, dto);
  }

  @Patch(':adjuntoId')
  update(
    @Param('adjuntoId') adjuntoId: string,
    @Body() dto: UpdateClaseAdjuntoDto,
  ) {
    return this.claseAdjuntoService.update(adjuntoId, dto);
  }

  @Delete(':adjuntoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('adjuntoId') adjuntoId: string) {
    await this.claseAdjuntoService.remove(adjuntoId);
  }

  @Post('reordenar')
  reorder(
    @Param('claseId') claseId: string,
    @Body() dto: ReorderClaseAdjuntosDto,
  ) {
    return this.claseAdjuntoService.reorder(claseId, dto.adjuntoIds);
  }
}
