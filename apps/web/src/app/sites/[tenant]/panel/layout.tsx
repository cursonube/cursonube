import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ApiError } from '@/lib/api-client';
import { serverApiFetch } from '@/lib/api-server';
import { LogoutButton } from '@/components/logout-button';

interface AlumnoMe {
  id: string;
  email: string;
  nombre: string;
}

const NAV_ITEMS = [
  { href: '/panel', label: 'Mis Cursos' },
  { href: '/panel/certificados', label: 'Certificados' },
  { href: '/panel/compras', label: 'Mis Compras' },
  { href: '/panel/cuenta', label: 'Mi Cuenta' },
];

/**
 * Documento 11 (Panel del Alumno) — layout compartido por las 5 secciones:
 * chequea la sesión server-side (evita el parpadeo de mostrar contenido
 * protegido antes de redirigir, propio de un chequeo solo client-side) y
 * redirige a `/login` si no hay sesión de Alumno válida.
 */
export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let alumno: AlumnoMe;
  try {
    alumno = await serverApiFetch<AlumnoMe>('auth/alumno/me');
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      redirect('/login');
    }
    throw err;
  }

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <aside className="flex flex-col gap-6 border-b border-zinc-200 p-6 md:w-56 md:border-b-0 md:border-r dark:border-zinc-800">
        <div>
          <p className="text-sm font-medium">{alumno.nombre}</p>
          <p className="text-xs text-zinc-500">{alumno.email}</p>
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
          <LogoutButton logoutPath="auth/alumno/logout" />
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
