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
import { BloqueService } from './bloque.service';
import { CreateBloqueDto } from './dto/create-bloque.dto';
import { ReorderBloquesDto } from './dto/reorder-bloques.dto';
import { UpdateBloqueDto } from './dto/update-bloque.dto';

/**
 * Documento 4, Flujo 3 (editor de bloques). Protegido por
 * AcademiaUsuarioAuthGuard — la matriz fina de permisos por rol (Editor solo
 * borrador, Documento 7 sección 4/P3) queda para una próxima pasada; hoy
 * cualquier AcademiaUsuario autenticado de la academia puede editar.
 */
@ApiTags('content-editor')
@UseGuards(AcademiaUsuarioAuthGuard)
@Controller('paginas/:paginaId/bloques')
export class BloqueController {
  constructor(private readonly bloqueService: BloqueService) {}

  @Get()
  list(@Param('paginaId') paginaId: string) {
    return this.bloqueService.listByPagina(paginaId);
  }

  @Post()
  create(@Param('paginaId') paginaId: string, @Body() dto: CreateBloqueDto) {
    return this.bloqueService.create(paginaId, dto);
  }

  @Patch(':bloqueId')
  update(@Param('bloqueId') bloqueId: string, @Body() dto: UpdateBloqueDto) {
    return this.bloqueService.update(bloqueId, dto);
  }

  @Post(':bloqueId/duplicar')
  duplicate(@Param('bloqueId') bloqueId: string) {
    return this.bloqueService.duplicate(bloqueId);
  }

  @Delete(':bloqueId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('bloqueId') bloqueId: string) {
    await this.bloqueService.remove(bloqueId);
  }

  @Post('reordenar')
  reorder(@Param('paginaId') paginaId: string, @Body() dto: ReorderBloquesDto) {
    return this.bloqueService.reorder(paginaId, dto.bloqueIds);
  }
}
