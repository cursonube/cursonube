import { notFound } from 'next/navigation';
import { serverApiFetch } from '@/lib/api-server';
import { ClaseDetail } from './clase-detail';

export interface ClaseCompleta {
  id: string;
  titulo: string;
  videoProvider: 'YoutubeNoListado' | null;
  videoExternalId: string | null;
  contenidoTexto: string | null;
  duracionEstimadaMinutos: number | null;
}

export interface ClaseAdjunto {
  id: string;
  tipo: 'Pdf' | 'Archivo' | 'Link';
  url: string;
  nombreVisible: string;
  orden: number;
}

interface CursoConModulos {
  modulos: Array<{ id: string; clases: ClaseCompleta[] }>;
}

/** Documento 10, sección 1 — detalle de una clase: video, contenido, adjuntos. */
export default async function ClaseDetallePage({
  params,
}: {
  params: Promise<{ cursoId: string; moduloId: string; claseId: string }>;
}) {
  const { cursoId, moduloId, claseId } = await params;

  const [curso, adjuntos] = await Promise.all([
    serverApiFetch<CursoConModulos>(`cursos/${cursoId}`),
    serverApiFetch<ClaseAdjunto[]>(`clases/${claseId}/adjuntos`),
  ]);

  const modulo = curso.modulos.find((m) => m.id === moduloId);
  const clase = modulo?.clases.find((c) => c.id === claseId);
  if (!clase) {
    notFound();
  }

  return (
    <ClaseDetail
      cursoId={cursoId}
      moduloId={moduloId}
      clase={clase}
      adjuntosIniciales={adjuntos}
    />
  );
}
