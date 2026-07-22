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
    <div className="p-shell flex flex-1 flex-col md:flex-row">
      <aside className="flex flex-col gap-6 border-b border-[var(--p-color-border)] bg-[var(--p-color-surface)] p-6 md:w-56 md:border-b-0 md:border-r">
        <div>
          <p className="text-[13px] font-[550] text-[var(--p-color-text)]">
            {alumno.nombre}
          </p>
          <p className="text-[12px] text-[var(--p-color-text-secondary)]">
            {alumno.email}
          </p>
        </div>
        <nav className="flex flex-row gap-4 md:flex-col md:gap-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[13px] text-[var(--p-color-text-secondary)] transition hover:text-[var(--p-color-text)]"
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
