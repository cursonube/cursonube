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
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }
}
