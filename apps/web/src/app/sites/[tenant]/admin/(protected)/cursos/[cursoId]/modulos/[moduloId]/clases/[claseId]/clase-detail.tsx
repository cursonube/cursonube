'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { ClaseAdjunto, ClaseCompleta } from './page';

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
    <li className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900">
      <a
        href={adjunto.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 text-zinc-700 underline dark:text-zinc-300"
      >
        [{TIPO_LABEL[adjunto.tipo]}] {adjunto.nombreVisible}
      </a>
      <div className="flex gap-1">
        <button
          disabled={isFirst || loading}
          onClick={() => mover(-1)}
          className="rounded px-1.5 text-xs text-zinc-500 hover:bg-zinc-200 disabled:opacity-30 dark:hover:bg-zinc-700"
        >
          ↑
        </button>
        <button
          disabled={isLast || loading}
          onClick={() => mover(1)}
          className="rounded px-1.5 text-xs text-zinc-500 hover:bg-zinc-200 disabled:opacity-30 dark:hover:bg-zinc-700"
        >
          ↓
        </button>
        <button
          onClick={eliminar}
          className="rounded px-1.5 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
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
      <select
        value={tipo}
        onChange={(e) => setTipo(e.target.value as ClaseAdjunto['tipo'])}
        className="rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      >
        <option value="Link">Link</option>
        <option value="Pdf">PDF</option>
        <option value="Archivo">Archivo</option>
      </select>
      <input
        placeholder="Nombre visible"
        required
        value={nombreVisible}
        onChange={(e) => setNombreVisible(e.target.value)}
        className="flex-1 rounded-md border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <input
        placeholder="https://…"
        type="url"
        required
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="flex-1 rounded-md border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-md border border-zinc-300 px-3 py-1 text-sm transition hover:border-zinc-500 disabled:opacity-50 dark:border-zinc-700"
      >
        Agregar
      </button>
      {error && (
        <p className="w-full text-xs text-red-600 dark:text-red-400">{error}</p>
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
        className="text-sm text-zinc-500 hover:underline"
      >
        ← Volver al curso
      </Link>

      <h1 className="mt-2 text-xl font-semibold tracking-tight">{clase.titulo}</h1>

      <form onSubmit={guardar} className="mt-6 max-w-lg space-y-4">
        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Título</label>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Video de YouTube No Listado
            {clase.videoExternalId && (
              <span className="ml-2 font-normal text-zinc-500">
                (actual: {clase.videoExternalId})
              </span>
            )}
          </label>
          <input
            placeholder="Pegá una URL nueva para reemplazarlo…"
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Contenido de texto</label>
          <textarea
            rows={4}
            value={contenidoTexto}
            onChange={(e) => setContenidoTexto(e.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Duración estimada (minutos)</label>
          <input
            type="number"
            min="1"
            value={duracion}
            onChange={(e) => setDuracion(e.target.value)}
            className="w-32 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900"
        >
          {loading ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </form>

      <h2 className="mt-8 mb-2 text-sm font-medium text-zinc-500 uppercase tracking-wide">
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
