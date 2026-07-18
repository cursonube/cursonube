export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(
      typeof body === 'object' && body && 'message' in body
        ? String((body as { message: unknown }).message)
        : `Error ${status} llamando a la API`,
    );
  }
}

export async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const data = text ? JSON.parse(text) : undefined;
  if (!response.ok) {
    throw new ApiError(response.status, data);
  }
  return data as T;
}

/**
 * Para Client Components — pasa por el proxy same-origin
 * (`/api/backend/...`, ver route handler) para que el browser nunca le
 * pegue directo a la API (Documento 2, A2) y las cookies de sesión que la
 * API emite queden atadas a este mismo origen (Documento 7).
 *
 * Separado de `api-server.ts` (que importa `next/headers`) porque Next no
 * permite que un módulo importado por un Client Component arrastre
 * imports server-only, aunque el Client Component nunca llame a esa parte.
 */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`/api/backend/${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  return parseResponse<T>(response);
}
