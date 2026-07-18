import { Module } from '@nestjs/common';
import { SecurityModule } from '../../common/security/security.module';
import { ClaseAdjuntoController } from './clase-adjunto.controller';
import { ClaseAdjuntoService } from './clase-adjunto.service';
import { ClaseController } from './clase.controller';
import { ClaseService } from './clase.service';
import { CursoController } from './curso.controller';
import { CursoPublicoController } from './curso-publico.controller';
import { CursoService } from './curso.service';
import { ModuloController } from './modulo.controller';
import { ModuloService } from './modulo.service';

/**
 * Bounded context: Curso, Modulo, Clase, ClaseAdjunto, CursoInstructor.
 * Documento 9 (Sistema de Cursos).
 */
@Module({
  imports: [SecurityModule],
  controllers: [
    CursoController,
    CursoPublicoController,
    ModuloController,
    ClaseController,
    ClaseAdjuntoController,
  ],
  providers: [CursoService, ModuloService, ClaseService, ClaseAdjuntoService],
})
export class CourseCatalogModule {}
