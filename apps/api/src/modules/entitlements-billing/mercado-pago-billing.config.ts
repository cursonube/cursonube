/**
 * Documento 8, sección 6: Billing propio de Cursonube (Cursonube -> Academia).
 * A diferencia de `mercado-pago.config.ts` del módulo de Enrollment Payments
 * (que usa Client ID/Secret para el OAuth de cada creador), acá se usa el
 * `access_token` de la cuenta de Mercado Pago DE CURSONUBE MISMO — quien
 * cobra la suscripción es Cursonube, no un tercero conectado.
 */
export const CURSONUBE_MP_ACCESS_TOKEN =
  process.env.CURSONUBE_MP_ACCESS_TOKEN ?? '';
export const CURSONUBE_MP_WEBHOOK_SECRET =
  process.env.CURSONUBE_MP_WEBHOOK_SECRET ?? '';

export const MP_PREAPPROVAL_URL = 'https://api.mercadopago.com/preapproval';

/**
 * Documento 8, sección 6, punto 3: "tras agotar reintentos [...] inicia el
 * período de gracia [...] y al vencer sin regularizar, bloquea el panel".
 * El número de días es un placeholder de negocio (mismo criterio que el
 * pricing en seed.ts) — Mercado Pago gestiona sus propios reintentos de
 * cobro antes de que esta cuenta ni siquiera empiece a correr.
 */
export const GRACIA_IMPAGO_DIAS = 7;
