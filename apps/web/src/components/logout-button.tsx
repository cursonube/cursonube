'use client';

import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';

export function LogoutButton({
  logoutPath,
  redirectTo = '/login',
}: {
  logoutPath: string;
  redirectTo?: string;
}) {
  const router = useRouter();

  async function handleLogout() {
    await apiFetch(logoutPath, { method: 'POST' });
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-zinc-500 transition hover:text-zinc-900 dark:hover:text-zinc-100"
    >
      Cerrar sesión
    </button>
  );
}
