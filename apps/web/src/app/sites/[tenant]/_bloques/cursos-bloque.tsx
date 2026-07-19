import Link from 'next/link';
import { serverApiFetch } from '@/lib/api-server';
import type { Bloque } from './tipos';

interface CursoResumen {
  id: string;
  titulo: string;
  slug: string;
  tipoAcceso: 'Gratis' | 'PagoUnico';
  precioCentavos: number | null;
  moneda: string | null;
  imagenPortadaUrl: string | null;
}

function formatPrecio(centavos: number | null, moneda: string | null) {
  if (centavos === null) return 'Gratis';
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: moneda ?? 'ARS' }).format(
    centavos / 100,
  );
}

/**
 * Documento 5, sección 3 — bloque "Cursos": listado de cursos publicados.
 * `seleccion` (destacados/todos) no distingue todavía porque no existe un
 * flag de "destacado" en Curso (Documento 5, sección 3 no lo modela) — ver
 * nota en `CursoService.listPublicados`.
 */
export async function CursosBloque({ propiedades }: { propiedades: Bloque['propiedades'] }) {
  const { titulo, columnas = 3 } = propiedades;
  const cursos = await serverApiFetch<CursoResumen[]>('cursos/publico');

  if (cursos.length === 0) return null;

  const columnasClase =
    columnas === 2 ? 'sm:grid-cols-2' : columnas === 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-3';

  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      {titulo && <h2 className="text-center text-2xl font-semibold tracking-tight">{titulo}</h2>}
      <div className={`mt-6 grid grid-cols-1 gap-6 ${columnasClase}`}>
        {cursos.map((curso) => (
          <Link
            key={curso.id}
            href={`/cursos/${curso.slug}`}
            className="overflow-hidden rounded-lg border border-zinc-200 transition hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
          >
            {curso.imagenPortadaUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={curso.imagenPortadaUrl}
                alt=""
                className="aspect-video w-full object-cover"
              />
            )}
            <div className="p-4">
              <p className="font-medium">{curso.titulo}</p>
              <p className="mt-1 text-sm text-zinc-500">
                {formatPrecio(curso.precioCentavos, curso.moneda)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
