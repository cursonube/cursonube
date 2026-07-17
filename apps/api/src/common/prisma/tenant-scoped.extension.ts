import { Prisma } from '@prisma/client';
import { TenantContextService } from '../tenant-context/tenant-context.service';

/**
 * Modelos con columna `tenantId` (Documento 3, sección 1) — toda operación
 * sobre ellos exige un TenantContext activo. `AuditLog` queda deliberadamente
 * afuera: su `tenantId` es nullable y se consulta cross-tenant desde el
 * Platform Admin (Documento 10), no desde el contexto de una academia.
 *
 * TODO (desarrollo, no scaffolding): cuando se construya el módulo Platform
 * Admin, agregar un mecanismo explícito de bypass auditado (nunca implícito)
 * para las consultas cross-tenant legítimas de staff — hoy cualquier query
 * sobre estos modelos sin TenantContext lanza, sin excepción.
 */
const TENANT_SCOPED_MODELS = new Set([
  'AcademiaUsuario',
  'Alumno',
  'SuscripcionAcademia',
  'Curso',
  'Pagina',
  'Lead',
  'CuentaPagoCreador',
  'Inscripcion',
  'Pago',
  'Certificado',
]);

/** Modelos con soft-delete obligatorio (Documento 3, decisión M1; Documento 9, sección 6). */
const SOFT_DELETE_MODELS = new Set([
  'Academia',
  'Curso',
  'Modulo',
  'Clase',
  'Inscripcion',
  'Pago',
  'Certificado',
  'SuscripcionAcademia',
]);

const READ_AND_MUTATE_BY_WHERE = new Set([
  'findMany',
  'findFirst',
  'findFirstOrThrow',
  'findUnique',
  'findUniqueOrThrow',
  'update',
  'updateMany',
  'delete',
  'deleteMany',
  'count',
  'aggregate',
  'groupBy',
]);

const READ_ONLY_FOR_SOFT_DELETE = new Set([
  'findMany',
  'findFirst',
  'findFirstOrThrow',
  'findUnique',
  'findUniqueOrThrow',
  'count',
  'aggregate',
  'groupBy',
]);

/**
 * El tenantId del contexto siempre gana sobre cualquier valor que el
 * llamador haya puesto en `data` — nunca se confía en un tenantId provisto a
 * mano (podría estar mal por un bug de un caller; el contexto es la única
 * fuente de verdad, Documento 6, sección 3).
 */
function injectTenantIdIntoData(
  data: Record<string, unknown> | Record<string, unknown>[],
  tenantId: string,
) {
  if (Array.isArray(data)) {
    return data.map((row) => ({ ...row, tenantId }));
  }
  return { ...data, tenantId };
}

/**
 * Extensión de Prisma que aplica automáticamente el filtro de tenant y de
 * soft-delete — Documento 2, sección 5 / Documento 6, sección 3 (primera de
 * las dos barreras de aislamiento; la segunda es Row-Level Security de
 * Postgres, todavía no implementada — ver Documento 16).
 */
export function createTenantScopedExtension(
  tenantContext: TenantContextService,
) {
  return Prisma.defineExtension((client) =>
    client.$extends({
      name: 'tenant-scoping',
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            if (!model) {
              return query(args);
            }

            const isTenantScoped = TENANT_SCOPED_MODELS.has(model);
            const isSoftDelete = SOFT_DELETE_MODELS.has(model);
            const queryArgs = args as {
              where?: Record<string, unknown>;
              data?: Record<string, unknown> | Record<string, unknown>[];
            };

            if (isTenantScoped) {
              const tenantId = tenantContext.requireTenantId();

              if (READ_AND_MUTATE_BY_WHERE.has(operation)) {
                queryArgs.where = { ...(queryArgs.where ?? {}), tenantId };
              }

              if (
                (operation === 'create' || operation === 'createMany') &&
                queryArgs.data
              ) {
                queryArgs.data = injectTenantIdIntoData(
                  queryArgs.data,
                  tenantId,
                );
              }
            }

            if (isSoftDelete && READ_ONLY_FOR_SOFT_DELETE.has(operation)) {
              queryArgs.where = { ...(queryArgs.where ?? {}), deletedAt: null };
            }

            return query(queryArgs as typeof args);
          },
        },
      },
    }),
  );
}
