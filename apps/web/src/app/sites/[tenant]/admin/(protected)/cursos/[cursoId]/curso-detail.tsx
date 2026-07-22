'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { Clase, CursoDetalle, Modulo } from './page';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Textarea } from '@/components/ui/textarea';
import { Banner } from '@/components/ui/banner';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

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
      {error && <Banner>{error}</Banner>}
      <TextField
        label="Título"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
      />
      <Textarea
        label="Descripción"
        rows={3}
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
      />
      <Button type="submit" disabled={loading}>
        {loading ? 'Guardando…' : 'Guardar cambios'}
      </Button>
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
      className="mt-4 flex items-center gap-2"
    >
      <TextField
        placeholder="Nuevo módulo…"
        required
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        className="flex-1"
      />
      <Button type="submit" disabled={loading}>
        Agregar
      </Button>
      {error && (
        <span className="text-[13px] text-[var(--p-color-critical-secondary)]">{error}</span>
      )}
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
      className="mt-2 flex items-center gap-2"
    >
      <TextField
        placeholder="Nueva clase…"
        required
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        className="flex-1 !py-1 text-xs"
      />
      <Button type="submit" disabled={loading} className="!px-2 !py-1 text-xs">
        Agregar
      </Button>
      {error && (
        <span className="text-xs text-[var(--p-color-critical-secondary)]">{error}</span>
      )}
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
    <li className="flex items-center justify-between rounded-[var(--p-radius-sm)] px-2 py-1.5 text-[13px] hover:bg-[var(--p-color-surface-secondary-hover)]">
      <Link
        href={`/admin/cursos/${cursoId}/modulos/${moduloId}/clases/${clase.id}`}
        className="flex-1 text-[var(--p-color-text)]"
      >
        {clase.titulo}
        {!clase.videoExternalId && (
          <span className="ml-2 text-xs text-[var(--p-color-text-disabled)]">
            (sin video)
          </span>
        )}
      </Link>
      <div className="flex gap-1">
        <button disabled={isFirst || loading} onClick={() => mover(-1)} className={ICON_BUTTON}>
          ↑
        </button>
        <button disabled={isLast || loading} onClick={() => mover(1)} className={ICON_BUTTON}>
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
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-[550] text-[var(--p-color-text)]">{modulo.titulo}</p>
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
    </Card>
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
          <h1 className="text-[length:var(--p-text-xl)] font-[650] tracking-tight text-[var(--p-color-text)]">
            {curso.titulo}
          </h1>
          <Badge tone={curso.estado === 'Publicado' ? 'success' : 'neutral'} className="mt-1">
            {curso.estado}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button onClick={togglePublicacion} disabled={loading}>
            {curso.estado === 'Publicado' ? 'Despublicar' : 'Publicar'}
          </Button>
          <Button variant="critical" onClick={eliminarCurso}>
            Eliminar
          </Button>
        </div>
      </div>

      {error && <Banner className="mt-4">{error}</Banner>}

      <EditarCursoForm curso={curso} />

      <h2 className="mt-8 mb-3 text-[12px] font-[550] text-[var(--p-color-text-secondary)] uppercase tracking-wide">
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
