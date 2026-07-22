'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Banner } from '@/components/ui/banner';

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
      {error && <Banner>{error}</Banner>}

      <div className="flex flex-wrap items-center gap-3">
        {estado === 'Suspendida' ? (
          <Button
            type="button"
            variant="primary"
            disabled={loading}
            onClick={() =>
              run(() =>
                apiFetch(`staff/academias/${academiaId}/reactivar`, { method: 'POST' }),
              )
            }
          >
            Reactivar academia
          </Button>
        ) : (
          <Button
            type="button"
            variant="critical"
            disabled={loading || estado === 'Cancelada'}
            onClick={() =>
              run(() =>
                apiFetch(`staff/academias/${academiaId}/suspender`, { method: 'POST' }),
              )
            }
          >
            Suspender academia
          </Button>
        )}

        <div className="flex items-center gap-2">
          <Select value={plan} onChange={(e) => setPlan(e.target.value)}>
            {PLANES.map((slug) => (
              <option key={slug} value={slug}>
                {slug}
              </option>
            ))}
          </Select>
          <Button
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
          >
            Cambiar plan
          </Button>
        </div>
      </div>
    </div>
  );
}
