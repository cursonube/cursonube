import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ApiError } from '@/lib/api-client';
import { serverApiFetch } from '@/lib/api-server';
import { LogoutButton } from '@/components/logout-button';

interface AcademiaUsuarioMe {
  id: string;
  email: string;
  rol: 'Owner' | 'Administrador' | 'Profesor' | 'Editor';
  estado: string;
}

/**
 * Documento 10 (Panel del Creador) — navegación completa tiene 8 secciones;
 * acá solo se listan las que ya están construidas (Cursos, Sitio). Agregar
 * un link a una sección sin implementar sería peor que no mostrarla.
 */
const NAV_ITEMS = [
  { href: '/admin/cursos', label: 'Cursos' },
  { href: '/admin/sitio', label: 'Sitio' },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let usuario: AcademiaUsuarioMe;
  try {
    usuario = await serverApiFetch<AcademiaUsuarioMe>('auth/academia/me');
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      redirect('/admin/login');
    }
    throw err;
  }

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <aside className="flex flex-col gap-6 border-b border-zinc-200 p-6 md:w-56 md:border-b-0 md:border-r dark:border-zinc-800">
        <div>
          <p className="text-sm font-medium">{usuario.email}</p>
          <p className="text-xs text-zinc-500">{usuario.rol}</p>
        </div>
        <nav className="flex flex-row gap-4 md:flex-col md:gap-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto hidden md:block">
          <LogoutButton
            logoutPath="auth/academia/logout"
            redirectTo="/admin/login"
          />
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
