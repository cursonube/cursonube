/**
 * Subdominios reservados — Documento 4, Flujo 1. Debe mantenerse en sync
 * manualmente con la misma lista en apps/web/src/middleware.ts (duplicar acá
 * es más simple que un paquete compartido para una sola constante de 6
 * palabras; se reconsidera si la superficie compartida entre apps/api y
 * apps/web crece más allá de esto).
 */
export const RESERVED_SUBDOMAINS = new Set([
  'www',
  'admin',
  'app',
  'api',
  'mail',
  'cursonube',
]);
