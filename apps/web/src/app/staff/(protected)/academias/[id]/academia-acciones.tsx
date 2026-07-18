'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api-client';

const PLANES = ['Free', 'Starter', 'Pro', 'Business'] as const;

/** Documento 4, Flujo 9, punto 4 — suspender/reactivar/cambiar plan manualmente (soporte). */
export function AcademiaAcciones({
  academiaId,
  estado,
  planActual,
}: {
  academiaId: string;
  estado: 'Activa' | 'Suspendida' | 'Cancelada';
  planActual: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState(planActual);

  async function run(fn: () => Promise<unknown>) {
    setError(null);
    setLoading(true);
    try {
      await fn();
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo completar la acción');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 space-y-3">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {estado === 'Suspendida' ? (
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              run(() =>
                apiFetch(`staff/academias/${academiaId}/reactivar`, { method: 'POST' }),
              )
            }
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900"
          >
            Reactivar academia
          </button>
        ) : (
          <button
            type="button"
            disabled={loading || estado === 'Cancelada'}
            onClick={() =>
              run(() =>
                apiFetch(`staff/academias/${academiaId}/suspender`, { method: 'POST' }),
              )
            }
            className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700 transition hover:border-red-500 disabled:opacity-50 dark:border-red-800 dark:text-red-400"
          >
            Suspender academia
          </button>
        )}

        <div className="flex items-center gap-2">
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            {PLANES.map((slug) => (
              <option key={slug} value={slug}>
                {slug}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={loading || plan === planActual}
            onClick={() =>
              run(() =>
                apiFetch(`staff/academias/${academiaId}/plan`, {
                  method: 'PATCH',
                  body: JSON.stringify({ planSlug: plan }),
                }),
              )
            }
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm transition hover:border-zinc-500 disabled:opacity-50 dark:border-zinc-700"
          >
            Cambiar plan
          </button>
        </div>
      </div>
    </div>
  );
}
