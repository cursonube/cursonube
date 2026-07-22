'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api-client';
import { BLOCK_TYPES, type TipoBloque } from './block-registry';
import { BlockForm } from './block-form';
import type { Bloque, PaginaConBloques } from './page';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';

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

const ICON_BUTTON =
  'rounded-[var(--p-radius-sm)] px-1.5 text-xs text-[var(--p-color-text-secondary)] transition hover:bg-[var(--p-color-surface-secondary-hover)] disabled:opacity-30';

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
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <Badge tone="neutral">{bloque.tipo}</Badge>
          <span className="ml-2 text-[13px] text-[var(--p-color-text)]">
            {resumenBloque(bloque)}
          </span>
        </div>
        <div className="flex gap-1">
          <button disabled={isFirst || loading} onClick={() => mover(-1)} className={ICON_BUTTON}>
            ↑
          </button>
          <button disabled={isLast || loading} onClick={() => mover(1)} className={ICON_BUTTON}>
            ↓
          </button>
          <button onClick={() => setEditando((v) => !v)} className={ICON_BUTTON}>
            Editar
          </button>
          <button disabled={loading} onClick={duplicar} className={ICON_BUTTON}>
            Duplicar
          </button>
          <button
            onClick={eliminar}
            className="rounded-[var(--p-radius-sm)] px-1.5 text-xs text-[var(--p-color-critical-secondary)] transition hover:bg-[var(--p-color-critical-bg)]"
          >
            Eliminar
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-xs text-[var(--p-color-critical-secondary)]">{error}</p>
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
    </Card>
  );
}

function AgregarBloque({ paginaId }: { paginaId: string }) {
  const { run, error, loading } = useApiAction();
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoBloque | ''>('');

  if (!tipoSeleccionado) {
    return (
      <div className="flex items-center gap-2">
        <Select
          value={tipoSeleccionado}
          onChange={(e) => setTipoSeleccionado(e.target.value as TipoBloque)}
        >
          <option value="">+ Agregar bloque…</option>
          {BLOCK_TYPES.map((b) => (
            <option key={b.tipo} value={b.tipo}>
              {b.label}
            </option>
          ))}
        </Select>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-[13px] font-[550] text-[var(--p-color-text)]">
        Nuevo bloque: {tipoSeleccionado}
      </p>
      {error && (
        <p className="mb-2 text-xs text-[var(--p-color-critical-secondary)]">{error}</p>
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
      <h1 className="text-[length:var(--p-text-xl)] font-[650] tracking-tight text-[var(--p-color-text)]">
        {pagina.titulo}
      </h1>
      <Badge tone={pagina.estado === 'Publicada' ? 'success' : 'neutral'} className="mt-1">
        {pagina.estado}
      </Badge>

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
