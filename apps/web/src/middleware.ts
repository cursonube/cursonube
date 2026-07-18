import { NextRequest, NextResponse } from 'next/server';
import { DEV_TENANT_COOKIE, resolveDevTenantOverride } from '@/lib/dev-tenant';

/**
 * Resolución de tenant por hostname — Documento 6 (Sistema Multi-Tenant),
 * sección 1, extendido por el Documento 17 (adenda: Sitio de Marketing).
 *
 * - Dominio raíz (cursonube.com / www.cursonube.com) → sitio de marketing,
 *   la request pasa sin modificar (sirve las rutas normales de app/).
 * - Subdominio reservado (Documento 4, Flujo 1) → nunca se trata como tenant.
 * - Cualquier otro subdominio → se reescribe a /sites/[tenant]/... para que
 *   Next.js renderice el sitio de esa academia, marcado con el header
 *   INTERNAL_REWRITE_HEADER (ver nota de seguridad más abajo).
 *
 * TODO (desarrollo, no scaffolding): reemplazar la validación de "¿existe
 * esta academia?" por la consulta real (con cache Redis, Documento 6,
 * sección 1, paso 2) contra la API de NestJS antes de reescribir — hoy
 * cualquier subdominio no reservado se asume válido y el 404 real ocurre
 * recién dentro de /sites/[tenant] al no encontrar la Academia.
 *
 * Nota de seguridad: /sites/[tenant] es una carpeta enrutable normal (no
 * puede empezar con "_", Next.js excluye esas del routing), lo que significa
 * que en teoría alguien podría pedir cursonube.com/sites/alguna-academia
 * directamente. Para que eso siga dando 404 (el sitio de una academia SOLO
 * debe verse desde su propio subdominio), el middleware agrega el header
 * INTERNAL_REWRITE_HEADER únicamente cuando reescribe por una resolución de
 * subdominio real — la página de destino debe verificarlo (ver
 * src/app/sites/[tenant]/page.tsx) y devolver notFound() si falta.
 */

export const INTERNAL_REWRITE_HEADER = 'x-cursonube-internal-rewrite';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'cursonube.com';

// Documento 4, Flujo 1: lista de subdominios reservados que ninguna academia puede tomar.
const RESERVED_SUBDOMAINS = new Set([
  'www',
  'admin',
  'app',
  'api',
  'mail',
  'cursonube',
]);

export function extractSubdomain(host: string): string | null {
  const hostname = host.split(':')[0]!.toLowerCase();

  if (hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}`) {
    return null;
  }

  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    return hostname.slice(0, -1 * (ROOT_DOMAIN.length + 1));
  }

  // Dominio propio (custom domain, V1.1 — Documento 6, sección 5): se resuelve
  // por lookup directo contra Academia.dominioPropio, no por sufijo de host.
  // El scaffold no distingue esto todavía; se resuelve junto con el TODO de arriba.
  return null;
}

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  const subdomain =
    extractSubdomain(host) ??
    resolveDevTenantOverride(
      request.nextUrl.searchParams.get('tenant'),
      request.cookies.get(DEV_TENANT_COOKIE)?.value,
    );

  if (!subdomain || RESERVED_SUBDOMAINS.has(subdomain)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/sites/${subdomain}${request.nextUrl.pathname}`;

  const headers = new Headers(request.headers);
  headers.set(INTERNAL_REWRITE_HEADER, '1');
  const response = NextResponse.rewrite(url, { request: { headers } });

  if (process.env.NODE_ENV !== 'production') {
    response.cookies.set(DEV_TENANT_COOKIE, subdomain, { path: '/' });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Todas las rutas excepto assets estáticos internos de Next.js y el
     * proxy same-origin hacia la API (/api/backend/*, ver ese route handler)
     * — el proxy debe resolverse igual sin importar el subdominio desde el
     * que se lo llame, nunca reescribirse a /sites/[tenant]/api/backend/...
     */
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};
