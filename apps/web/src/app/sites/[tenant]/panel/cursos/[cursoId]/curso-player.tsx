'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import type { ClaseContenido, CursoContenido } from './page';
import { Button } from '@/components/ui/button';

const TIPO_ADJUNTO_LABEL: Record<ClaseContenido['adjuntos'][number]['tipo'], string> = {
  Pdf: 'PDF',
  Archivo: 'Archivo',
  Link: 'Link',
};

/**
 * Tipado mínimo de la YouTube IFrame Player API — no hay types oficiales
 * instalados (agregar `@types/youtube` para esto solo sería una dependencia
 * más por un puñado de campos); se declara acá lo puntual que se usa.
 */
interface YouTubePlayer {
  destroy(): void;
}
interface YouTubeNamespace {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      events: {
        onStateChange: (event: { data: number }) => void;
      };
    },
  ) => YouTubePlayer;
  PlayerState: { ENDED: number };
}
declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

function useYoutubeIframeApi() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (window.YT) {
      setReady(true);
      return;
    }
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      setReady(true);
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(script);
    }
  }, []);

  return ready;
}

function VideoPlayer({
  videoId,
  onEnded,
}: {
  videoId: string;
  onEnded: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiReady = useYoutubeIframeApi();
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  useEffect(() => {
    if (!apiReady || !containerRef.current || !window.YT) {
      return;
    }
    const player = new window.YT.Player(containerRef.current, {
      videoId,
      events: {
        onStateChange: (event) => {
          if (event.data === window.YT?.PlayerState.ENDED) {
            onEndedRef.current();
          }
        },
      },
    });
    return () => player.destroy();
  }, [apiReady, videoId]);

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}

export function CursoPlayer({ contenido }: { contenido: CursoContenido }) {
  const todasLasClases = useMemo(
    () => contenido.modulos.flatMap((m) => m.clases),
    [contenido],
  );
  const [claseIdSeleccionada, setClaseIdSeleccionada] = useState(
    () => todasLasClases.find((c) => !c.completada)?.id ?? todasLasClases[0]?.id,
  );
  const [completadas, setCompletadas] = useState(
    () => new Set(todasLasClases.filter((c) => c.completada).map((c) => c.id)),
  );
  const [marcando, setMarcando] = useState(false);

  const claseActiva = todasLasClases.find((c) => c.id === claseIdSeleccionada);

  async function marcarCompletada(claseId: string) {
    if (completadas.has(claseId) || marcando) {
      return;
    }
    setMarcando(true);
    try {
      await apiFetch(`clases/${claseId}/progreso`, { method: 'POST' });
      setCompletadas((prev) => new Set(prev).add(claseId));
    } finally {
      setMarcando(false);
    }
  }

  if (contenido.inscripcionEstado === 'Cancelada') {
    return (
      <p className="text-[13px] text-[var(--p-color-critical-secondary)]">
        Acceso revocado — contactá a la academia para más información.
      </p>
    );
  }

  if (!claseActiva) {
    return (
      <p className="text-[13px] text-[var(--p-color-text-secondary)]">
        Este curso todavía no tiene clases.
      </p>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 lg:flex-row">
      <aside className="order-2 lg:order-1 lg:w-72 lg:shrink-0">
        <h1 className="mb-4 text-[13px] font-[550] text-[var(--p-color-text)]">
          {contenido.curso.titulo}
        </h1>
        {contenido.modulos.map((modulo) => (
          <div key={modulo.id} className="mb-4">
            <p className="mb-1 text-[12px] font-[550] tracking-wide text-[var(--p-color-text-secondary)] uppercase">
              {modulo.titulo}
            </p>
            <ul className="space-y-1">
              {modulo.clases.map((clase) => (
                <li key={clase.id}>
                  <button
                    onClick={() => setClaseIdSeleccionada(clase.id)}
                    className={`flex w-full items-center gap-2 rounded-[var(--p-radius-md)] px-2 py-1.5 text-left text-[13px] transition ${
                      clase.id === claseIdSeleccionada
                        ? 'bg-[var(--p-color-surface-secondary)]'
                        : 'hover:bg-[var(--p-color-surface-secondary-hover)]'
                    }`}
                  >
                    <span
                      className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[var(--p-radius-full)] text-[10px] ${
                        completadas.has(clase.id)
                          ? 'bg-[var(--p-color-success-secondary)] text-white'
                          : 'border border-[var(--p-color-border)]'
                      }`}
                    >
                      {completadas.has(clase.id) ? '✓' : ''}
                    </span>
                    <span className="text-[var(--p-color-text)]">{clase.titulo}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </aside>

      <div className="order-1 flex-1 lg:order-2">
        <h2 className="mb-3 text-[var(--p-text-lg)] font-[550] text-[var(--p-color-text)]">
          {claseActiva.titulo}
        </h2>

        {claseActiva.videoProvider === 'YoutubeNoListado' && claseActiva.videoExternalId && (
          <VideoPlayer
            key={claseActiva.id}
            videoId={claseActiva.videoExternalId}
            onEnded={() => marcarCompletada(claseActiva.id)}
          />
        )}

        {claseActiva.contenidoTexto && (
          <p className="mt-4 whitespace-pre-wrap text-[13px] text-[var(--p-color-text)]">
            {claseActiva.contenidoTexto}
          </p>
        )}

        {claseActiva.adjuntos.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-[13px] font-[550] text-[var(--p-color-text)]">Adjuntos</p>
            <ul className="space-y-1">
              {claseActiva.adjuntos.map((adjunto) => (
                <li key={adjunto.id}>
                  <a
                    href={adjunto.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] text-[var(--p-color-text-link)] underline"
                  >
                    [{TIPO_ADJUNTO_LABEL[adjunto.tipo]}] {adjunto.nombreVisible}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button
          variant="primary"
          onClick={() => marcarCompletada(claseActiva.id)}
          disabled={completadas.has(claseActiva.id) || marcando}
          className="mt-6"
        >
          {completadas.has(claseActiva.id)
            ? 'Clase completada'
            : 'Marcar como completada'}
        </Button>
      </div>
    </div>
  );
}
