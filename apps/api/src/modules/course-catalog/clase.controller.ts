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
import { ClaseService } from './clase.service';
import { CreateClaseDto } from './dto/create-clase.dto';
import { ReorderClasesDto } from './dto/reorder-clases.dto';
import { UpdateClaseDto } from './dto/update-clase.dto';

@ApiTags('course-catalog')
@UseGuards(AcademiaUsuarioAuthGuard)
@Controller('modulos/:moduloId/clases')
export class ClaseController {
  constructor(private readonly claseService: ClaseService) {}

  @Get()
  list(@Param('moduloId') moduloId: string) {
    return this.claseService.listByModulo(moduloId);
  }

  @Post()
  create(@Param('moduloId') moduloId: string, @Body() dto: CreateClaseDto) {
    return this.claseService.create(moduloId, dto);
  }

  @Patch(':claseId')
  update(@Param('claseId') claseId: string, @Body() dto: UpdateClaseDto) {
    return this.claseService.update(claseId, dto);
  }

  @Delete(':claseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('claseId') claseId: string) {
    await this.claseService.remove(claseId);
  }

  @Post('reordenar')
  reorder(@Param('moduloId') moduloId: string, @Body() dto: ReorderClasesDto) {
    return this.claseService.reorder(moduloId, dto.claseIds);
  }
}
