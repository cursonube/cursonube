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
import { AddInstructorDto } from './dto/add-instructor.dto';
import { CreateCursoDto } from './dto/create-curso.dto';
import { UpdateCursoDto } from './dto/update-curso.dto';
import { CursoService } from './curso.service';

@ApiTags('course-catalog')
@UseGuards(AcademiaUsuarioAuthGuard)
@Controller('cursos')
export class CursoController {
  constructor(private readonly cursoService: CursoService) {}

  @Get()
  list() {
    return this.cursoService.list();
  }

  @Post()
  create(@Body() dto: CreateCursoDto) {
    return this.cursoService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cursoService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCursoDto) {
    return this.cursoService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.cursoService.remove(id);
  }

  @Post(':id/publicar')
  publish(@Param('id') id: string) {
    return this.cursoService.publish(id);
  }

  @Post(':id/despublicar')
  unpublish(@Param('id') id: string) {
    return this.cursoService.unpublish(id);
  }

  @Post(':id/instructores')
  addInstructor(@Param('id') id: string, @Body() dto: AddInstructorDto) {
    return this.cursoService.addInstructor(id, dto);
  }

  @Delete(':id/instructores/:academiaUsuarioId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeInstructor(
    @Param('id') id: string,
    @Param('academiaUsuarioId') academiaUsuarioId: string,
  ) {
    await this.cursoService.removeInstructor(id, academiaUsuarioId);
  }
}
