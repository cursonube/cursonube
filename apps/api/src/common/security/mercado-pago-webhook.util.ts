import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Documento 8, sección 4: todo webhook de Mercado Pago se verifica antes de
 * procesarse. Formato real: header `x-signature: ts=...,v1=...` +
 * `x-request-id`, HMAC-SHA256 sobre el manifest
 * `id:{data.id};request-id:{x-request-id};ts:{ts};` con el secreto
 * configurado en el panel de la aplicación de Mercado Pago que corresponda
 * (Cursonube tiene dos aplicaciones de MP distintas — la propia para
 * Billing y la de OAuth para Enrollment Payments — cada una con su propio
 * secreto; por eso esta función recibe el secreto como parámetro en vez de
 * leerlo de una env var fija).
 *
 * Compartida entre `SuscripcionAcademiaService` (Documento 8, sección 6) y
 * el checkout de Enrollment Payments (Documento 8, secciones 2-4) — misma
 * lógica de verificación, dos secretos distintos.
 */
export function verifyMercadoPagoWebhookSignature(
  secret: string,
  dataId: string,
  xSignature: string | undefined,
  xRequestId: string | undefined,
): boolean {
  if (!xSignature || !xRequestId || !secret) {
    return false;
  }

  const partes = Object.fromEntries(
    xSignature.split(',').map((par) => {
      const [k, v] = par.split('=');
      return [k?.trim(), v?.trim()];
    }),
  );
  const ts = partes.ts;
  const v1 = partes.v1;
  if (!ts || !v1) {
    return false;
  }

  const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId};ts:${ts};`;
  const firmaEsperada = createHmac('sha256', secret)
    .update(manifest)
    .digest('hex');

  const bufferEsperado = Buffer.from(firmaEsperada, 'utf8');
  const bufferRecibido = Buffer.from(v1, 'utf8');
  if (bufferEsperado.length !== bufferRecibido.length) {
    return false;
  }
  return timingSafeEqual(bufferEsperado, bufferRecibido);
}
