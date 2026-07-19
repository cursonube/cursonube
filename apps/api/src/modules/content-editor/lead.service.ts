import { Inject, Injectable } from '@nestjs/common';
import { generateId } from '../../common/id/generate-id';
import { EmailService } from '../../common/email/email.service';
import {
  TENANT_SCOPED_PRISMA,
  TenantScopedPrismaClient,
} from '../../common/prisma/tenant-scoped-prisma.provider';
import { TenantContextService } from '../../common/tenant-context/tenant-context.service';
import { CreateLeadDto } from './dto/create-lead.dto';

/**
 * Documento 5, sección 6 / Documento 10, sección 1 ("Contactos") — captura
 * de los bloques Newsletter/Contacto del sitio público, con notificación
 * por email al Owner (Documento 18, sección 2).
 */
@Injectable()
export class LeadService {
  constructor(
    @Inject(TENANT_SCOPED_PRISMA)
    private readonly tenantScopedPrisma: TenantScopedPrismaClient,
    private readonly tenantContext: TenantContextService,
    private readonly emailService: EmailService,
  ) {}

  async create(dto: CreateLeadDto) {
    const tenantId = this.tenantContext.requireTenantId();

    const lead = await this.tenantScopedPrisma.lead.create({
      data: {
        id: generateId(),
        tenantId,
        origen: dto.origen,
        email: dto.email,
        nombre: dto.nombre,
        mensaje: dto.mensaje,
      },
    });

    const owner = await this.tenantScopedPrisma.academiaUsuario.findFirst({
      where: { rol: 'Owner' },
    });
    if (owner) {
      void this.emailService.send({
        to: owner.email,
        subject:
          dto.origen === 'Contacto'
            ? 'Nuevo mensaje de contacto en tu sitio'
            : 'Nueva suscripción a tu newsletter',
        html: `<p>Recibiste un nuevo contacto desde tu sitio.</p><p>Email: ${dto.email}</p>${dto.nombre ? `<p>Nombre: ${dto.nombre}</p>` : ''}${dto.mensaje ? `<p>Mensaje: ${dto.mensaje}</p>` : ''}`,
      });
    }

    return lead;
  }

  list() {
    return this.tenantScopedPrisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
