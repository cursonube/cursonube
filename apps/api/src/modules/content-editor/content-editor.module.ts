import { Module } from '@nestjs/common';
import { SecurityModule } from '../../common/security/security.module';
import { BloqueController } from './bloque.controller';
import { BloqueService } from './bloque.service';
import { LeadController } from './lead.controller';
import { LeadService } from './lead.service';
import { PaginaController } from './pagina.controller';
import { PaginaService } from './pagina.service';

/**
 * Bounded context: Pagina, Bloque (catálogo cerrado de 12 tipos), Lead.
 * Documento 5 (Diseño del Editor por Bloques).
 */
@Module({
  imports: [SecurityModule],
  controllers: [PaginaController, BloqueController, LeadController],
  providers: [PaginaService, BloqueService, LeadService],
})
export class ContentEditorModule {}
