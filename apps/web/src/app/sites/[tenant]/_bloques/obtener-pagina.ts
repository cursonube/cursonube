import { notFound } from 'next/navigation';
import { ApiError } from '@/lib/api-client';
import { serverApiFetch } from '@/lib/api-server';
import type { PaginaPublica } from './tipos';

/** Compartido por las 6 páginas fijas del sitio público (Documento 5). */
export async function obtenerPaginaPublica(slug: string): Promise<PaginaPublica> {
  try {
    return await serverApiFetch<PaginaPublica>(
      `sitio-publico/pagina?slug=${encodeURIComponent(slug)}`,
    );
  } catch (err) {
    // 401 acá significa "el subdominio no resolvió a ninguna academia" (el
    // TenantContext nunca se fijó — ver tenant-context.middleware.ts), no un
    // problema de autenticación: esta ruta es pública. Para el visitante es
    // el mismo caso que un 404: la academia/página no existe.
    if (err instanceof ApiError && (err.status === 404 || err.status === 401)) {
      notFound();
    }
    throw err;
  }
}
