import Link from 'next/link';
import { serverApiFetch } from '@/lib/api-server';
import { AcademiasFiltro } from './academias-filtro';

interface AcademiaListItem {
  id: string;
  nombre: string;
  subdominio: string;
  estado: 'Activa' | 'Suspendida' | 'Cancelada';
  plan: { slug: string };
  createdAt: string;
}

const ESTADO_BADGE: Record<AcademiaListItem['estado'], string> = {
  Activa: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  Suspendida: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Cancelada: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
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
      <h1 className="text-xl font-semibold tracking-tight">Academias</h1>

      <AcademiasFiltro busqueda={busqueda} estado={estado} />

      {academias.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">
          Ninguna academia coincide con este filtro.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {academias.map((academia) => (
            <li key={academia.id}>
              <Link
                href={`/staff/academias/${academia.id}`}
                className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 transition hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
              >
                <div>
                  <p className="font-medium">{academia.nombre}</p>
                  <p className="text-xs text-zinc-500">
                    {academia.subdominio} · Plan {academia.plan.slug}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${ESTADO_BADGE[academia.estado]}`}
                >
                  {academia.estado}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
