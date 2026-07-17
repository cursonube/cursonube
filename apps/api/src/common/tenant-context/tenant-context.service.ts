import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

export interface TenantContextStore {
  tenantId: string;
}

/**
 * Contexto de tenant de la request actual — Documento 2, sección 5, paso 3.
 *
 * Se implementa con AsyncLocalStorage (no request-scoped DI de Nest) para no
 * pagar el costo de performance de instanciar un árbol de providers por
 * request — es el mismo patrón que resolvería un middleware de request-id.
 */
@Injectable()
export class TenantContextService {
  private readonly storage = new AsyncLocalStorage<TenantContextStore>();

  run<T>(store: TenantContextStore, callback: () => T): T {
    return this.storage.run(store, callback);
  }

  getTenantId(): string | undefined {
    return this.storage.getStore()?.tenantId;
  }

  /**
   * Para queries que exigen tenant (Documento 6, sección 3) — lanza en vez de
   * devolver undefined, para que un desarrollador nunca "vea" un tenantId
   * vacío filtrando silenciosamente todo (que devolvería cero filas, no un
   * error visible).
   */
  requireTenantId(): string {
    const tenantId = this.getTenantId();
    if (!tenantId) {
      // Excepción HTTP de Nest, no un Error plano — de lo contrario el
      // exception filter por defecto la trata como un 500 sin informar nada
      // (Documento 13, sección 4: formato de error consistente).
      throw new UnauthorizedException(
        'Esta operación requiere una academia identificada (falta el subdominio/tenant en la request)',
      );
    }
    return tenantId;
  }
}
