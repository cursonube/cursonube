import { ApiError } from '@/lib/api-client';
import { serverApiFetch } from '@/lib/api-server';
import { FacturacionView } from './facturacion-view';

export interface Plan {
  id: string;
  slug: 'Free' | 'Starter' | 'Pro' | 'Business';
  maxProfesoresEditores: number;
  maxAlumnos: number | null;
  maxCursos: number | null;
  dominioPropioHabilitado: boolean;
  marcaCursonubeVisible: boolean;
  precioMensualCentavos: number | null;
  moneda: string | null;
}

export interface EstadoBilling {
  academiaEstado: 'Activa' | 'Suspendida' | 'Cancelada';
  plan: Plan;
  suscripcion: {
    id: string;
    estado: 'Activa' | 'Pausada' | 'Vencida' | 'Cancelada';
    fechaProximaFacturacion: string | null;
  } | null;
}

/** Documento 10, sección 1 — "Plan y Facturación". Exclusivo del rol Owner (Documento 7, P2). */
export default async function FacturacionPage() {
  try {
    const [planes, estado] = await Promise.all([
      serverApiFetch<Plan[]>('planes'),
      serverApiFetch<EstadoBilling>('billing/suscripcion'),
    ]);
    return <FacturacionView planesDisponibles={planes} estadoInicial={estado} />;
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) {
      return (
        <p className="text-sm text-zinc-500">
          Solo el Owner de la academia puede ver esta sección.
        </p>
      );
    }
    throw err;
  }
}
