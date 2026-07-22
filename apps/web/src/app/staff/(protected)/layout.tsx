import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ApiError } from '@/lib/api-client';
import { serverApiFetch } from '@/lib/api-server';
import { LogoutButton } from '@/components/logout-button';

interface StaffMe {
  id: string;
  email: string;
  rol: 'SuperAdmin' | 'Soporte';
}

const NAV_ITEMS = [
  { href: '/staff/academias', label: 'Academias' },
  { href: '/staff/estadisticas', label: 'Estadísticas' },
];

/**
 * Documento 4, Flujo 9 — Panel de Administración interno. Vive en el
 * dominio raíz, fuera de la estructura `sites/[tenant]` — nunca se accede
 * desde el subdominio de una academia (Documento 7, sección 2).
 */
export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let staff: StaffMe;
  try {
    staff = await serverApiFetch<StaffMe>('staff/auth/me');
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      redirect('/staff/login');
    }
    throw err;
  }

  return (
    <div className="p-shell flex flex-1 flex-col md:flex-row">
      <aside className="flex flex-col gap-6 border-b border-[var(--p-color-border)] bg-[var(--p-color-surface)] p-6 md:w-56 md:border-b-0 md:border-r">
        <div>
          <p className="text-[13px] font-[550] text-[var(--p-color-text)]">
            {staff.email}
          </p>
          <p className="text-[12px] text-[var(--p-color-text-secondary)]">
            {staff.rol}
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
          <LogoutButton logoutPath="staff/auth/logout" redirectTo="/staff/login" />
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
