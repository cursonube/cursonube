import { Module } from '@nestjs/common';
import { SecurityModule } from '../../common/security/security.module';
import { ClaseController } from './clase.controller';
import { ClaseService } from './clase.service';
import { CursoController } from './curso.controller';
import { CursoService } from './curso.service';
import { ModuloController } from './modulo.controller';
import { ModuloService } from './modulo.service';

/**
 * Bounded context: Curso, Modulo, Clase, ClaseAdjunto, CursoInstructor.
 * Documento 9 (Sistema de Cursos).
 *
 * Implementado hoy: Curso (CRUD + publicar/despublicar + instructores),
 * Modulo y Clase (CRUD + reordenar), validación de video vía YouTube oEmbed.
 * ClaseAdjunto (PDF/archivo/link) queda para una próxima pasada.
 */
@Module({
  imports: [SecurityModule],
  controllers: [CursoController, ModuloController, ClaseController],
  providers: [CursoService, ModuloService, ClaseService],
})
export class CourseCatalogModule {}
