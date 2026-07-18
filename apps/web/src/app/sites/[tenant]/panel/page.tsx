import Link from 'next/link';
import { serverApiFetch } from '@/lib/api-server';

interface MiCurso {
  inscripcionId: string;
  estado: 'Activa' | 'Completada' | 'Cancelada';
  curso: { id: string; titulo: string; slug: string };
  progreso: { totalClases: number; clasesCompletadas: number; porcentaje: number };
}

const ESTADO_LABEL: Record<MiCurso['estado'], string> = {
  Activa: '',
  Completada: 'Completado',
  Cancelada: 'Acceso revocado',
};

/** Documento 11, sección 1 — "Mis Cursos". */
export default async function MisCursosPage() {
  const misCursos = await serverApiFetch<MiCurso[]>('alumno/mis-cursos');

  if (misCursos.length === 0) {
    return (
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Mis Cursos</h1>
        <p className="mt-4 text-sm text-zinc-500">
          Todavía no estás inscripto en ningún curso.{' '}
          <Link href="/cursos" className="underline">
            Explorar cursos
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Mis Cursos</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {misCursos.map((item) => {
          const revocado = item.estado === 'Cancelada';
          const contenido = (
            <div className="h-full rounded-lg border border-zinc-200 p-5 transition hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600">
              <h2 className="font-medium">{item.curso.titulo}</h2>
              {revocado ? (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  Acceso revocado — contactá a la academia para más
                  información
                </p>
              ) : (
                <>
                  <div className="mt-3 h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="h-1.5 rounded-full bg-zinc-900 dark:bg-white"
                      style={{ width: `${item.progreso.porcentaje}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">
                    {ESTADO_LABEL[item.estado] ||
                      `${item.progreso.clasesCompletadas}/${item.progreso.totalClases} clases · ${item.progreso.porcentaje}%`}
                  </p>
                </>
              )}
            </div>
          );

          return revocado ? (
            <div key={item.inscripcionId}>{contenido}</div>
          ) : (
            <Link key={item.inscripcionId} href={`/panel/cursos/${item.curso.id}`}>
              {contenido}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
