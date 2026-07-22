'use client';

import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';

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
    <Button variant="plain" onClick={handleLogout} className="!justify-start !px-0">
      Cerrar sesión
    </Button>
  );
}
