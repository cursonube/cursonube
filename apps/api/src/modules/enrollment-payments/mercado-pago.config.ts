/**
 * Documento 8, sección 2: OAuth de Mercado Pago para que el creador conecte
 * su propia cuenta — Cursonube nunca administra el dinero (Documento 1).
 */
export const MP_CLIENT_ID = process.env.MP_CLIENT_ID ?? '';
export const MP_CLIENT_SECRET = process.env.MP_CLIENT_SECRET ?? '';
export const MP_REDIRECT_URI = process.env.MP_REDIRECT_URI ?? '';

export const MP_AUTHORIZATION_URL =
  'https://auth.mercadopago.com/authorization';
export const MP_TOKEN_URL = 'https://api.mercadopago.com/oauth/token';
export const MP_PREFERENCES_URL =
  'https://api.mercadopago.com/checkout/preferences';
export const MP_PAYMENTS_URL = 'https://api.mercadopago.com/v1/payments';

/**
 * Documento 8, sección 4 — secreto de firma de webhooks de ESTA aplicación
 * de Mercado Pago (la de OAuth, sección 2). Distinto de
 * `CURSONUBE_MP_WEBHOOK_SECRET` (entitlements-billing): son dos aplicaciones
 * de Mercado Pago distintas, cada una con su propio secreto configurado en
 * su propio panel de desarrollador.
 */
export const MP_CHECKOUT_WEBHOOK_SECRET =
  process.env.MP_CHECKOUT_WEBHOOK_SECRET ?? '';
