/**
 * Solo para desarrollo local: en producción el tenant SIEMPRE se resuelve
 * por subdominio real (Documento 6). Pero herramientas de verificación
 * automatizada en este entorno de desarrollo solo pueden alcanzar
 * `localhost` (no subdominios wildcard tipo `*.lvh.me`), así que esto
 * permite simular "estoy en la academia X" navegando a
 * `localhost:PORT/?tenant=X` una vez — la elección queda en una cookie no
 * httpOnly y se reutiliza en la navegación siguiente. Nunca se activa si
 * `NODE_ENV === 'production'`.
 */
export const DEV_TENANT_COOKIE = '__cursonube_dev_tenant';

export function resolveDevTenantOverride(
  queryTenant: string | null,
  cookieTenant: string | undefined,
): string | null {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  return queryTenant || cookieTenant || null;
}
