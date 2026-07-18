import Link from 'next/link';
import { serverApiFetch } from '@/lib/api-server';

interface Curso {
  id: string;
  titulo: string;
  estado: 'Borrador' | 'Publicado';
  tipoAcceso: 'Gratis' | 'PagoUnico';
  precioCentavos: number | null;
  moneda: string | null;
}

const ESTADO_BADGE: Record<Curso['estado'], string> = {
  Borrador: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  Publicado: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
};

/** Documento 10, sección 1 — "Cursos": listado, creación y edición. */
export default async function CursosPage() {
  const cursos = await serverApiFetch<Curso[]>('cursos');

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Cursos</h1>
        <Link
          href="/admin/cursos/nuevo"
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
        >
          Crear curso
        </Link>
      </div>

      {cursos.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">
          Todavía no creaste ningún curso.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {cursos.map((curso) => (
            <li key={curso.id}>
              <Link
                href={`/admin/cursos/${curso.id}`}
                className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 transition hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
              >
                <div>
                  <p className="font-medium">{curso.titulo}</p>
                  <p className="text-xs text-zinc-500">
                    {curso.tipoAcceso === 'Gratis'
                      ? 'Gratis'
                      : `${curso.moneda} ${((curso.precioCentavos ?? 0) / 100).toLocaleString('es-AR')}`}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${ESTADO_BADGE[curso.estado]}`}
                >
                  {curso.estado}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
