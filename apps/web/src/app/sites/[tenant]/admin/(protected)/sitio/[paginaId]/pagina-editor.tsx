'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api-client';
import { BLOCK_TYPES, type TipoBloque } from './block-registry';
import { BlockForm } from './block-form';
import type { Bloque, PaginaConBloques } from './page';

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

/** Resume corto del contenido de un bloque para mostrar en la lista colapsada. */
function resumenBloque(bloque: Bloque): string {
  const p = bloque.propiedades;
  if (typeof p.titulo === 'string' && p.titulo) return p.titulo;
  if (typeof p.texto === 'string' && p.texto) return p.texto;
  if (typeof p.textoDescriptivo === 'string' && p.textoDescriptivo)
    return p.textoDescriptivo;
  if (typeof p.copyright === 'string' && p.copyright) return p.copyright;
  return '(sin título)';
}

function BloqueRow({
  paginaId,
  bloque,
  isFirst,
  isLast,
  siblingIds,
}: {
  paginaId: string;
  bloque: Bloque;
  isFirst: boolean;
  isLast: boolean;
  siblingIds: string[];
}) {
  const { run, error, loading } = useApiAction();
  const [editando, setEditando] = useState(false);

  function mover(direccion: -1 | 1) {
    const idx = siblingIds.indexOf(bloque.id);
    const nuevoOrden = [...siblingIds];
    const [item] = nuevoOrden.splice(idx, 1);
    nuevoOrden.splice(idx + direccion, 0, item);
    run(() =>
      apiFetch(`paginas/${paginaId}/bloques/reordenar`, {
        method: 'POST',
        body: JSON.stringify({ bloqueIds: nuevoOrden }),
      }),
    );
  }

  function duplicar() {
    run(() =>
      apiFetch(`paginas/${paginaId}/bloques/${bloque.id}/duplicar`, {
        method: 'POST',
      }),
    );
  }

  function eliminar() {
    if (!confirm(`¿Eliminar este bloque de tipo "${bloque.tipo}"?`)) {
      return;
    }
    run(() =>
      apiFetch(`paginas/${paginaId}/bloques/${bloque.id}`, { method: 'DELETE' }),
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <div>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {bloque.tipo}
          </span>
          <span className="ml-2 text-sm text-zinc-700 dark:text-zinc-300">
            {resumenBloque(bloque)}
          </span>
        </div>
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
            onClick={() => setEditando((v) => !v)}
            className="rounded px-1.5 text-xs text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
          >
            Editar
          </button>
          <button
            onClick={duplicar}
            disabled={loading}
            className="rounded px-1.5 text-xs text-zinc-500 hover:bg-zinc-200 disabled:opacity-30 dark:hover:bg-zinc-700"
          >
            Duplicar
          </button>
          <button
            onClick={eliminar}
            className="rounded px-1.5 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
          >
            Eliminar
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      {editando && (
        <div className="mt-3">
          <BlockForm
            tipo={bloque.tipo}
            initialPropiedades={bloque.propiedades}
            onCancel={() => setEditando(false)}
            onSubmit={(propiedades) =>
              run(() =>
                apiFetch(`paginas/${paginaId}/bloques/${bloque.id}`, {
                  method: 'PATCH',
                  body: JSON.stringify({ propiedades }),
                }),
              ).then(() => setEditando(false))
            }
          />
        </div>
      )}
    </div>
  );
}

function AgregarBloque({ paginaId }: { paginaId: string }) {
  const { run, error, loading } = useApiAction();
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoBloque | ''>('');

  if (!tipoSeleccionado) {
    return (
      <div className="flex items-center gap-2">
        <select
          value={tipoSeleccionado}
          onChange={(e) => setTipoSeleccionado(e.target.value as TipoBloque)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="">+ Agregar bloque…</option>
          {BLOCK_TYPES.map((b) => (
            <option key={b.tipo} value={b.tipo}>
              {b.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium">Nuevo bloque: {tipoSeleccionado}</p>
      {error && (
        <p className="mb-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
      <BlockForm
        tipo={tipoSeleccionado}
        initialPropiedades={{}}
        submitLabel={loading ? 'Creando…' : 'Crear bloque'}
        onCancel={() => setTipoSeleccionado('')}
        onSubmit={(propiedades) =>
          run(() =>
            apiFetch(`paginas/${paginaId}/bloques`, {
              method: 'POST',
              body: JSON.stringify({ tipo: tipoSeleccionado, propiedades }),
            }),
          ).then(() => setTipoSeleccionado(''))
        }
      />
    </div>
  );
}

export function PaginaEditor({ pagina }: { pagina: PaginaConBloques }) {
  const bloqueIds = pagina.bloques.map((b) => b.id);

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">{pagina.titulo}</h1>
      <span
        className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
          pagina.estado === 'Publicada'
            ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
            : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
        }`}
      >
        {pagina.estado}
      </span>

      <div className="mt-6 max-w-2xl space-y-3">
        {pagina.bloques
          .slice()
          .sort((a, b) => a.orden - b.orden)
          .map((bloque, i) => (
            <BloqueRow
              key={bloque.id}
              paginaId={pagina.id}
              bloque={bloque}
              isFirst={i === 0}
              isLast={i === pagina.bloques.length - 1}
              siblingIds={bloqueIds}
            />
          ))}
      </div>

      <div className="mt-6 max-w-2xl">
        <AgregarBloque paginaId={pagina.id} />
      </div>
    </div>
  );
}
