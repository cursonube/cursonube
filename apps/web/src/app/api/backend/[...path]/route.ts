import { NextRequest, NextResponse } from 'next/server';
import { extractSubdomain } from '@/middleware';
import { DEV_TENANT_COOKIE, resolveDevTenantOverride } from '@/lib/dev-tenant';

/**
 * Proxy same-origin hacia la API de NestJS (Documento 2, decisión A2: dos
 * servicios separados). El browser le pega a este route handler, nunca
 * directo a la API — evita configurar CORS y mantiene las cookies de sesión
 * atadas al hostname exacto del panel (Documento 7, sección 1): el
 * Set-Cookie que Nest emite se reenvía tal cual en la respuesta de Next, así
 * que el browser lo guarda scoped a este origen, no a uno de la API.
 *
 * El subdominio (para el header `x-cursonube-tenant-subdomain` que espera
 * `TenantContextMiddleware` del lado de la API, Documento 6) se deriva del
 * mismo Host que ya resuelve el middleware de Next — nunca se confía en un
 * valor que mande el cliente.
 */
const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000/api/v1';

async function proxy(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const subdomain =
    extractSubdomain(request.headers.get('host') ?? '') ??
    resolveDevTenantOverride(
      null,
      request.cookies.get(DEV_TENANT_COOKIE)?.value,
    );

  const targetUrl = new URL(`${API_BASE_URL}/${path.join('/')}`);
  targetUrl.search = request.nextUrl.search;

  const forwardHeaders = new Headers();
  const contentType = request.headers.get('content-type');
  if (contentType) {
    forwardHeaders.set('content-type', contentType);
  }
  const cookie = request.headers.get('cookie');
  if (cookie) {
    forwardHeaders.set('cookie', cookie);
  }
  if (subdomain) {
    forwardHeaders.set('x-cursonube-tenant-subdomain', subdomain);
  }

  const hasBody = !['GET', 'HEAD'].includes(request.method);

  const apiResponse = await fetch(targetUrl, {
    method: request.method,
    headers: forwardHeaders,
    body: hasBody ? await request.arrayBuffer() : undefined,
    redirect: 'manual',
  });

  const responseHeaders = new Headers();
  const responseContentType = apiResponse.headers.get('content-type');
  if (responseContentType) {
    responseHeaders.set('content-type', responseContentType);
  }
  for (const setCookie of apiResponse.headers.getSetCookie()) {
    responseHeaders.append('set-cookie', setCookie);
  }

  const body = await apiResponse.arrayBuffer();
  return new NextResponse(body, {
    status: apiResponse.status,
    headers: responseHeaders,
  });
}

export {
  proxy as GET,
  proxy as POST,
  proxy as PATCH,
  proxy as PUT,
  proxy as DELETE,
};
