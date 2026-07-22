import Link from 'next/link';
import { serverApiFetch } from '@/lib/api-server';
import { AcademiasFiltro } from './academias-filtro';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AcademiaListItem {
  id: string;
  nombre: string;
  subdominio: string;
  estado: 'Activa' | 'Suspendida' | 'Cancelada';
  plan: { slug: string };
  createdAt: string;
}

const ESTADO_TONE: Record<AcademiaListItem['estado'], 'success' | 'warning' | 'critical'> = {
  Activa: 'success',
  Suspendida: 'warning',
  Cancelada: 'critical',
};

/** Documento 4, Flujo 9, punto 2 — listado de academias con búsqueda y filtro por estado. */
export default async function StaffAcademiasPage({
  searchParams,
}: {
  searchParams: Promise<{ busqueda?: string; estado?: string }>;
}) {
  const { busqueda, estado } = await searchParams;

  const params = new URLSearchParams();
  if (busqueda) params.set('busqueda', busqueda);
  if (estado) params.set('estado', estado);

  const academias = await serverApiFetch<AcademiaListItem[]>(
    `staff/academias${params.toString() ? `?${params.toString()}` : ''}`,
  );

  return (
    <div>
      <h1 className="text-[length:var(--p-text-xl)] font-[650] tracking-tight text-[var(--p-color-text)]">
        Academias
      </h1>

      <AcademiasFiltro busqueda={busqueda} estado={estado} />

      {academias.length === 0 ? (
        <p className="mt-6 text-[13px] text-[var(--p-color-text-secondary)]">
          Ninguna academia coincide con este filtro.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {academias.map((academia) => (
            <li key={academia.id}>
              <Link href={`/staff/academias/${academia.id}`}>
                <Card className="flex items-center justify-between p-4 transition hover:border-[var(--p-color-border-hover)]">
                  <div>
                    <p className="text-[13px] font-[550] text-[var(--p-color-text)]">
                      {academia.nombre}
                    </p>
                    <p className="text-[12px] text-[var(--p-color-text-secondary)]">
                      {academia.subdominio} · Plan {academia.plan.slug}
                    </p>
                  </div>
                  <Badge tone={ESTADO_TONE[academia.estado]}>{academia.estado}</Badge>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
