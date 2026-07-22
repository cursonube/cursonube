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
  { href: '/admin', label: 'Inicio' },
  { href: '/admin/cursos', label: 'Cursos' },
  { href: '/admin/sitio', label: 'Sitio' },
  { href: '/admin/alumnos', label: 'Alumnos' },
  { href: '/admin/contactos', label: 'Contactos' },
  // Documento 7, decisión P2: exclusivo del rol Owner.
  {
    href: '/admin/facturacion',
    label: 'Plan y Facturación',
    roles: ['Owner'],
  },
  // Documento 10, nav: Owner y Administrador.
  {
    href: '/admin/configuracion',
    label: 'Configuración',
    roles: ['Owner', 'Administrador'],
  },
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
    <div className="p-shell flex flex-1 flex-col md:flex-row">
      <aside className="flex flex-col gap-6 border-b border-[var(--p-color-border)] bg-[var(--p-color-surface)] p-6 md:w-56 md:border-b-0 md:border-r">
        <div>
          <p className="text-[13px] font-[550] text-[var(--p-color-text)]">
            {usuario.email}
          </p>
          <p className="text-[12px] text-[var(--p-color-text-secondary)]">
            {usuario.rol}
          </p>
        </div>
        <nav className="flex flex-row gap-4 md:flex-col md:gap-2">
          {NAV_ITEMS.filter(
            (item) => !item.roles || (item.roles as string[]).includes(usuario.rol),
          ).map(
            (item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[13px] text-[var(--p-color-text-secondary)] transition hover:text-[var(--p-color-text)]"
              >
                {item.label}
              </Link>
            ),
          )}
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
