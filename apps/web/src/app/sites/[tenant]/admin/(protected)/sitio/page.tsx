import Link from 'next/link';
import { ApiError } from '@/lib/api-client';
import { serverApiFetch } from '@/lib/api-server';
import { BloqueadoPorImpago } from '@/components/bloqueado-por-impago';

interface Pagina {
  id: string;
  tipo: string;
  titulo: string;
  slug: string;
  estado: 'Borrador' | 'Publicada';
}

const TIPO_LABEL: Record<string, string> = {
  Home: 'Inicio',
  Cursos: 'Cursos',
  SobreNosotros: 'Sobre Nosotros',
  Contacto: 'Contacto',
  Faq: 'Preguntas Frecuentes',
  Politicas: 'Políticas',
  Login: 'Iniciar Sesión',
  Custom: 'Personalizada',
};

/**
 * Documento 10, sección 1 — "Sitio": editor de bloques por página. Solo
 * existen endpoints de lectura + edición de bloques sobre páginas ya
 * provisionadas por el wizard (Documento 6) — crear páginas nuevas o
 * cambiar su estado de publicación no tiene endpoint todavía.
 */
export default async function SitioPage() {
  let paginas: Pagina[];
  try {
    paginas = await serverApiFetch<Pagina[]>('paginas');
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) {
      return <BloqueadoPorImpago />;
    }
    throw err;
  }

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Sitio</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Elegí una página para editar sus bloques.
      </p>

      <ul className="mt-6 space-y-3">
        {paginas.map((pagina) => (
          <li key={pagina.id}>
            <Link
              href={`/admin/sitio/${pagina.id}`}
              className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 transition hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
            >
              <p className="font-medium">
                {TIPO_LABEL[pagina.tipo] ?? pagina.titulo}
              </p>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  pagina.estado === 'Publicada'
                    ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                }`}
              >
                {pagina.estado}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
