import Link from 'next/link';
import { ApiError } from '@/lib/api-client';
import { serverApiFetch } from '@/lib/api-server';
import { BloqueadoPorImpago } from '@/components/bloqueado-por-impago';

interface DashboardData {
  checklist: {
    tieneCursos: boolean;
    tieneMercadoPagoConectado: boolean;
    tieneEquipo: boolean;
  };
  metricas: {
    ventasDelMesCentavos: number;
    alumnosNuevosDelMes: number;
    cursosPublicados: number;
    tasaFinalizacionPromedio: number;
  };
  actividadReciente: Array<{
    tipo: 'venta' | 'alumno' | 'lead';
    fecha: string;
    descripcion: string;
  }>;
}

const TIPO_ICONO: Record<DashboardData['actividadReciente'][number]['tipo'], string> = {
  venta: '💰',
  alumno: '🎓',
  lead: '✉️',
};

function formatMonto(centavos: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(
    centavos / 100,
  );
}

/** Documento 10, sección 2 — "Inicio": checklist de activación + métricas + actividad reciente. */
export default async function InicioPage() {
  let data: DashboardData;
  try {
    data = await serverApiFetch<DashboardData>('dashboard');
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) {
      return <BloqueadoPorImpago />;
    }
    throw err;
  }

  const { checklist, metricas, actividadReciente } = data;
  const checklistItems = [
    {
      hecho: checklist.tieneCursos,
      texto: 'Agregá tu primer curso',
      href: '/admin/cursos/nuevo',
    },
    {
      hecho: checklist.tieneMercadoPagoConectado,
      texto: 'Conectá tu Mercado Pago',
      href: null,
    },
    {
      hecho: checklist.tieneEquipo,
      texto: 'Invitá a tu equipo',
      href: null,
    },
  ];
  const pendientes = checklistItems.filter((item) => !item.hecho);

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Inicio</h1>

      {pendientes.length > 0 && (
        <div className="mt-4 max-w-xl rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="mb-2 text-sm font-medium">Primeros pasos</p>
          <ul className="space-y-1.5 text-sm">
            {pendientes.map((item) => (
              <li key={item.texto} className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                <span>☐</span>
                {item.href ? (
                  <Link href={item.href} className="underline">
                    {item.texto}
                  </Link>
                ) : (
                  <span>{item.texto} (próximamente)</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-xs text-zinc-500">Ventas del mes</p>
          <p className="mt-1 text-2xl font-semibold">
            {formatMonto(metricas.ventasDelMesCentavos)}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-xs text-zinc-500">Alumnos nuevos (mes)</p>
          <p className="mt-1 text-2xl font-semibold">{metricas.alumnosNuevosDelMes}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-xs text-zinc-500">Cursos publicados</p>
          <p className="mt-1 text-2xl font-semibold">{metricas.cursosPublicados}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-xs text-zinc-500">Tasa de finalización</p>
          <p className="mt-1 text-2xl font-semibold">
            {metricas.tasaFinalizacionPromedio}%
          </p>
        </div>
      </div>

      <h2 className="mt-8 mb-3 text-sm font-medium text-zinc-500 uppercase tracking-wide">
        Actividad reciente
      </h2>
      {actividadReciente.length === 0 ? (
        <p className="text-sm text-zinc-500">Todavía no hay actividad para mostrar.</p>
      ) : (
        <ul className="max-w-xl space-y-2">
          {actividadReciente.map((evento, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span>{TIPO_ICONO[evento.tipo]}</span>
              <div>
                <p>{evento.descripcion}</p>
                <p className="text-xs text-zinc-500">
                  {new Date(evento.fecha).toLocaleString('es-AR')}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
