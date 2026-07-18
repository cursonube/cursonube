import { serverApiFetch } from '@/lib/api-server';

interface Estadisticas {
  tenantsActivos: number;
  altasDelMes: number;
  mrrCentavos: number;
}

function Card({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
      <p className="text-sm text-zinc-500">{titulo}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{valor}</p>
    </div>
  );
}

/** Documento 4, Flujo 9, punto 5 — estadísticas globales del sistema. */
export default async function StaffEstadisticasPage() {
  const stats = await serverApiFetch<Estadisticas>('staff/estadisticas');

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Estadísticas</h1>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card titulo="Tenants activos" valor={String(stats.tenantsActivos)} />
        <Card titulo="Altas del mes" valor={String(stats.altasDelMes)} />
        <Card
          titulo="MRR total"
          valor={new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
          }).format(stats.mrrCentavos / 100)}
        />
      </div>
    </div>
  );
}
