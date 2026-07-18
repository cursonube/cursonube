import { serverApiFetch } from '@/lib/api-server';
import { PaginaEditor } from './pagina-editor';
import type { TipoBloque } from './block-registry';

export interface Bloque {
  id: string;
  tipo: TipoBloque;
  orden: number;
  propiedades: Record<string, unknown>;
}

export interface PaginaConBloques {
  id: string;
  tipo: string;
  titulo: string;
  estado: 'Borrador' | 'Publicada';
  bloques: Bloque[];
}

/** Documento 10, sección 1 — editor de bloques de una página. */
export default async function PaginaEditorPage({
  params,
}: {
  params: Promise<{ paginaId: string }>;
}) {
  const { paginaId } = await params;
  const pagina = await serverApiFetch<PaginaConBloques>(`paginas/${paginaId}`);

  return <PaginaEditor pagina={pagina} />;
}
