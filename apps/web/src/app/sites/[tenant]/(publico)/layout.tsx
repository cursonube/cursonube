import Link from 'next/link';
import { serverApiFetch } from '@/lib/api-server';

interface BrandingPublico {
  nombre: string;
  logoUrl: string | null;
  colorPrimario: string;
  colorSecundario: string;
}

/**
 * Documento 5 — capa compartida del sitio público (Home, Cursos, Sobre
 * Nosotros, Contacto, FAQ, Políticas): header mínimo con la marca de la
 * academia + los design tokens de color que los bloques usan vía CSS
 * variables (Documento 5, sección 2). No cubre `/cursos/[slug]` (landing de
 * curso, ya construida aparte) ni `/admin`, `/panel`, `/login`.
 */
export default async function SitioPublicoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const branding = await serverApiFetch<BrandingPublico>('academias/branding-publico');

  return (
    <div
      style={
        {
          '--color-primario': branding.colorPrimario,
          '--color-secundario': branding.colorSecundario,
        } as React.CSSProperties
      }
    >
      <header className="flex items-center gap-3 border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          {branding.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branding.logoUrl} alt="" className="h-8 w-8 rounded object-cover" />
          )}
          {branding.nombre}
        </Link>
        <nav className="ml-auto flex gap-4 text-sm text-zinc-600 dark:text-zinc-400">
          <Link href="/cursos" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Cursos
          </Link>
          <Link href="/login" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Ingresar
          </Link>
        </nav>
      </header>
      {children}
    </div>
  );
}
