import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { INTERNAL_REWRITE_HEADER } from '@/middleware';

/**
 * Guard de seguridad compartido por todo lo que cuelga de /sites/[tenant]
 * (home, login, panel, admin más adelante) — ver nota en src/middleware.ts.
 * Antes vivía duplicado dentro de cada page.tsx; centralizado acá para que
 * ninguna ruta nueva se olvide de chequearlo.
 */
export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const requestHeaders = await headers();
  if (!requestHeaders.get(INTERNAL_REWRITE_HEADER)) {
    notFound();
  }

  return children;
}
