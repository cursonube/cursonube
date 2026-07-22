import Link from 'next/link';
import { serverApiFetch } from '@/lib/api-server';
import { Card } from '@/components/ui/card';

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
        <h1 className="text-[length:var(--p-text-xl)] font-[650] tracking-tight text-[var(--p-color-text)]">
          Mis Cursos
        </h1>
        <p className="mt-4 text-[13px] text-[var(--p-color-text-secondary)]">
          Todavía no estás inscripto en ningún curso.{' '}
          <Link href="/cursos" className="text-[var(--p-color-text-link)] underline">
            Explorar cursos
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-[length:var(--p-text-xl)] font-[650] tracking-tight text-[var(--p-color-text)]">
        Mis Cursos
      </h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {misCursos.map((item) => {
          const revocado = item.estado === 'Cancelada';
          const contenido = (
            <Card className="h-full p-5 transition hover:border-[var(--p-color-border-hover)]">
              <h2 className="text-[13px] font-[550] text-[var(--p-color-text)]">
                {item.curso.titulo}
              </h2>
              {revocado ? (
                <p className="mt-2 text-[13px] text-[var(--p-color-critical-secondary)]">
                  Acceso revocado — contactá a la academia para más
                  información
                </p>
              ) : (
                <>
                  <div className="mt-3 h-1.5 w-full rounded-[var(--p-radius-full)] bg-[var(--p-color-surface-secondary)]">
                    <div
                      className="h-1.5 rounded-[var(--p-radius-full)] bg-[var(--p-color-action-primary)]"
                      style={{ width: `${item.progreso.porcentaje}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[12px] text-[var(--p-color-text-secondary)]">
                    {ESTADO_LABEL[item.estado] ||
                      `${item.progreso.clasesCompletadas}/${item.progreso.totalClases} clases · ${item.progreso.porcentaje}%`}
                  </p>
                </>
              )}
            </Card>
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
