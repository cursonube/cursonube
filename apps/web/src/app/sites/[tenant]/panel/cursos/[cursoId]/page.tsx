import { serverApiFetch } from '@/lib/api-server';
import { CursoPlayer } from './curso-player';

export interface ClaseAdjunto {
  id: string;
  tipo: 'Pdf' | 'Archivo' | 'Link';
  url: string;
  nombreVisible: string;
}

export interface ClaseContenido {
  id: string;
  titulo: string;
  videoProvider: 'YoutubeNoListado' | null;
  videoExternalId: string | null;
  contenidoTexto: string | null;
  duracionEstimadaMinutos: number | null;
  completada: boolean;
  adjuntos: ClaseAdjunto[];
}

export interface CursoContenido {
  inscripcionEstado: 'Activa' | 'Completada' | 'Cancelada';
  curso: { id: string; titulo: string; descripcion: string };
  modulos: Array<{ id: string; titulo: string; clases: ClaseContenido[] }>;
}

/** Documento 11, sección 1 ("Un curso al entrar") + Documento 4, Flujo 7. */
export default async function CursoPage({
  params,
}: {
  params: Promise<{ cursoId: string }>;
}) {
  const { cursoId } = await params;
  const contenido = await serverApiFetch<CursoContenido>(
    `cursos/${cursoId}/contenido`,
  );

  return <CursoPlayer contenido={contenido} />;
}
