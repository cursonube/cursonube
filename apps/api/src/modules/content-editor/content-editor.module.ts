import { Module } from '@nestjs/common';
import { SecurityModule } from '../../common/security/security.module';
import { BloqueController } from './bloque.controller';
import { BloqueService } from './bloque.service';
import { PaginaController } from './pagina.controller';
import { PaginaService } from './pagina.service';

/**
 * Bounded context: Pagina, Bloque (catálogo cerrado de 12 tipos), Lead.
 * Documento 5 (Diseño del Editor por Bloques).
 *
 * Implementado hoy: CRUD de Bloque + listado de Pagina. Lead (captura de
 * Newsletter/Contacto, Documento 5 decisión E1) queda para una próxima
 * pasada — vive en el sitio público, no en el panel de gestión.
 */
@Module({
  imports: [SecurityModule],
  controllers: [PaginaController, BloqueController],
  providers: [PaginaService, BloqueService],
})
export class ContentEditorModule {}
