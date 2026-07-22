import { serverApiFetch } from '@/lib/api-server';
import { Card } from '@/components/ui/card';

interface Estadisticas {
  tenantsActivos: number;
  altasDelMes: number;
  mrrCentavos: number;
}

function StatCard({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <Card className="p-6">
      <p className="text-[13px] text-[var(--p-color-text-secondary)]">{titulo}</p>
      <p className="mt-1 text-[length:var(--p-text-2xl)] font-[650] tracking-tight text-[var(--p-color-text)]">
        {valor}
      </p>
    </Card>
  );
}

/** Documento 4, Flujo 9, punto 5 — estadísticas globales del sistema. */
export default async function StaffEstadisticasPage() {
  const stats = await serverApiFetch<Estadisticas>('staff/estadisticas');

  return (
    <div>
      <h1 className="text-[length:var(--p-text-xl)] font-[650] tracking-tight text-[var(--p-color-text)]">
        Estadísticas
      </h1>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard titulo="Tenants activos" valor={String(stats.tenantsActivos)} />
        <StatCard titulo="Altas del mes" valor={String(stats.altasDelMes)} />
        <StatCard
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
