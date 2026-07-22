'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { ClaseAdjunto, ClaseCompleta } from './page';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Banner } from '@/components/ui/banner';

function useApiAction() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run(fn: () => Promise<unknown>) {
    setError(null);
    setLoading(true);
    try {
      await fn();
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ocurrió un error');
    } finally {
      setLoading(false);
    }
  }

  return { run, error, loading };
}

const TIPO_LABEL: Record<ClaseAdjunto['tipo'], string> = {
  Pdf: 'PDF',
  Archivo: 'Archivo',
  Link: 'Link',
};

const ICON_BUTTON =
  'rounded-[var(--p-radius-sm)] px-1.5 text-xs text-[var(--p-color-text-secondary)] transition hover:bg-[var(--p-color-surface-secondary-hover)] disabled:opacity-30';

function AdjuntoRow({
  claseId,
  adjunto,
  isFirst,
  isLast,
  siblingIds,
}: {
  claseId: string;
  adjunto: ClaseAdjunto;
  isFirst: boolean;
  isLast: boolean;
  siblingIds: string[];
}) {
  const { run, loading } = useApiAction();

  function mover(direccion: -1 | 1) {
    const idx = siblingIds.indexOf(adjunto.id);
    const nuevoOrden = [...siblingIds];
    const [item] = nuevoOrden.splice(idx, 1);
    nuevoOrden.splice(idx + direccion, 0, item);
    run(() =>
      apiFetch(`clases/${claseId}/adjuntos/reordenar`, {
        method: 'POST',
        body: JSON.stringify({ adjuntoIds: nuevoOrden }),
      }),
    );
  }

  function eliminar() {
    run(() =>
      apiFetch(`clases/${claseId}/adjuntos/${adjunto.id}`, { method: 'DELETE' }),
    );
  }

  return (
    <li className="flex items-center justify-between rounded-[var(--p-radius-sm)] px-2 py-1.5 text-[13px] hover:bg-[var(--p-color-surface-secondary-hover)]">
      <a
        href={adjunto.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 text-[var(--p-color-text-link)] underline"
      >
        [{TIPO_LABEL[adjunto.tipo]}] {adjunto.nombreVisible}
      </a>
      <div className="flex gap-1">
        <button disabled={isFirst || loading} onClick={() => mover(-1)} className={ICON_BUTTON}>
          ↑
        </button>
        <button disabled={isLast || loading} onClick={() => mover(1)} className={ICON_BUTTON}>
          ↓
        </button>
        <button
          onClick={eliminar}
          className="rounded-[var(--p-radius-sm)] px-1.5 text-xs text-[var(--p-color-critical-secondary)] transition hover:bg-[var(--p-color-critical-bg)]"
        >
          Eliminar
        </button>
      </div>
    </li>
  );
}

function AgregarAdjuntoForm({ claseId }: { claseId: string }) {
  const { run, error, loading } = useApiAction();
  const [tipo, setTipo] = useState<ClaseAdjunto['tipo']>('Link');
  const [url, setUrl] = useState('');
  const [nombreVisible, setNombreVisible] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(() =>
          apiFetch(`clases/${claseId}/adjuntos`, {
            method: 'POST',
            body: JSON.stringify({ tipo, url, nombreVisible }),
          }),
        ).then(() => {
          setUrl('');
          setNombreVisible('');
        });
      }}
      className="mt-3 flex flex-wrap gap-2"
    >
      <Select value={tipo} onChange={(e) => setTipo(e.target.value as ClaseAdjunto['tipo'])}>
        <option value="Link">Link</option>
        <option value="Pdf">PDF</option>
        <option value="Archivo">Archivo</option>
      </Select>
      <TextField
        placeholder="Nombre visible"
        required
        value={nombreVisible}
        onChange={(e) => setNombreVisible(e.target.value)}
        className="flex-1"
      />
      <TextField
        placeholder="https://…"
        type="url"
        required
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="flex-1"
      />
      <Button type="submit" disabled={loading}>
        Agregar
      </Button>
      {error && (
        <p className="w-full text-xs text-[var(--p-color-critical-secondary)]">{error}</p>
      )}
    </form>
  );
}

export function ClaseDetail({
  cursoId,
  moduloId,
  clase,
  adjuntosIniciales,
}: {
  cursoId: string;
  moduloId: string;
  clase: ClaseCompleta;
  adjuntosIniciales: ClaseAdjunto[];
}) {
  const { run, error, loading } = useApiAction();
  const [titulo, setTitulo] = useState(clase.titulo);
  const [videoUrl, setVideoUrl] = useState('');
  const [contenidoTexto, setContenidoTexto] = useState(clase.contenidoTexto ?? '');
  const [duracion, setDuracion] = useState(
    clase.duracionEstimadaMinutos?.toString() ?? '',
  );

  const adjuntoIds = adjuntosIniciales.map((a) => a.id);

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    run(() =>
      apiFetch(`modulos/${moduloId}/clases/${clase.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          titulo,
          contenidoTexto: contenidoTexto || undefined,
          duracionEstimadaMinutos: duracion ? Number(duracion) : undefined,
          ...(videoUrl ? { videoUrl } : {}),
        }),
      }),
    );
  }

  return (
    <div>
      <Link
        href={`/admin/cursos/${cursoId}`}
        className="text-[13px] text-[var(--p-color-text-secondary)] hover:underline"
      >
        ← Volver al curso
      </Link>

      <h1 className="mt-2 text-[length:var(--p-text-xl)] font-[650] tracking-tight text-[var(--p-color-text)]">
        {clase.titulo}
      </h1>

      <form onSubmit={guardar} className="mt-6 max-w-lg space-y-4">
        {error && <Banner>{error}</Banner>}

        <TextField label="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} />

        <TextField
          label={
            clase.videoExternalId
              ? `Video de YouTube No Listado (actual: ${clase.videoExternalId})`
              : 'Video de YouTube No Listado'
          }
          placeholder="Pegá una URL nueva para reemplazarlo…"
          type="url"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
        />

        <Textarea
          label="Contenido de texto"
          rows={4}
          value={contenidoTexto}
          onChange={(e) => setContenidoTexto(e.target.value)}
        />

        <TextField
          label="Duración estimada (minutos)"
          type="number"
          min="1"
          value={duracion}
          onChange={(e) => setDuracion(e.target.value)}
          className="w-32"
        />

        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </form>

      <h2 className="mt-8 mb-2 text-[12px] font-[550] text-[var(--p-color-text-secondary)] uppercase tracking-wide">
        Adjuntos
      </h2>
      <ul className="max-w-lg">
        {adjuntosIniciales
          .slice()
          .sort((a, b) => a.orden - b.orden)
          .map((adjunto, i) => (
            <AdjuntoRow
              key={adjunto.id}
              claseId={clase.id}
              adjunto={adjunto}
              isFirst={i === 0}
              isLast={i === adjuntosIniciales.length - 1}
              siblingIds={adjuntoIds}
            />
          ))}
      </ul>
      <div className="max-w-lg">
        <AgregarAdjuntoForm claseId={clase.id} />
      </div>
    </div>
  );
}
