# Cursonube — Sistema Multi-Tenant
### Documento 6 de 16 · Estado: 🟡 En revisión — pendiente de aprobación

---

Este documento profundiza la implementación técnica de lo ya decidido en el Documento 2 (estrategia de datos: shared schema + `tenant_id` + RLS) y el Documento 3 (entidades). No reabre esas decisiones — las lleva a nivel de funcionamiento concreto.

## 1. Resolución de Tenant por request

1. Wildcard DNS (`*.cursonube.com`) apunta a la infraestructura de Cursonube — no hay configuración de DNS por academia nueva, se crean con el mismo registro wildcard ya existente.
2. Cada request llega con header `Host`. Un middleware de Next.js extrae el subdominio (o dominio propio, cuando exista) y resuelve el `Academia.id` correspondiente.
3. Esa resolución se cachea en Redis (clave = hostname, valor = `tenant_id` + datos mínimos de branding) con invalidación activa cuando la academia actualiza su configuración — es el punto de mayor sensibilidad a latencia de todo el sistema (ocurre en el 100% de los requests), por eso no puede depender de una consulta a Postgres en cada visita.
4. Si el hostname no resuelve a ninguna academia activa: página 404 propia de Cursonube (nunca un error genérico de servidor).
5. El `tenant_id` resuelto viaja como `TenantContext` a través de toda la request; todo acceso a datos pasa por el `TenantScopedRepository` (Documento 2, sección 5).

## 2. Aprovisionamiento de un tenant nuevo

Al completar el wizard (Documento 1/4), la creación de la academia es **síncrona** (no requiere una cola de background — es un puñado de inserts, milisegundos): se crea `Academia`, se asigna el plan **Free** por defecto, se crean las páginas fijas (`Pagina` tipo home/cursos/sobre_nosotros/contacto/faq/politicas/login) con su composición de bloques por defecto (Documento 5, sección 4). El usuario llega a una academia ya navegable, nunca a un estado "procesando…".

No existe aprovisionamiento de infraestructura por tenant (ni base de datos, ni servidor, ni certificado individual en el caso del subdominio, que ya está cubierto por el wildcard) — coherente con "no se crearán servidores por cliente" del Product Book.

## 3. Aislamiento de datos (dos barreras)

- **Barrera de aplicación:** el `TenantScopedRepository` (envoltorio sobre Prisma) inyecta automáticamente `WHERE tenant_id = :tenantActual AND deleted_at IS NULL` en toda query — ninguna query de negocio se escribe a mano contra la base sin pasar por acá.
- **Barrera de base de datos:** Postgres Row-Level Security define una policy por tabla de tenant, del estilo `USING (tenant_id = current_setting('app.tenant_id')::uuid)`, seteada al abrir cada conexión/transacción. Si la barrera de aplicación tuviera un bug y omitiera el filtro, la fila de otro tenant sigue siendo invisible a nivel de motor de datos.

Esta doble barrera es la que permite decir con confianza real "los datos de una academia son invisibles para cualquier otra", no solo "deberían serlo si no hay bugs".

## 4. Suspensión de un tenant (implementación de la política ya aprobada en el Documento 4, U1)

El middleware de resolución de tenant, al servir una request hacia el **panel de gestión** (Owner/Admin/Profesor/Editor), chequea `Academia.estado`. Si está `suspendida` por impago: redirige a una pantalla de "Regularizá tu suscripción" en vez de servir el panel. El **sitio público** de la academia y el **panel del alumno** no consultan este chequeo — siguen funcionando exactamente igual, tal como se aprobó.

## 5. Dominio propio (custom domain)

Lo que se soporta **desde el día 1** (bajo costo, evita rediseñar la resolución de tenant más adelante): la columna `Academia.dominio_propio` y la lógica de resolución del paso 1 ya buscan por subdominio **o** por dominio propio verificado, indistintamente.

Lo que **no** se resuelve en este documento: el mecanismo concreto de verificación de propiedad del dominio y la emisión/renovación automática de certificados SSL por dominio de cliente. Esa decisión depende directamente de qué proveedor de hosting se elija (Documento 14) — algunos proveedores (ej. Cloudflare for SaaS, Vercel Domains) lo resuelven de forma gestionada; hacerlo con ACME propio es una alternativa con más esfuerzo operativo. Resolver esto ahora, sin conocer el proveedor de hosting, sería decidir a ciegas — queda explícitamente para el Documento 14, junto con la feature en sí (V1.1, Product Book).

## 6. Migraciones de esquema compartido

Con shared schema, una migración afecta a **todas** las academias a la vez (la ventaja ya identificada en el Documento 2 frente a schema-per-tenant) — pero eso exige disciplina: convención **expand-contract** obligatoria para cualquier cambio de esquema con tenants reales en producción — agregar columnas siempre como nullable u opcionales primero, hacer el backfill, y recién después (en un deploy separado) aplicar constraints estrictos (`NOT NULL`, etc.). Nunca una migración que bloquee la tabla completa con cientos de miles de filas de golpe. El detalle operativo de cómo corre esto en el pipeline de deploy se define en el Documento 14.

## 7. Fair-use básico

Rate limiting básico (por IP) en endpoints públicos sensibles — login, checkout, captura de Leads — se incluye desde el MVP como práctica de seguridad estándar, no como diferenciador de plan. El detalle de umbrales y protección contra abuso se especifica en el Documento 16 (Seguridad).

## 8. Qué no se decide en este documento

- Mecanismo final de verificación/SSL de dominio propio → Documento 14.
- Plan concreto de sharding y sus umbrales → Documento 15.
- Matriz de roles y permisos → Documento 7.

## 9. Decisiones irreversibles o costosas de revertir

| # | Decisión | Por qué es costosa de revertir | Estado |
|---|---|---|---|
| T1 | El subdominio es cambiable únicamente dentro de una ventana corta post-creación (ej. 48hs desde que se completó el wizard); pasada esa ventana queda fijo. | Permitirlo indefinidamente exige invalidación de cache de resolución y manejo de roturas de SEO/links; prohibirlo del todo no deja corregir un error de tipeo inicial. La ventana acota el riesgo a un período sin tráfico real todavía. | ✅ Confirmado. |

---
**Documento 6 (Sistema Multi-Tenant) — sin puntos pendientes.** Si confirmás, lo marco ✅ Aprobado en `docs/README.md` y avanzamos al Documento 7 (Autenticación y Permisos).
