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

/**
 * Token de un solo propósito para el guest-checkout (Documento 1, D6): no es
 * una sesión real todavía (el alumno no definió contraseña), solo autoriza
 * el paso siguiente ("creá tu contraseña"). Nunca se acepta en un endpoint
 * que espere un SessionTokenPayload — tiene su propia forma (`purpose`) para
 * que no puedan confundirse aunque compartan secreto de firma.
 */
export const SET_PASSWORD_TOKEN_COOKIE = 'cursonube_set_password_token';
export const SET_PASSWORD_TOKEN_EXPIRES_IN = '30m';

export interface SetPasswordTokenPayload {
  sub: string; // id del Alumno
  tenantId: string;
  purpose: 'set-password';
}

/**
 * Documento 7, sección 6: 2FA obligatorio para CursonubeStaff desde el MVP.
 * Login en dos pasos — credenciales primero, código TOTP después — este
 * token de corta duración correlaciona ambos pasos sin tener que reenviar
 * la contraseña en el segundo (mismo patrón que `SetPasswordTokenPayload`).
 */
export const STAFF_2FA_PENDING_TOKEN_COOKIE = 'cursonube_staff_2fa_pending';
export const STAFF_2FA_PENDING_TOKEN_EXPIRES_IN = '5m';

export interface Staff2faPendingTokenPayload {
  sub: string; // id del CursonubeStaff
  purpose: 'staff-2fa-pending';
}
