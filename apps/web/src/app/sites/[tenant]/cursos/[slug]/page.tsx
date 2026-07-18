import { notFound } from 'next/navigation';
import { ApiError } from '@/lib/api-client';
import { serverApiFetch } from '@/lib/api-server';
import { CursoPublicoView } from './curso-publico-view';

export interface CursoPublico {
  id: string;
  titulo: string;
  descripcion: string;
  tipoAcceso: 'Gratis' | 'PagoUnico';
  precioCentavos: number | null;
  moneda: string | null;
  imagenPortadaUrl: string | null;
  puedeComprarse: boolean;
  modulos: Array<{
    titulo: string;
    orden: number;
    clases: Array<{
      titulo: string;
      orden: number;
      duracionEstimadaMinutos: number | null;
    }>;
  }>;
}

/**
 * Documento 4, Flujo 5 — página pública del curso en el sitio de la
 * academia: la vidriera desde la que un visitante se inscribe (Gratis) o
 * compra (PagoUnico). Sin depender del editor de bloques (Documento 5) —
 * esa es una página fija de catálogo, no una `Pagina` editable.
 */
export default async function CursoPublicoPage({
  params,
}: {
  params: Promise<{ tenant: string; slug: string }>;
}) {
  const { slug } = await params;

  let curso: CursoPublico;
  try {
    curso = await serverApiFetch<CursoPublico>(`cursos/publico/${slug}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  return <CursoPublicoView curso={curso} />;
}
