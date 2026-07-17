import { BadRequestException } from '@nestjs/common';

/**
 * Documento 9, sección 2. Soporta los dos formatos de URL que un creador
 * normalmente pega: youtube.com/watch?v=... y youtu.be/...
 */
export function extractYoutubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);

    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.slice(1) || null;
    }

    if (parsed.hostname.endsWith('youtube.com')) {
      return parsed.searchParams.get('v');
    }

    return null;
  } catch {
    return null;
  }
}

export interface YoutubeOEmbedResult {
  titulo: string;
  thumbnailUrl: string;
}

/**
 * Valida que el video exista y sea accesible — Documento 9, sección 2.
 * La oEmbed API de YouTube NO devuelve duración (solo title/author/
 * thumbnail/html); ver corrección de esa sección en el documento.
 */
export async function validateYoutubeVideo(
  videoId: string,
): Promise<YoutubeOEmbedResult> {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`;

  let response: Response;
  try {
    response = await fetch(oembedUrl);
  } catch {
    throw new BadRequestException(
      'No se pudo verificar el video de YouTube — revisá tu conexión o el link',
    );
  }

  if (!response.ok) {
    throw new BadRequestException(
      'El video de YouTube no existe, no es accesible, o no está disponible como No Listado/Público',
    );
  }

  const data = (await response.json()) as {
    title?: string;
    thumbnail_url?: string;
  };
  return { titulo: data.title ?? '', thumbnailUrl: data.thumbnail_url ?? '' };
}
