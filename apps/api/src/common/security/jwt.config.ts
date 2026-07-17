/**
 * Documento 7, sección 1: JWT de corta duración (access) + refresh token de
 * sesión más larga, ambos en cookies httpOnly. Secretos separados para
 * access/refresh (Documento 16): un access token robado no alcanza para
 * emitir refresh tokens nuevos.
 *
 * En producción estos secretos viven en el secrets manager del proveedor de
 * hosting (Documento 16, sección 6) — nunca hardcodeados ni en el repo. Los
 * defaults de acá son solo para desarrollo local.
 */
export const JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ?? 'dev-only-access-secret-change-me';
export const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? 'dev-only-refresh-secret-change-me';

export const JWT_ACCESS_EXPIRES_IN = '15m';
export const JWT_REFRESH_EXPIRES_IN = '30d';

export const ACCESS_TOKEN_COOKIE = 'cursonube_access_token';
export const REFRESH_TOKEN_COOKIE = 'cursonube_refresh_token';

/** Audiencias de autenticación — Documento 7, sección 2. */
export type SessionAudience = 'academia-usuario' | 'alumno' | 'staff';

export interface SessionTokenPayload {
  sub: string; // id del AcademiaUsuario / Alumno / CursonubeStaff
  aud: SessionAudience;
  tenantId?: string; // ausente para staff (Documento 3: CursonubeStaff no es tenant-scoped)
  rol: string;
}
