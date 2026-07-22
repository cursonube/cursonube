import Link from 'next/link';
import { ApiError } from '@/lib/api-client';
import { serverApiFetch } from '@/lib/api-server';
import { BloqueadoPorImpago } from '@/components/bloqueado-por-impago';
import { Card } from '@/components/ui/card';

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
      <h1 className="text-[length:var(--p-text-xl)] font-[650] tracking-tight text-[var(--p-color-text)]">
        Inicio
      </h1>

      {pendientes.length > 0 && (
        <Card className="mt-4 max-w-xl p-4">
          <p className="mb-2 text-[13px] font-[550] text-[var(--p-color-text)]">
            Primeros pasos
          </p>
          <ul className="space-y-1.5 text-[13px]">
            {pendientes.map((item) => (
              <li
                key={item.texto}
                className="flex items-center gap-2 text-[var(--p-color-text-secondary)]"
              >
                <span>☐</span>
                {item.href ? (
                  <Link href={item.href} className="text-[var(--p-color-text-link)] underline">
                    {item.texto}
                  </Link>
                ) : (
                  <span>{item.texto} (próximamente)</span>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-[12px] text-[var(--p-color-text-secondary)]">Ventas del mes</p>
          <p className="mt-1 text-[length:var(--p-text-2xl)] font-[650] text-[var(--p-color-text)]">
            {formatMonto(metricas.ventasDelMesCentavos)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[12px] text-[var(--p-color-text-secondary)]">
            Alumnos nuevos (mes)
          </p>
          <p className="mt-1 text-[length:var(--p-text-2xl)] font-[650] text-[var(--p-color-text)]">
            {metricas.alumnosNuevosDelMes}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[12px] text-[var(--p-color-text-secondary)]">Cursos publicados</p>
          <p className="mt-1 text-[length:var(--p-text-2xl)] font-[650] text-[var(--p-color-text)]">
            {metricas.cursosPublicados}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[12px] text-[var(--p-color-text-secondary)]">
            Tasa de finalización
          </p>
          <p className="mt-1 text-[length:var(--p-text-2xl)] font-[650] text-[var(--p-color-text)]">
            {metricas.tasaFinalizacionPromedio}%
          </p>
        </Card>
      </div>

      <h2 className="mt-8 mb-3 text-[12px] font-[550] text-[var(--p-color-text-secondary)] uppercase tracking-wide">
        Actividad reciente
      </h2>
      {actividadReciente.length === 0 ? (
        <p className="text-[13px] text-[var(--p-color-text-secondary)]">
          Todavía no hay actividad para mostrar.
        </p>
      ) : (
        <ul className="max-w-xl space-y-2">
          {actividadReciente.map((evento, i) => (
            <li key={i} className="flex items-start gap-2 text-[13px]">
              <span>{TIPO_ICONO[evento.tipo]}</span>
              <div>
                <p>{evento.descripcion}</p>
                <p className="text-[12px] text-[var(--p-color-text-secondary)]">
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
