import { cookies, headers } from 'next/headers';
import { extractSubdomain } from '@/middleware';
import { DEV_TENANT_COOKIE, resolveDevTenantOverride } from './dev-tenant';
import { parseResponse } from './api-client';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000/api/v1';

/**
 * Para Server Components — llamada servidor-a-servidor directa a la API
 * (sin pasar por el proxy, no hay browser de por medio así que no hay CORS
 * que evitar). Reenvía manualmente el subdominio del tenant y las cookies
 * de la request entrante — solo para lecturas (GET); las mutaciones que
 * necesitan setear cookies de vuelta (login, etc.) van por `apiFetch` desde
 * un Client Component.
 */
export async function serverApiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const requestHeaders = await headers();
  const cookieStore = await cookies();
  const subdomain =
    extractSubdomain(requestHeaders.get('host') ?? '') ??
    resolveDevTenantOverride(null, cookieStore.get(DEV_TENANT_COOKIE)?.value);

  const response = await fetch(`${API_BASE_URL}/${path}`, {
    ...init,
    headers: {
      cookie: cookieStore.toString(),
      ...(subdomain ? { 'x-cursonube-tenant-subdomain': subdomain } : {}),
      ...init?.headers,
    },
    cache: 'no-store',
  });
  return parseResponse<T>(response);
}
