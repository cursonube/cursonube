import { uuidv7 } from 'uuidv7';

/**
 * Genera el identificador usado como PK en todas las tablas de tenant.
 * UUID v7 (Documento 2, decisión A3) — ordenable por tiempo de creación,
 * a diferencia de UUID v4, sin exponer volumen de datos como un autoincrement.
 * Prisma no genera UUIDv7 nativamente, por eso se asigna acá antes de cada insert.
 */
export function generateId(): string {
  return uuidv7();
}
