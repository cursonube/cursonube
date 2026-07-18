'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { Clase, CursoDetalle, Modulo } from './page';

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

function EditarCursoForm({ curso }: { curso: CursoDetalle }) {
  const { run, error, loading } = useApiAction();
  const [titulo, setTitulo] = useState(curso.titulo);
  const [descripcion, setDescripcion] = useState(curso.descripcion);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(() =>
          apiFetch(`cursos/${curso.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ titulo, descripcion }),
          }),
        );
      }}
      className="mt-4 max-w-lg space-y-3"
    >
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
        <label className="text-sm font-medium">Descripción</label>
        <textarea
          rows={3}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm transition hover:border-zinc-500 disabled:opacity-50 dark:border-zinc-700"
      >
        {loading ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </form>
  );
}

function AgregarModuloForm({ cursoId }: { cursoId: string }) {
  const { run, error, loading } = useApiAction();
  const [titulo, setTitulo] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(() =>
          apiFetch(`cursos/${cursoId}/modulos`, {
            method: 'POST',
            body: JSON.stringify({ titulo }),
          }),
        ).then(() => setTitulo(''));
      }}
      className="mt-4 flex gap-2"
    >
      <input
        placeholder="Nuevo módulo…"
        required
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        className="flex-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm transition hover:border-zinc-500 disabled:opacity-50 dark:border-zinc-700"
      >
        Agregar
      </button>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </form>
  );
}

function AgregarClaseForm({ moduloId }: { moduloId: string }) {
  const { run, error, loading } = useApiAction();
  const [titulo, setTitulo] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(() =>
          apiFetch(`modulos/${moduloId}/clases`, {
            method: 'POST',
            body: JSON.stringify({ titulo }),
          }),
        ).then(() => setTitulo(''));
      }}
      className="mt-2 flex gap-2"
    >
      <input
        placeholder="Nueva clase…"
        required
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        className="flex-1 rounded-md border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-md border border-zinc-300 px-2 py-1 text-xs transition hover:border-zinc-500 disabled:opacity-50 dark:border-zinc-700"
      >
        Agregar
      </button>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </form>
  );
}

function ClaseRow({
  cursoId,
  moduloId,
  clase,
  isFirst,
  isLast,
  siblingIds,
}: {
  cursoId: string;
  moduloId: string;
  clase: Clase;
  isFirst: boolean;
  isLast: boolean;
  siblingIds: string[];
}) {
  const { run, loading } = useApiAction();

  function mover(direccion: -1 | 1) {
    const idx = siblingIds.indexOf(clase.id);
    const nuevoOrden = [...siblingIds];
    const [item] = nuevoOrden.splice(idx, 1);
    nuevoOrden.splice(idx + direccion, 0, item);
    run(() =>
      apiFetch(`modulos/${moduloId}/clases/reordenar`, {
        method: 'POST',
        body: JSON.stringify({ claseIds: nuevoOrden }),
      }),
    );
  }

  return (
    <li className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900">
      <Link
        href={`/admin/cursos/${cursoId}/modulos/${moduloId}/clases/${clase.id}`}
        className="flex-1 text-zinc-700 dark:text-zinc-300"
      >
        {clase.titulo}
        {!clase.videoExternalId && (
          <span className="ml-2 text-xs text-zinc-400">(sin video)</span>
        )}
      </Link>
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
      </div>
    </li>
  );
}

function ModuloItem({
  cursoId,
  modulo,
  isFirst,
  isLast,
  siblingIds,
}: {
  cursoId: string;
  modulo: Modulo;
  isFirst: boolean;
  isLast: boolean;
  siblingIds: string[];
}) {
  const { run, loading } = useApiAction();
  const claseIds = modulo.clases.map((c) => c.id);

  function mover(direccion: -1 | 1) {
    const idx = siblingIds.indexOf(modulo.id);
    const nuevoOrden = [...siblingIds];
    const [item] = nuevoOrden.splice(idx, 1);
    nuevoOrden.splice(idx + direccion, 0, item);
    run(() =>
      apiFetch(`cursos/${cursoId}/modulos/reordenar`, {
        method: 'POST',
        body: JSON.stringify({ moduloIds: nuevoOrden }),
      }),
    );
  }

  function eliminar() {
    if (!confirm(`¿Eliminar el módulo "${modulo.titulo}" y todas sus clases?`)) {
      return;
    }
    run(() => apiFetch(`cursos/${cursoId}/modulos/${modulo.id}`, { method: 'DELETE' }));
  }

  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <p className="font-medium">{modulo.titulo}</p>
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
      </div>

      <ul className="mt-2">
        {modulo.clases
          .slice()
          .sort((a, b) => a.orden - b.orden)
          .map((clase, i) => (
            <ClaseRow
              key={clase.id}
              cursoId={cursoId}
              moduloId={modulo.id}
              clase={clase}
              isFirst={i === 0}
              isLast={i === modulo.clases.length - 1}
              siblingIds={claseIds}
            />
          ))}
      </ul>

      <AgregarClaseForm moduloId={modulo.id} />
    </div>
  );
}

export function CursoDetail({ curso }: { curso: CursoDetalle }) {
  const router = useRouter();
  const { run, error, loading } = useApiAction();
  const moduloIds = curso.modulos.map((m) => m.id);

  function togglePublicacion() {
    run(() =>
      apiFetch(
        `cursos/${curso.id}/${curso.estado === 'Publicado' ? 'despublicar' : 'publicar'}`,
        { method: 'POST' },
      ),
    );
  }

  function eliminarCurso() {
    if (!confirm(`¿Eliminar el curso "${curso.titulo}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    apiFetch(`cursos/${curso.id}`, { method: 'DELETE' })
      .then(() => router.push('/admin/cursos'))
      .catch((err) => {
        if (err instanceof ApiError) {
          alert(err.message);
        }
      });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{curso.titulo}</h1>
          <span
            className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
              curso.estado === 'Publicado'
                ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
            }`}
          >
            {curso.estado}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={togglePublicacion}
            disabled={loading}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm transition hover:border-zinc-500 disabled:opacity-50 dark:border-zinc-700"
          >
            {curso.estado === 'Publicado' ? 'Despublicar' : 'Publicar'}
          </button>
          <button
            onClick={eliminarCurso}
            className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 transition hover:border-red-500 dark:border-red-900 dark:text-red-400"
          >
            Eliminar
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
          {error}
        </p>
      )}

      <EditarCursoForm curso={curso} />

      <h2 className="mt-8 mb-3 text-sm font-medium text-zinc-500 uppercase tracking-wide">
        Módulos
      </h2>
      <div className="space-y-4">
        {curso.modulos
          .slice()
          .sort((a, b) => a.orden - b.orden)
          .map((modulo, i) => (
            <ModuloItem
              key={modulo.id}
              cursoId={curso.id}
              modulo={modulo}
              isFirst={i === 0}
              isLast={i === curso.modulos.length - 1}
              siblingIds={moduloIds}
            />
          ))}
      </div>

      <AgregarModuloForm cursoId={curso.id} />
    </div>
  );
}
