# Cursonube — Documentación Técnica y de Producto

Este directorio contiene los 16 documentos de diseño de producto y arquitectura de Cursonube, aprobados de forma secuencial antes de iniciar desarrollo. No se avanza al siguiente documento hasta que el anterior esté aprobado.

## Estado de documentos

| # | Documento | Estado |
|---|-----------|--------|
| 1 | [Product Book](01-product-book.md) | ✅ Aprobado |
| 2 | [Arquitectura](02-arquitectura.md) | ✅ Aprobado |
| 3 | [Modelo de Datos](03-modelo-de-datos.md) | ✅ Aprobado |
| 4 | [UX Flows](04-ux-flows.md) | ✅ Aprobado |
| 5 | [Diseño del Editor por Bloques](05-editor-de-bloques.md) | ✅ Aprobado |
| 6 | [Sistema Multi-Tenant](06-sistema-multi-tenant.md) | ✅ Aprobado |
| 7 | [Autenticación y Permisos](07-autenticacion-y-permisos.md) | ✅ Aprobado |
| 8 | [Sistema de Pagos](08-sistema-de-pagos.md) | ✅ Aprobado |
| 9 | [Sistema de Cursos](09-sistema-de-cursos.md) | ✅ Aprobado |
| 10 | [Panel del Creador](10-panel-del-creador.md) | ✅ Aprobado |
| 11 | [Panel del Alumno](11-panel-del-alumno.md) | ✅ Aprobado |
| 12 | [Roadmap](12-roadmap.md) | ✅ Aprobado |
| 13 | [API Design](13-api-design.md) | ✅ Aprobado |
| 14 | [Deploy](14-deploy.md) | ✅ Aprobado |
| 15 | [Escalabilidad](15-escalabilidad.md) | ✅ Aprobado |
| 16 | [Seguridad](16-seguridad.md) | ✅ Aprobado |
| 17 | [Sitio de Marketing (adenda)](17-sitio-de-marketing.md) | ✅ Aprobado |
| 18 | [Observabilidad, Email y Moderación (adenda)](18-observabilidad-email-moderacion.md) | ✅ Aprobado |

## Acuerdo de trabajo

Antes de dar por aprobado cada documento, se identifican explícitamente las **decisiones irreversibles o costosas de revertir** que introduce (sección dedicada dentro de cada documento). Si alguna aparece, el proceso se detiene y se valida con el usuario antes de seguir — nunca se asume. El objetivo no es optimizar solo para el MVP: se busca equilibrio entre simplicidad inicial y una arquitectura que evolucione sin reescribir sus fundamentos.

## Decisiones fundacionales ya tomadas (no reabrir sin justificación fuerte)

- **No somos marketplace.** Cada academia es independiente, sin descubrimiento cruzado entre academias.
- **Multi-tenant por subdominio** (`academia.cursonube.com`), single app, single infra, wildcard DNS.
- **Modelo de negocio de Cursonube = suscripción a la academia**, nunca comisión sobre ventas (Cursonube no administra dinero de terceros).
- **Alumno = identidad aislada por academia** (no hay cuenta global de alumno cross-tenant).
- **Pagos alumno→creador:** Mercado Pago único gateway en MVP. Stripe en V1.1. Arquitectura con interfaz de Payment Provider desde el día 1.
- **Billing propio de Cursonube a las academias:** Mercado Pago Suscripciones en MVP, mercado Argentina/LatAm. Arquitectura con interfaz de Billing Provider desacoplada, para incorporar Stripe Billing u otros sin tocar el resto del sistema.
- **Venta del creador a sus alumnos en MVP:** solo pago único + gratis. Suscripciones/membresías recurrentes quedan para V1.1.
- **Video en MVP:** sin hosting propio. YouTube no listado o enlace compatible. Arquitectura lista para incorporar Bunny Stream / Cloudflare Stream / Mux sin romper el sistema.
- **Sin microservicios, sin Kubernetes.** Monolito modular.
- **V1 excluye explícitamente:** IA, Marketplace, App móvil, Comunidad, Chat, Foros, Afiliados, Gamificación, Drip Content, Clases en vivo.
- **Planes de Cursonube:** 4 niveles (Free, Starter, Pro, Business) definidos por estructura/límites, sin precios todavía. Gatean solo: profesores/editores, alumnos, cursos, dominio propio, marca visible. Plantillas (las 5) y editor de bloques (los 12 tipos) están disponibles por igual en todos los planes, incluido Free — no son diferenciadores de plan.
- **Entitlements data-driven desde el día 1:** planes y límites viven como datos configurables, nunca como condicionales hardcodeados por feature.
- **Panel interno de administración:** MVP, minimalista — academias, usuarios, planes, suscripciones, estados, estadísticas básicas.
- **Video en MVP:** únicamente YouTube No Listado, detrás de un adaptador `VideoProvider` desacoplado del dominio de Cursos.
- **Idioma:** español único en MVP, con strings de UI externalizados a un sistema de claves de i18n desde el primer commit.
- **Compra sin registro previo (guest checkout):** click en Comprar → nombre + email → pago con Mercado Pago → cuenta creada automáticamente → el alumno define su contraseña en la misma sesión (sin depender de un email para activarse) → queda logueado y accede al curso → recibe email de bienvenida informativo.
- **Stack:** TypeScript en todo el stack. Backend NestJS (API) separado de frontend Next.js (dos servicios, no microservicios). PostgreSQL + Prisma. Redis + BullMQ para cache/jobs. Object storage S3-compatible (Cloudflare R2) para imágenes/PDFs (no video). Auth propia, sin IDaaS externo.
- **Multi-tenancy de datos:** shared database, shared schema, columna `tenant_id` en cada tabla + Postgres Row-Level Security como segunda barrera. Camino de sharding futuro por hash de `tenant_id`, no antes de que se necesite.
- **Claves primarias:** UUID v7 / ULID en todas las tablas de tenant, nunca autoincrement.
- **Modelo de datos:** Alumno y AcademiaUsuario son tablas separadas (audiencias distintas). Bloque.propiedades es JSONB (catálogo de bloques cerrado, validado a nivel de aplicación). Dinero siempre en centavos + ISO 4217, nunca float. Soft-delete obligatorio (`deleted_at`) en Academia, Curso (con inscripciones), Inscripcion, Pago, Certificado y SuscripcionAcademia — nunca borrado físico de registros académicos/financieros. Certificado.codigo_verificacion se genera desde el MVP aunque la verificación por QR sea V1.1.
- **Impago de la academia a Cursonube:** tras período de gracia, se bloquea solo el panel de gestión — el sitio público y el acceso de alumnos ya inscriptos sigue funcionando.
- **Downgrade de plan con exceso de uso:** se permite el cambio, los recursos existentes no se tocan, pero se bloquean altas nuevas hasta volver a estar dentro del límite.
- **Guest checkout:** sin carrito, un curso = un checkout. Si el email ya tiene cuenta con contraseña en esa academia, se exige login antes de continuar (no se adjunta la compra sin autenticar).
- **Editor de bloques:** autosave como borrador + botón explícito "Publicar cambios" para pasar a producción. Catálogo cerrado de 12 tipos, mismo componente de render en las 5 plantillas (parametrizado por design tokens). Ningún bloque es obligatorio ni no-removible. Schema de propiedades tolerante a campos faltantes (nunca migra contenido existente al evolucionar un bloque).
- **Leads (Newsletter/Contacto):** se guardan en una entidad `Lead` propia por tenant + email de notificación al Owner. Sin integración con proveedores externos de email marketing en MVP.
- **Subdominio:** cambiable solo dentro de una ventana corta post-creación (ej. 48hs); pasada esa ventana queda fijo para siempre.
- **Dominio propio (custom domain):** el modelo de datos y la resolución de tenant ya lo soportan desde el día 1; el mecanismo de verificación/SSL se decide en el Documento 14 (Deploy), una vez elegido el proveedor de hosting.
- **Migraciones con shared schema:** convención expand-contract obligatoria (columnas nuevas siempre nullable primero, backfill, luego constraint) — nunca una migración bloqueante sobre toda la tabla de una vez.
- **Sesión:** cookie httpOnly scoped al hostname exacto (no a `.cursonube.com`), JWT corto + refresh token. Panel de gestión del creador vive bajo el mismo subdominio (`/admin`), no en un dominio centralizado.
- **Una cuenta de creador = una academia** (mismo patrón que Alumno), sin selector multi-academia en el MVP.
- **Roles:** Owner (todo, incluida facturación), Administrador (todo excepto facturación y eliminar la academia), Profesor (cursos propios), Editor (solo deja borradores, nunca publica). Matriz vía guards declarativos contra tabla Rol→Permiso centralizada, nunca condicionales dispersos.
- **2FA obligatorio para Staff de Cursonube** desde el MVP (no para creadores/alumnos todavía).
- **Pagos alumno→creador:** OAuth de Mercado Pago, sin mecanismo de `marketplace_fee` habilitado (Cursonube no tiene ni la capacidad técnica de tomar comisión). Webhook (nunca el redirect del browser) es la única fuente de verdad. Curso gratuito no genera registro `Pago`. Reembolsos: fuera de alcance en MVP tener botón propio — solo se escucha el webhook y se revoca el acceso automáticamente.
- **Billing Cursonube→Academia:** Mercado Pago Suscripciones (`preapproval`), dunning gestionado por reintentos de Mercado Pago + webhook propio para iniciar/terminar el período de gracia ya definido (Documento 4, U1).
- **Pendiente operativo (no bloqueante):** validar con contador/gestoría si Mercado Pago Suscripciones cubre la facturación electrónica AFIP del cobro a academias, o si hace falta una integración adicional.
- **Cursos:** requiere al menos 1 clase para publicar. Despublicar nunca revoca acceso de alumnos ya inscriptos (mismo principio que impago/certificados). Certificado ya emitido es válido para siempre, sin importar contenido nuevo agregado después. Progreso se calcula sobre clases activas actuales; no hay clases "opcionales". Coinstructores de un curso tienen todos el mismo nivel de permisos.
- **Panel del Creador:** navegación en 8 secciones (Inicio, Cursos, Sitio, Alumnos, Contactos, Equipo, Plan y Facturación, Configuración). Sin centro de notificaciones in-app en MVP — solo email + feed de "Actividad reciente" en el dashboard. Panel web responsive (no es la app móvil excluida de V1).
- **Panel del Alumno:** específico de una academia (sin vista cross-academia). Curso con acceso revocado se muestra con motivo, no desaparece. Curso gratis pasado a pago después no afecta a quien ya se inscribió gratis. Sin página pública de verificación de certificado todavía (V1.1).
- **Lanzamiento:** registro público abierto desde el día 1, sin beta cerrada ni lista de espera — el QA pre-lanzamiento recae 100% en el equipo interno, sin un grupo piloto externo que absorba los primeros bugs.
- **Criterios de fase (V1.1→V2→V3):** cualitativos por ahora ("cuando factura", "con base sólida de clientes"); los umbrales numéricos concretos se fijan más adelante con datos reales.
- **API:** REST + OpenAPI entre NestJS y Next.js (se descartan tRPC y GraphQL). Versionado `/api/v1/` desde el primer commit. Paginación cursor-based. API interna en MVP, sin producto de API pública para terceros todavía.
- **Hosting:** Next.js en Vercel (resuelve wildcard DNS + dominio propio/SSL nativamente). Backend NestJS (API + worker), PostgreSQL y Redis en Railway. Staging obligatorio antes de producción, dado el lanzamiento público sin beta cerrada (Documento 12).
- **Escalabilidad:** sharding futuro por hash consistente de tenant_id, disparado por umbrales técnicos medibles (CPU >70% sostenido, p95 >200ms, o límite de storage) — no antes. Sin réplicas de lectura ni multi-región en MVP. Los planes de Cursonube nunca gatean rendimiento/infraestructura, solo escala de negocio.
- **Seguridad:** passwords con Argon2/bcrypt, access_token de Mercado Pago cifrado con AES-256-GCM (clave rotable en secrets manager). Rate limiting concreto por endpoint sensible. Sanitización estricta del bloque Texto (whitelist de tags). Validación de links externos restringida a whitelist de dominios (anti-SSRF). RPO 24hs / RTO de pocas horas. Derecho al olvido resuelto vía anonimización (no borrado físico), preservando registros transaccionales sin vínculo a datos personales reales. Recomendación pendiente de aceptar: revisión de seguridad antes de abrir el registro público (dado el lanzamiento sin beta).
- **Sitio de marketing de Cursonube (cursonube.com):** mismo proyecto Next.js, caso especial de dominio raíz en el middleware de tenant (extiende Documento 6). Registro (Paso 0 del wizard) vive ahí, no en un subdominio. Sin blog/SEO en el MVP. Términos de Servicio y Política de Privacidad de Cursonube (distintos de las "Políticas" de cada academia) pendientes de redacción legal antes del lanzamiento — mismo tipo de nota no bloqueante que la de facturación electrónica (Documento 8).
- **Observabilidad:** Sentry (errores) + logs de Railway (sin agregador dedicado todavía) + uptime monitoring externo sobre un endpoint `/health`.
- **Email transaccional:** Resend, detrás de una interfaz `EmailProvider` propia (mismo patrón que Video/Payment/Billing Provider).
- **Moderación de contenido:** reactiva, no proactiva — ToS que prohíben contenido ilegal/fraudulento + mecanismo de "Reportar" que alimenta el Panel Admin (que ya puede suspender academias).

## Los 16 documentos + 2 adendas están completos y aprobados. El diseño de producto y arquitectura de Cursonube queda cerrado — el proyecto está listo para pasar a la etapa de desarrollo.
