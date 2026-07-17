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
import { CreateModuloDto } from './dto/create-modulo.dto';
import { ReorderModulosDto } from './dto/reorder-modulos.dto';
import { UpdateModuloDto } from './dto/update-modulo.dto';
import { ModuloService } from './modulo.service';

@ApiTags('course-catalog')
@UseGuards(AcademiaUsuarioAuthGuard)
@Controller('cursos/:cursoId/modulos')
export class ModuloController {
  constructor(private readonly moduloService: ModuloService) {}

  @Get()
  list(@Param('cursoId') cursoId: string) {
    return this.moduloService.listByCurso(cursoId);
  }

  @Post()
  create(@Param('cursoId') cursoId: string, @Body() dto: CreateModuloDto) {
    return this.moduloService.create(cursoId, dto);
  }

  @Patch(':moduloId')
  update(@Param('moduloId') moduloId: string, @Body() dto: UpdateModuloDto) {
    return this.moduloService.update(moduloId, dto);
  }

  @Delete(':moduloId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('moduloId') moduloId: string) {
    await this.moduloService.remove(moduloId);
  }

  @Post('reordenar')
  reorder(@Param('cursoId') cursoId: string, @Body() dto: ReorderModulosDto) {
    return this.moduloService.reorder(cursoId, dto.moduloIds);
  }
}
