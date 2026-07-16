# Cursonube — Arquitectura
### Documento 2 de 16 · Estado: 🟡 En revisión — pendiente de aprobación

---

## 1. Principios rectores (heredados del Product Book)

- Monolito modular. Sin microservicios, sin Kubernetes.
- Una sola aplicación para todos los tenants. Sin instalación ni infraestructura por cliente.
- Clean Architecture / SOLID / DDD **cuando aporte valor real**, no como dogma.
- Prioridad de decisión ante cualquier duda: simplicidad → escalabilidad → mantenibilidad → costo. En ese orden, salvo que una decisión barata hoy sea carísima de revertir mañana (ver sección 8).

## 2. Estilo arquitectónico: Monolito Modular

Una única base de código, desplegada como un número pequeño y fijo de servicios (no uno por tenant, no uno por feature). Internamente organizada en **módulos con fronteras estrictas** que se comportan como Clean Architecture / bounded contexts de DDD:

- Cada módulo expone una interfaz pública (servicios de aplicación) y **prohíbe** que otro módulo acceda directamente a sus tablas o repositorios.
- La comunicación entre módulos es en-proceso: llamadas directas a servicios de aplicación para lo síncrono, y **eventos de dominio in-process** (no un broker externo) para lo que debe desacoplarse — ej. `CourseCompletedEvent` disparado por el módulo de Cursos, escuchado por el módulo de Certificados para generar el PDF, sin que Cursos sepa que Certificados existe.
- Esto da la disciplina de un sistema distribuido (bajo acoplamiento, contratos claros) sin pagar el costo operativo de red, versionado de contratos entre servicios, ni transacciones distribuidas. Si en el futuro algún módulo necesita escalar de forma independiente, ya tiene fronteras limpias para extraerse — pero **no se extrae nada hasta que haya una razón medida, no anticipada**.

### 2.1 Módulos del sistema (bounded contexts)

| Módulo | Responsabilidad |
|---|---|
| **Tenancy** | Academias, subdominios, (futuro) dominios propios, configuración de marca/plantilla. |
| **Identity & Access** | Usuarios, roles, permisos, sesiones. Tres audiencias distintas: staff de Cursonube, usuarios de una academia (Owner/Admin/Profesor/Editor), alumnos. |
| **Entitlements & Billing interno** | Planes de Cursonube, límites por plan, suscripción de la academia a Cursonube (Mercado Pago Suscripciones). |
| **Course Catalog** | Cursos, módulos, clases, contenido (video/texto/PDF/archivos/links). |
| **Content Editor** | Sistema de bloques, páginas, plantillas, landing autogenerada de cursos. |
| **Enrollment & Payments** | Inscripciones, checkout, pagos alumno→creador (Mercado Pago), guest checkout. |
| **Certificates** | Generación de PDF al completar curso, (futuro) verificación QR. |
| **Notifications** | Emails transaccionales: bienvenida, certificado emitido, confirmación de compra. |
| **Platform Admin** | Panel interno de Cursonube staff: academias, usuarios, planes, suscripciones, estadísticas. |

Cada módulo se diseña en capas internas (dominio → aplicación → infraestructura → presentación), de forma que la lógica de negocio (dominio) no dependa de frameworks, ORM ni HTTP — eso vive en infraestructura/presentación. Esta separación se detalla módulo por módulo en los documentos 6 a 11.

## 3. Stack tecnológico propuesto

| Capa | Elección | Por qué |
|---|---|---|
| Lenguaje | **TypeScript** en todo el stack | Un solo lenguaje en backend y frontend: tipos compartidos entre API y UI, un solo pool de contratación, ecosistema enorme. Cumple "fuertemente tipado" sin fricción. |
| Backend | **NestJS** | Es el framework Node/TS diseñado explícitamente alrededor de Clean Architecture/DDD/SOLID: módulos con fronteras, inyección de dependencias, guards (permisos/entitlements), interceptors. Da gratis la estructura que de otro modo habría que inventar a mano para un monolito modular de este tamaño. |
| Frontend | **Next.js (App Router)** | SSR/SSG nativo — crítico porque los sitios públicos de cada academia son contenido que **necesita indexarse en Google** (SEO real), no una SPA detrás de login. Middleware nativo para resolver el tenant por el header `Host` en cada request. |
| Base de datos | **PostgreSQL** | Único motor que da integridad referencial transaccional seria + Row-Level Security nativo (clave para aislar tenants a nivel de motor de datos, no solo de aplicación) + soporte JSON para contenido flexible (bloques del editor). No hay alternativa razonable dado el perfil de datos (cursos, alumnos, pagos, certificados son intrínsecamente relacionales). |
| ORM | **Prisma** | Tipado end-to-end entre esquema y código, migraciones declarativas, buena experiencia de desarrollo. Se envuelve con una capa propia (`TenantScopedRepository`) que inyecta el filtro de tenant automáticamente, para que ninguna query pueda "olvidarse" de filtrar por academia. |
| Cache y jobs en background | **Redis + BullMQ** | Cache de resolución de tenant (evita pegarle a Postgres en cada request) y colas para trabajo asíncrono: generación de certificados, envío de emails, procesamiento de webhooks de Mercado Pago. Un broker de mensajería pesado (Kafka/RabbitMQ) sería sobreingeniería en esta etapa — Redis alcanza sobradamente para el volumen esperado. |
| Almacenamiento de archivos | **Object storage S3-compatible** (recomendado: Cloudflare R2) | Logos, imágenes de landing, PDFs de certificados. R2 no cobra egress, lo cual importa cuando el volumen de tenants crece (cada descarga de certificado o imagen de landing no debería generar costo variable de salida). No se usa para video — decisión ya tomada en el Product Book (sin hosting propio de video en MVP). |
| Autenticación | Implementación propia sobre sesiones + JWT de corta duración (detalle en Documento 7) | Se evalúa explícitamente **no** delegar en un IDaaS externo (Auth0, Clerk, etc.): estos servicios cobran por usuario activo mensual, y a la escala objetivo (cientos de miles de academias, con alumnos potencialmente en millones) ese costo variable se vuelve prohibitivo y crece exactamente cuando más éxito tiene el negocio. Se documenta el detalle de sesiones/roles en el Documento 7 (Autenticación y Permisos). |
| Hosting / despliegue | Se define en el **Documento 14 (Deploy)** | Aquí solo se fija el requisito no negociable: contenedores estándar (Docker), sin Kubernetes, en una plataforma gestionada. La elección concreta de proveedor se justifica en su propio documento con criterios de costo y operación. |

## 4. Estrategia de Multi-Tenancy a nivel de datos

**Esta es la decisión individual más importante de todo el proyecto.** Define si el sistema puede llegar a "cientos de miles de academias" o si hay que reescribirlo a mitad de camino.

### 4.1 Opciones evaluadas

| Estrategia | Descripción | Veredicto a esta escala |
|---|---|---|
| **Shared database, shared schema, columna `tenant_id`** | Una sola base de datos (o un número pequeño de shards más adelante), todas las tablas de datos de tenant tienen una columna `tenant_id` indexada. Aislamiento reforzado con Postgres Row-Level Security como defensa adicional a la de aplicación. | ✅ **Es el estándar de la industria para este volumen** (es, con matices, el modelo de Salesforce, Shopify a gran escala, Notion, Linear). Migraciones de esquema se aplican una sola vez para todos los tenants. Costo de infraestructura no crece linealmente con la cantidad de academias (la mayoría son chicas). |
| **Schema-per-tenant** (un schema de Postgres por academia, misma base) | Mejor aislamiento lógico que la opción anterior, exportar/backupear un tenant es trivial. | ❌ **No escala al objetivo declarado.** Postgres empieza a degradar con miles de schemas en una misma base (overhead de catálogo, migraciones que hay que correr una vez por schema — con cientos de miles de tenants, un solo deploy implicaría cientos de miles de operaciones de migración). Es una opción razonable para una escala de "cientos o pocos miles de tenants", no para "cientos de miles". |
| **Database-per-tenant** | Aislamiento máximo. | ❌ **Inviable operativamente** a este volumen: no se pueden aprovisionar, monitorear, respaldar ni versionar cientos de miles de bases de datos de forma económica. Además reintroduce exactamente lo que el brief pide evitar ("no se crearán servidores por cliente" aplica en espíritu también a bases de datos). |

### 4.2 Recomendación

**Shared database, shared schema, `tenant_id` en cada tabla de datos de tenant, reforzado con Row-Level Security de Postgres.** Camino de evolución ya previsto (no se construye ahora, pero la decisión de hoy no lo bloquea): cuando una sola instancia de Postgres deje de alcanzar (medido, no anticipado), se particiona por hash de `tenant_id` en múltiples instancias — el `tenant_id` en cada fila es precisamente lo que hace posible ese sharding futuro sin rediseñar el modelo de datos.

**Por qué esto es una decisión "irreversible" y no un detalle técnico menor:** el Documento 3 (Modelo de Datos) completo se construye asumiendo esta estrategia (todas las tablas con `tenant_id`, todas las queries filtradas por tenant). Cambiar de estrategia después de tener tenants reales en producción implica migrar cada tabla y reescribir cada query — el peor momento posible para hacerlo.

## 5. Resolución de Tenant por request

1. El request llega con header `Host` (ej. `micurso.cursonube.com`, o a futuro un dominio propio verificado).
2. Middleware de Next.js resuelve el subdominio (o dominio propio) contra una tabla `Tenancy.Academia`, con **cache en Redis** para no golpear Postgres en cada request (la resolución de tenant ocurre en el 100% de los requests, es el punto de mayor sensibilidad a latencia de todo el sistema).
3. Se inyecta un `TenantContext` (request-scoped) que viaja a través de toda la capa de aplicación.
4. Todo acceso a datos pasa por el `TenantScopedRepository`, que aplica automáticamente el filtro `tenant_id` — nunca se escribe una query "a mano" que pueda olvidarlo.
5. Postgres Row-Level Security actúa como segunda barrera: aunque una query de aplicación tuviera un bug y olvidara el filtro, la base de datos igual rechaza filas de otro tenant.

Esta doble barrera (aplicación + RLS) es deliberada: en un sistema donde una fuga de datos entre academias es catastrófica para la confianza del producto, no alcanza con confiar solo en disciplina de código.

## 6. Estrategia de identificadores (IDs)

Todas las tablas de datos de tenant usan **UUID (v7) o ULID** como clave primaria, no autoincrement entero.

- **Por qué no autoincrement:** expone el volumen de datos (`/cursos/1847` revela cuántos cursos existen en todo el sistema), y complica el sharding futuro (los IDs autoincrement colisionan entre shards; UUID/ULID no).
- **Por qué UUIDv7/ULID y no UUIDv4 clásico:** UUIDv4 es aleatorio puro, lo cual degrada el rendimiento de índices B-tree en Postgres a gran escala (inserciones en posiciones aleatorias del índice). UUIDv7/ULID son ordenables por tiempo de creación, dando el mismo espacio de nombres global sin el costo de rendimiento.

## 7. Qué NO se decide en este documento

Para mantener el foco, estos temas se tratan en su documento dedicado y no se resuelven acá:

- Modelo de datos completo (tablas, relaciones) → Documento 3.
- Matriz de roles y permisos → Documento 7.
- Detalle de integración de pagos y billing → Documento 8.
- Contratos de API → Documento 13.
- Proveedor de hosting y topología de despliegue → Documento 14.
- Plan de sharding/particionamiento concreto y umbrales que lo disparan → Documento 15.
- Modelo de amenazas y controles de seguridad → Documento 16.

## 8. Decisiones irreversibles o costosas de revertir

| # | Decisión | Por qué es costosa de revertir | Estado |
|---|---|---|---|
| A1 | **Estrategia de datos multi-tenant: shared schema + `tenant_id` + RLS** (sección 4). | Todo el Modelo de Datos (Documento 3) y cada query del sistema se construyen asumiendo esto. Cambiarlo con tenants reales en producción implica migrar cada tabla. | ✅ Confirmado. |
| A2 | **NestJS (API) separado de Next.js (frontend), dos servicios desplegables.** | Elegir esta separación y necesitar volver a un solo runtime (o viceversa) implica extraer/fusionar toda la capa de lógica de negocio y rediseñar cómo viajan sesión/auth entre ambos. | ✅ Confirmado. |
| A3 | **UUID v7/ULID como clave primaria en todas las tablas de tenant**, no autoincrement. | Cambiar el tipo de clave primaria después de tener datos reales es una migración de esquema riesgosa sobre todas las tablas y sus relaciones (foreign keys incluidas). | ✅ Confirmado. |
| A4 | PostgreSQL como motor de base de datos. | Migrar de motor de base de datos con el sistema en producción es de los proyectos de migración más costosos que existen en ingeniería. | ✅ Sin alternativa razonable dado el perfil de datos (relacional + RLS + JSON). Se da por aceptado salvo objeción tuya. |
| A5 | Auth propia (no IDaaS externo tipo Auth0/Clerk). | Migrar de proveedor de identidad con usuarios reales implica reautenticar a toda la base de alumnos y creadores. | ✅ Se da por aceptado por el argumento de costo a escala (ver sección 3), salvo objeción tuya. |

---
**Documento 2 (Arquitectura) — sin puntos pendientes.** Si confirmás, lo marco ✅ Aprobado en `docs/README.md` y avanzamos al Documento 3 (Modelo de Datos).
