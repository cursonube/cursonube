'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { EstadoBilling, Plan } from './page';

function formatPrecio(plan: Plan) {
  if (plan.precioMensualCentavos == null) return 'Gratis';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: plan.moneda ?? 'ARS',
  }).format(plan.precioMensualCentavos / 100);
}

function CambiarPlanForm({
  plan,
  onDone,
}: {
  plan: Plan;
  onDone: () => void;
}) {
  const [payerEmail, setPayerEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function confirmar() {
    setError(null);
    setLoading(true);
    try {
      const resultado = await apiFetch<{
        requiereAutorizacion: boolean;
        initPoint?: string;
      }>('billing/suscripcion', {
        method: 'POST',
        body: JSON.stringify({
          planSlug: plan.slug,
          ...(plan.slug !== 'Free' ? { payerEmail } : {}),
        }),
      });
      if (resultado.requiereAutorizacion && resultado.initPoint) {
        window.location.href = resultado.initPoint;
        return;
      }
      onDone();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No se pudo cambiar de plan',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 space-y-2 rounded-md bg-zinc-50 p-3 dark:bg-zinc-900">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-400">
          {error}
        </p>
      )}
      {plan.slug !== 'Free' && (
        <div className="space-y-1">
          <label className="text-xs font-medium">
            Email de facturación (Mercado Pago)
          </label>
          <input
            type="email"
            required
            value={payerEmail}
            onChange={(e) => setPayerEmail(e.target.value)}
            className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
      )}
      <button
        onClick={confirmar}
        disabled={loading || (plan.slug !== 'Free' && !payerEmail)}
        className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900"
      >
        {loading ? 'Procesando…' : `Confirmar cambio a ${plan.slug}`}
      </button>
    </div>
  );
}

export function FacturacionView({
  planesDisponibles,
  estadoInicial,
}: {
  planesDisponibles: Plan[];
  estadoInicial: EstadoBilling;
}) {
  const router = useRouter();
  const [estado, setEstado] = useState(estadoInicial);
  const [planEnEdicion, setPlanEnEdicion] = useState<string | null>(null);

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Plan y Facturación</h1>

      {estado.academiaEstado === 'Suspendida' && (
        <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
          El panel de gestión está bloqueado por falta de pago. Regularizá tu
          suscripción para recuperar el acceso completo — esta sección sigue
          disponible mientras tanto.
        </p>
      )}

      <div className="mt-6 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <p className="text-sm text-zinc-500">Plan actual</p>
        <p className="text-lg font-medium">
          {estado.plan.slug} — {formatPrecio(estado.plan)}
          {estado.plan.precioMensualCentavos != null && '/mes'}
        </p>
        {estado.suscripcion && (
          <p className="mt-1 text-xs text-zinc-500">
            Suscripción: {estado.suscripcion.estado}
            {estado.suscripcion.fechaProximaFacturacion &&
              ` · Próxima facturación: ${new Date(
                estado.suscripcion.fechaProximaFacturacion,
              ).toLocaleDateString('es-AR')}`}
          </p>
        )}
      </div>

      <h2 className="mt-8 mb-3 text-sm font-medium text-zinc-500 uppercase tracking-wide">
        Planes disponibles
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {planesDisponibles.map((plan) => {
          const esActual = plan.slug === estado.plan.slug;
          return (
            <div
              key={plan.id}
              className={`rounded-lg border p-4 ${
                esActual
                  ? 'border-zinc-900 dark:border-white'
                  : 'border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <p className="font-medium">{plan.slug}</p>
              <p className="text-sm text-zinc-500">
                {formatPrecio(plan)}
                {plan.precioMensualCentavos != null && '/mes'}
              </p>
              <ul className="mt-3 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                <li>{plan.maxProfesoresEditores} profesores/editores</li>
                <li>{plan.maxAlumnos ?? 'Ilimitados'} alumnos</li>
                <li>{plan.maxCursos ?? 'Ilimitados'} cursos</li>
                <li>{plan.dominioPropioHabilitado ? 'Con' : 'Sin'} dominio propio</li>
              </ul>

              {esActual ? (
                <p className="mt-4 text-xs font-medium text-zinc-500">
                  Plan actual
                </p>
              ) : planEnEdicion === plan.id ? (
                <CambiarPlanForm
                  plan={plan}
                  onDone={() => {
                    setPlanEnEdicion(null);
                    router.refresh();
                    setEstado((prev) => ({
                      ...prev,
                      plan: { ...plan },
                    }));
                  }}
                />
              ) : (
                <button
                  onClick={() => setPlanEnEdicion(plan.id)}
                  className="mt-4 w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm transition hover:border-zinc-500 dark:border-zinc-700"
                >
                  Cambiar a este plan
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
