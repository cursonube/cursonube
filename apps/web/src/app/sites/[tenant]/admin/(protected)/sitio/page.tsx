import Link from 'next/link';
import { ApiError } from '@/lib/api-client';
import { serverApiFetch } from '@/lib/api-server';
import { BloqueadoPorImpago } from '@/components/bloqueado-por-impago';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
      <h1 className="text-[length:var(--p-text-xl)] font-[650] tracking-tight text-[var(--p-color-text)]">
        Sitio
      </h1>
      <p className="mt-1 text-[13px] text-[var(--p-color-text-secondary)]">
        Elegí una página para editar sus bloques.
      </p>

      <ul className="mt-6 space-y-3">
        {paginas.map((pagina) => (
          <li key={pagina.id}>
            <Link href={`/admin/sitio/${pagina.id}`}>
              <Card className="flex items-center justify-between p-4 transition hover:border-[var(--p-color-border-hover)]">
                <p className="text-[13px] font-[550] text-[var(--p-color-text)]">
                  {TIPO_LABEL[pagina.tipo] ?? pagina.titulo}
                </p>
                <Badge tone={pagina.estado === 'Publicada' ? 'success' : 'neutral'}>
                  {pagina.estado}
                </Badge>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
