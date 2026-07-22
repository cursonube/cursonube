import Link from 'next/link';
import { ApiError } from '@/lib/api-client';
import { serverApiFetch } from '@/lib/api-server';
import { BloqueadoPorImpago } from '@/components/bloqueado-por-impago';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

const ESTADO_TONE: Record<Inscripcion['estado'], 'info' | 'success' | 'critical'> = {
  Activa: 'info',
  Completada: 'success',
  Cancelada: 'critical',
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
      <h1 className="text-[length:var(--p-text-xl)] font-[650] tracking-tight text-[var(--p-color-text)]">
        Alumnos
      </h1>

      {alumnos.length === 0 ? (
        <p className="mt-6 text-[13px] text-[var(--p-color-text-secondary)]">
          Todavía no tenés alumnos inscriptos.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {alumnos.map((alumno) => (
            <li key={alumno.id}>
              <Link href={`/admin/alumnos/${alumno.id}`}>
                <Card className="p-4 transition hover:border-[var(--p-color-border-hover)]">
                  <div>
                    <p className="text-[13px] font-[550] text-[var(--p-color-text)]">
                      {alumno.nombre}
                    </p>
                    <p className="text-[12px] text-[var(--p-color-text-secondary)]">
                      {alumno.email}
                    </p>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {alumno.inscripciones.map((inscripcion) => (
                      <Badge key={inscripcion.inscripcionId} tone={ESTADO_TONE[inscripcion.estado]}>
                        {inscripcion.curso.titulo} · {inscripcion.clasesCompletadas}/
                        {inscripcion.totalClases}
                      </Badge>
                    ))}
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
