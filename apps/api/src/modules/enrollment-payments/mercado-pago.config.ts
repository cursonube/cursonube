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
