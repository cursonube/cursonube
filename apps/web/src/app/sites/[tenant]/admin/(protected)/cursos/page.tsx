import Link from 'next/link';
import { ApiError } from '@/lib/api-client';
import { serverApiFetch } from '@/lib/api-server';
import { BloqueadoPorImpago } from '@/components/bloqueado-por-impago';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonClassName } from '@/components/ui/button';

interface Curso {
  id: string;
  titulo: string;
  estado: 'Borrador' | 'Publicado';
  tipoAcceso: 'Gratis' | 'PagoUnico';
  precioCentavos: number | null;
  moneda: string | null;
}

const ESTADO_TONE: Record<Curso['estado'], 'neutral' | 'success'> = {
  Borrador: 'neutral',
  Publicado: 'success',
};

/** Documento 10, sección 1 — "Cursos": listado, creación y edición. */
export default async function CursosPage() {
  let cursos: Curso[];
  try {
    cursos = await serverApiFetch<Curso[]>('cursos');
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) {
      return <BloqueadoPorImpago />;
    }
    throw err;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-[length:var(--p-text-xl)] font-[650] tracking-tight text-[var(--p-color-text)]">
          Cursos
        </h1>
        <Link href="/admin/cursos/nuevo" className={buttonClassName('primary')}>
          Crear curso
        </Link>
      </div>

      {cursos.length === 0 ? (
        <p className="mt-6 text-[13px] text-[var(--p-color-text-secondary)]">
          Todavía no creaste ningún curso.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {cursos.map((curso) => (
            <li key={curso.id}>
              <Link href={`/admin/cursos/${curso.id}`}>
                <Card className="flex items-center justify-between p-4 transition hover:border-[var(--p-color-border-hover)]">
                  <div>
                    <p className="text-[13px] font-[550] text-[var(--p-color-text)]">
                      {curso.titulo}
                    </p>
                    <p className="text-[12px] text-[var(--p-color-text-secondary)]">
                      {curso.tipoAcceso === 'Gratis'
                        ? 'Gratis'
                        : `${curso.moneda} ${((curso.precioCentavos ?? 0) / 100).toLocaleString('es-AR')}`}
                    </p>
                  </div>
                  <Badge tone={ESTADO_TONE[curso.estado]}>{curso.estado}</Badge>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
