'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { EstadoBilling, Plan } from './page';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Banner } from '@/components/ui/banner';

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
    <div className="mt-3 space-y-2 rounded-[var(--p-radius-md)] bg-[var(--p-color-surface-secondary)] p-3">
      {error && <Banner className="text-xs">{error}</Banner>}
      {plan.slug !== 'Free' && (
        <TextField
          label="Email de facturación (Mercado Pago)"
          type="email"
          required
          value={payerEmail}
          onChange={(e) => setPayerEmail(e.target.value)}
        />
      )}
      <Button
        variant="primary"
        onClick={confirmar}
        disabled={loading || (plan.slug !== 'Free' && !payerEmail)}
        className="w-full"
      >
        {loading ? 'Procesando…' : `Confirmar cambio a ${plan.slug}`}
      </Button>
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
      <h1 className="text-[length:var(--p-text-xl)] font-[650] tracking-tight text-[var(--p-color-text)]">
        Plan y Facturación
      </h1>

      {estado.academiaEstado === 'Suspendida' && (
        <Banner className="mt-4">
          El panel de gestión está bloqueado por falta de pago. Regularizá tu
          suscripción para recuperar el acceso completo — esta sección sigue
          disponible mientras tanto.
        </Banner>
      )}

      <Card className="mt-6 p-4">
        <p className="text-[13px] text-[var(--p-color-text-secondary)]">Plan actual</p>
        <p className="text-[var(--p-text-lg)] font-[550] text-[var(--p-color-text)]">
          {estado.plan.slug} — {formatPrecio(estado.plan)}
          {estado.plan.precioMensualCentavos != null && '/mes'}
        </p>
        {estado.suscripcion && (
          <p className="mt-1 text-[12px] text-[var(--p-color-text-secondary)]">
            Suscripción: {estado.suscripcion.estado}
            {estado.suscripcion.fechaProximaFacturacion &&
              ` · Próxima facturación: ${new Date(
                estado.suscripcion.fechaProximaFacturacion,
              ).toLocaleDateString('es-AR')}`}
          </p>
        )}
      </Card>

      <h2 className="mt-8 mb-3 text-[12px] font-[550] text-[var(--p-color-text-secondary)] uppercase tracking-wide">
        Planes disponibles
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {planesDisponibles.map((plan) => {
          const esActual = plan.slug === estado.plan.slug;
          return (
            <Card
              key={plan.id}
              className={`p-4 ${esActual ? 'border-[var(--p-color-action-primary)]' : ''}`}
            >
              <p className="text-[13px] font-[550] text-[var(--p-color-text)]">{plan.slug}</p>
              <p className="text-[13px] text-[var(--p-color-text-secondary)]">
                {formatPrecio(plan)}
                {plan.precioMensualCentavos != null && '/mes'}
              </p>
              <ul className="mt-3 space-y-1 text-[12px] text-[var(--p-color-text-secondary)]">
                <li>{plan.maxProfesoresEditores} profesores/editores</li>
                <li>{plan.maxAlumnos ?? 'Ilimitados'} alumnos</li>
                <li>{plan.maxCursos ?? 'Ilimitados'} cursos</li>
                <li>{plan.dominioPropioHabilitado ? 'Con' : 'Sin'} dominio propio</li>
              </ul>

              {esActual ? (
                <p className="mt-4 text-[12px] font-[550] text-[var(--p-color-text-secondary)]">
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
                <Button onClick={() => setPlanEnEdicion(plan.id)} className="mt-4 w-full">
                  Cambiar a este plan
                </Button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
