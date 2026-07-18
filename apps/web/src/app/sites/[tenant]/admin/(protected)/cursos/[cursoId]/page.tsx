import { serverApiFetch } from '@/lib/api-server';
import { CursoDetail } from './curso-detail';

export interface Clase {
  id: string;
  titulo: string;
  orden: number;
  videoProvider: 'YoutubeNoListado' | null;
  videoExternalId: string | null;
}

export interface Modulo {
  id: string;
  titulo: string;
  orden: number;
  clases: Clase[];
}

export interface CursoDetalle {
  id: string;
  titulo: string;
  descripcion: string;
  estado: 'Borrador' | 'Publicado';
  tipoAcceso: 'Gratis' | 'PagoUnico';
  precioCentavos: number | null;
  moneda: string | null;
  modulos: Modulo[];
}

/** Documento 10, sección 1 — detalle de un curso: edición + módulos/clases. */
export default async function CursoDetallePage({
  params,
}: {
  params: Promise<{ cursoId: string }>;
}) {
  const { cursoId } = await params;
  const curso = await serverApiFetch<CursoDetalle>(`cursos/${cursoId}`);

  return <CursoDetail curso={curso} />;
}
