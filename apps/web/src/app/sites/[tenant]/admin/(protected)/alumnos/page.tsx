import Link from 'next/link';
import { ApiError } from '@/lib/api-client';
import { serverApiFetch } from '@/lib/api-server';
import { BloqueadoPorImpago } from '@/components/bloqueado-por-impago';

interface Inscripcion {
  inscripcionId: string;
  curso: { id: string; titulo: string };
  estado: 'Activa' | 'Completada' | 'Cancelada';
  fechaInscripcion: string;
  clasesCompletadas: number;
  totalClases: number;
}

interface Alumno {
  id: string;
  nombre: string;
  email: string;
  inscripciones: Inscripcion[];
}

const ESTADO_BADGE: Record<Inscripcion['estado'], string> = {
  Activa: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  Completada: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  Cancelada: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
};

/** Documento 10, sección 3 — "Alumnos": listado global de alumnos con su progreso. */
export default async function AlumnosPage() {
  let alumnos: Alumno[];
  try {
    alumnos = await serverApiFetch<Alumno[]>('alumnos');
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) {
      return <BloqueadoPorImpago />;
    }
    throw err;
  }

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Alumnos</h1>

      {alumnos.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">
          Todavía no tenés alumnos inscriptos.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {alumnos.map((alumno) => (
            <li key={alumno.id}>
              <Link
                href={`/admin/alumnos/${alumno.id}`}
                className="block rounded-lg border border-zinc-200 p-4 transition hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{alumno.nombre}</p>
                    <p className="text-xs text-zinc-500">{alumno.email}</p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {alumno.inscripciones.map((inscripcion) => (
                    <span
                      key={inscripcion.inscripcionId}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${ESTADO_BADGE[inscripcion.estado]}`}
                    >
                      {inscripcion.curso.titulo} · {inscripcion.clasesCompletadas}/
                      {inscripcion.totalClases}
                    </span>
                  ))}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
