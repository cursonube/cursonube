import { Inject, Injectable } from '@nestjs/common';
import { generateId } from '../../common/id/generate-id';
import {
  TENANT_SCOPED_PRISMA,
  TenantScopedPrismaClient,
} from '../../common/prisma/tenant-scoped-prisma.provider';
import { TenantContextService } from '../../common/tenant-context/tenant-context.service';
import { CreateLeadDto } from './dto/create-lead.dto';

/**
 * Documento 5, sección 6 / Documento 10, sección 1 ("Contactos") — captura
 * de los bloques Newsletter/Contacto del sitio público. El envío de email
 * de notificación al Owner (mencionado en el Documento 5) queda pendiente
 * de la infraestructura de email transaccional (Resend), todavía no
 * construida — mismo criterio que otras piezas dependientes de
 * infraestructura externa no disponible todavía en este proyecto.
 */
@Injectable()
export class LeadService {
  constructor(
    @Inject(TENANT_SCOPED_PRISMA)
    private readonly tenantScopedPrisma: TenantScopedPrismaClient,
    private readonly tenantContext: TenantContextService,
  ) {}

  create(dto: CreateLeadDto) {
    return this.tenantScopedPrisma.lead.create({
      data: {
        id: generateId(),
        tenantId: this.tenantContext.requireTenantId(),
        origen: dto.origen,
        email: dto.email,
        nombre: dto.nombre,
        mensaje: dto.mensaje,
      },
    });
  }

  list() {
    return this.tenantScopedPrisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
