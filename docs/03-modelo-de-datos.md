# Cursonube — Modelo de Datos
### Documento 3 de 16 · Estado: 🟡 En revisión — pendiente de aprobación

---

## 1. Convenciones generales

Estas reglas aplican a **todas** las entidades de este documento salvo que se indique lo contrario:

- **Multi-tenancy:** toda tabla que contiene datos de una academia tiene una columna `tenant_id` (FK a `Academia`), indexada, con Row-Level Security activa (Documento 2, decisión A1). Las tablas que son catálogos globales de la plataforma (`Plan`, `Plantilla`, `CursonubeStaff`) **no** llevan `tenant_id`.
- **Claves primarias:** UUID v7 en todas las tablas (Documento 2, decisión A3).
- **Timestamps:** toda entidad tiene `created_at` y `updated_at`. Las entidades transaccionales/académicas (ver sección 7) además tienen `deleted_at` para soft-delete.
- **Dinero:** todo importe se almacena como **entero en la unidad mínima de la moneda** (ej. centavos), nunca como float — evita errores de redondeo. Se acompaña siempre de un código de moneda ISO 4217 (`ARS`, `MXN`, `USD`, etc.), determinado por la cuenta de Mercado Pago que el creador conectó — Cursonube no convierte ni administra tipos de cambio.
- **Slugs:** el subdominio de una `Academia` es único **globalmente** (es un hostname real de DNS). Los slugs de `Curso` y `Pagina` son únicos **por tenant** (dos academias distintas pueden tener ambas `/cursos/marketing-digital` sin conflicto).
- **Precio congelado en el momento de compra:** `Pago` guarda el monto efectivamente cobrado, no una referencia al precio actual de `Curso` — si el creador cambia el precio después, las compras ya realizadas no se alteran.

## 2. Entidades por módulo

### 2.1 Tenancy

**Academia** (tenant raíz del sistema — todas las demás entidades de tenant cuelgan de esta)
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| subdominio | string, unique global | `micurso` → `micurso.cursonube.com` |
| dominio_propio | string, unique global, nullable | V1.1 |
| nombre | string | Nombre de la academia |
| plantilla_id | FK → Plantilla | |
| logo_url | string, nullable | |
| color_primario / color_secundario | string (hex) | |
| imagen_principal_url | string, nullable | |
| plan_id | FK → Plan | Ver 2.3 |
| estado | enum: activa / suspendida / cancelada | Gestionado desde Platform Admin |
| onboarding_completo | boolean | Controla si el wizard ya se completó |

**Plantilla** (catálogo global, no tenant-scoped)
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| nombre | enum: Creator / Academy / Business / Modern / Dark | |
| config_base | JSONB | Estilos/tokens de diseño propios de la plantilla |

### 2.2 Identity & Access

Tres tablas separadas por audiencia — **decisión heredada** de que alumno y staff de academia son conceptos distintos con ciclos de vida y flujos de auth distintos (ver sección 7).

**CursonubeStaff** (global, no tenant-scoped — empleados de Cursonube)
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| email, password_hash | | |
| rol | enum: SuperAdmin / Soporte | Para el Panel Admin (Documento 10 lo detalla) |

**AcademiaUsuario** (Owner / Administrador / Profesor / Editor)
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| tenant_id | FK → Academia | |
| email, password_hash | | |
| rol | enum: Owner / Administrador / Profesor / Editor | Matriz de permisos detallada en Documento 7 |
| estado | enum: activo / invitado_pendiente / desactivado | Soporta el flujo de invitación de profesores |

**Alumno** (aislado por academia — decisión ya confirmada en el Product Book)
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| tenant_id | FK → Academia | |
| email | | Único **por tenant**, no globalmente (la misma persona puede ser alumno en dos academias con registros independientes) |
| password_hash | nullable | Nullable porque el guest-checkout crea la cuenta antes de que el alumno defina contraseña (ver Documento 1, decisión D6) |
| nombre | string | |

### 2.3 Entitlements & Billing interno

**Plan** (catálogo global, data-driven — decisión D3 del Documento 2)
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| slug | enum: free / starter / pro / business | |
| max_profesores_editores | int | |
| max_alumnos | int, nullable (null = ilimitado) | |
| max_cursos | int, nullable | |
| dominio_propio_habilitado | boolean | |
| marca_cursonube_visible | boolean | |
| activo | boolean | Permite discontinuar un plan sin borrar histórico |

> **Nota:** deliberadamente **no** hay columna de "plantillas disponibles" ni de "bloques disponibles" en `Plan`. Ambas dimensiones están disponibles por igual en todos los planes (confirmado en el Product Book, sección 6.1) — el plan solo gatea escala (profesores/alumnos/cursos), dominio propio y visibilidad de marca.

**SuscripcionAcademia**
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| tenant_id | FK → Academia | |
| plan_id | FK → Plan | |
| proveedor_billing | enum: mercado_pago (único valor en MVP) | Preparado para agregar `stripe_billing` en V2 sin tocar el resto del modelo |
| external_subscription_id | string | ID de la suscripción en Mercado Pago |
| estado | enum: activa / pausada / vencida / cancelada | |
| fecha_inicio, fecha_proxima_facturacion | date | |

### 2.4 Course Catalog

**Curso**
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| tenant_id | FK → Academia | |
| titulo, slug, descripcion | | slug único por tenant |
| tipo_acceso | enum: gratis / pago_unico | Suscripciones/membresías del creador quedan para V1.1 (Product Book, F3) — no se modelan todavía |
| precio_centavos, moneda | int, string, nullable si es gratis | |
| imagen_portada_url | string, nullable | |
| estado | enum: borrador / publicado | |

**CursoInstructor** (tabla puente — un curso puede tener uno o más instructores, según el plan lo permita)
| Campo | Tipo | Notas |
|---|---|---|
| curso_id | FK → Curso | |
| academia_usuario_id | FK → AcademiaUsuario | Debe tener rol Profesor u Owner |

**Modulo**
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| curso_id | FK → Curso | |
| titulo, orden | | |

**Clase**
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| modulo_id | FK → Modulo | |
| titulo, orden | | |
| video_provider | enum: youtube_no_listado (único valor en MVP) | Vive detrás del adaptador `VideoProvider` (Documento 2, decisión D4) — agregar Vimeo/Bunny/Mux en el futuro no toca esta tabla, solo agrega valores al enum y su adaptador |
| video_external_id | string, nullable | |
| contenido_texto | text, nullable | |
| duracion_estimada_minutos | int, nullable | |

**ClaseAdjunto** (PDF, archivos, links — una clase puede tener varios)
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| clase_id | FK → Clase | |
| tipo | enum: pdf / archivo / link | |
| url, nombre_visible, orden | | |

### 2.5 Content Editor

**Pagina** (Inicio, Cursos, Sobre Nosotros, Contacto, FAQ, Políticas, Login + páginas custom que el usuario cree)
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| tenant_id | FK → Academia | |
| tipo | enum: home / cursos / sobre_nosotros / contacto / faq / politicas / login / custom | Las de tipo fijo se crean automáticamente en el wizard (E1) |
| slug, titulo | | slug único por tenant |
| estado | enum: borrador / publicada | |

**Bloque**
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| pagina_id | FK → Pagina | |
| tipo | enum: hero / texto / imagen / video / cursos / instructor / testimonios / faq / cta / newsletter / contacto / footer | Catálogo cerrado (Product Book, sección landing) |
| orden | int | |
| propiedades | JSONB | Ver decisión en sección 7 — cada tipo de bloque valida su propio shape a nivel de aplicación (Zod), no a nivel de base de datos |

> **Importante:** la landing de un `Curso` (`/cursos/slug`) **no** se arma con `Bloque` — se genera automáticamente a partir de la `Plantilla` de la academia y los datos del curso, tal como pide el Product Book ("el usuario no debe diseñarla"). `Bloque` es exclusivamente para páginas del sitio institucional y páginas custom.

**Lead** (adenda — Documento 5, decisión E1: destino de los datos capturados por los bloques Newsletter y Contacto)
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| tenant_id | FK → Academia | |
| origen | enum: newsletter / contacto | Qué bloque generó el registro |
| nombre | string, nullable | Solo lo completa el bloque Contacto |
| email | string | |
| mensaje | text, nullable | Solo lo completa el bloque Contacto |
| created_at | timestamp | |

### 2.6 Enrollment & Payments

**CuentaPagoCreador** (conexión OAuth del creador con su propio Mercado Pago)
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| tenant_id | FK → Academia | |
| proveedor | enum: mercado_pago (único valor en MVP, preparado para `stripe` en V1.1) | |
| external_account_id | string | |
| access_token_encriptado | string | Cifrado en reposo — detalle de manejo en Documento 16 (Seguridad) |
| estado_conexion | enum: conectada / desconectada / revocada | |

**Inscripcion**
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| tenant_id | FK → Academia | |
| alumno_id | FK → Alumno | |
| curso_id | FK → Curso | |
| estado | enum: activa / completada / cancelada | |
| fecha_inscripcion, fecha_completado | timestamp, nullable | |

**ProgresoClase** (granular, no solo un % — necesario para "continuar donde lo dejaste", para el check de elegibilidad de certificado, y para mostrar el tilde de completado por clase)
| Campo | Tipo | Notas |
|---|---|---|
| inscripcion_id | FK → Inscripcion | |
| clase_id | FK → Clase | |
| completado | boolean | |
| fecha_completado | timestamp, nullable | |

**Pago**
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| tenant_id | FK → Academia | |
| inscripcion_id | FK → Inscripcion | |
| proveedor | enum: mercado_pago (único valor en MVP) | |
| external_payment_id | string | |
| monto_centavos, moneda | int, string | Congelado al momento de la compra |
| estado | enum: aprobado / pendiente / rechazado / reembolsado | |

### 2.7 Certificates

**Certificado**
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| tenant_id | FK → Academia | |
| inscripcion_id | FK → Inscripcion | |
| url_pdf | string | |
| codigo_verificacion | string, unique global | **Se genera desde el MVP para todo certificado emitido**, aunque la página de verificación por QR (Product Book, F4) recién se construya en V1.1. Así ningún certificado emitido en el lanzamiento queda "sin código" cuando la verificación se active — evita una migración de backfill sobre certificados ya emitidos. |
| fecha_emision | timestamp | |

### 2.8 Platform Admin

**AuditLog** (acciones de staff de Cursonube sobre tenants — ej. suspender una academia)
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| staff_id | FK → CursonubeStaff | |
| tenant_id | FK → Academia, nullable | Nullable porque algunas acciones de staff no son sobre un tenant puntual |
| accion | string | ej. `academia.suspendida`, `plan.modificado` |
| metadata | JSONB | Detalle de la acción |
| created_at | timestamp | |

## 3. Qué no se modela todavía (deferred)

- Suscripciones/membresías que el creador vende a sus alumnos (Product Book, F3) — V1.1.
- Dominio propio: la columna `dominio_propio` existe en `Academia` desde ya (barato agregarla ahora), pero el flujo de verificación de dominio y su tabla de estados detallada se diseña en el Documento 6 (Sistema Multi-Tenant) cuando se construya la feature en V1.1.
- Segundo proveedor de pago del alumno (Stripe) y segundo proveedor de billing (Stripe Billing) — los enums de `proveedor`/`proveedor_billing` ya están preparados para sumar valores sin romper el esquema, pero no se modela su detalle todavía.
- Versionado de historial de cambios de contenido de curso/clase — no hay evidencia de que se necesite para el MVP.

## 4. Decisiones irreversibles o costosas de revertir

| # | Decisión | Por qué es costosa de revertir | Estado |
|---|---|---|---|
| M1 | **Soft-delete obligatorio en entidades transaccionales/académicas** (`Academia`, `Curso` una vez tiene alguna `Inscripcion`, `Inscripcion`, `Pago`, `Certificado`, `SuscripcionAcademia`) — nunca borrado físico. Blocks/Páginas/Módulos/Clases sin alumnos asociados sí pueden borrarse físicamente. | Un certificado debe seguir siendo verificable aunque el creador borre el curso después; un pago debe conservarse por motivos contables/legales aunque se cancele una suscripción; una academia suspendida no debe perder sus datos por accidente. | ✅ Confirmado. `deleted_at` se filtra automáticamente en la misma capa que ya filtra `tenant_id` (Documento 2). |
| M2 | Alumno y AcademiaUsuario como **tablas completamente separadas** (no un `Usuario` único con campo `rol`). | Se deriva directamente de decisiones ya aprobadas: identidad de alumno aislada por tenant (Product Book) y guest-checkout con flujo de auth propio (D6) — mezclar ambas audiencias en una tabla obligaría a reconciliar dos ciclos de vida y flujos de login distintos bajo un mismo esquema. | ✅ Ya implícito en decisiones previas — se documenta acá, no requiere nueva validación. |
| M3 | `Bloque.propiedades` como **JSONB** en vez de una tabla normalizada por tipo de bloque. | Cambiarlo después implica migrar contenido ya creado por academias reales hacia N tablas nuevas. Se acepta el trade-off (menos validación a nivel de base de datos) porque el catálogo de bloques es cerrado y conocido, y se compensa con validación de shape en la capa de aplicación (Zod) por tipo de bloque. | ✅ Se da por aceptado — trade-off estándar de la industria para editores de bloques (Shopify, Webflow usan el mismo patrón). Avisame si preferís objetarlo. |
| M4 | Dinero almacenado como **entero en centavos + código ISO 4217**, nunca float. | Cambiar la representación de dinero con pagos reales ya registrados es una migración de datos financiera de alto riesgo. | ✅ Práctica estándar de la industria (es lo que hace Stripe internamente) — se da por aceptada. |

---
**Documento 3 (Modelo de Datos) — sin puntos pendientes.** Si confirmás, lo marco ✅ Aprobado en `docs/README.md` y avanzamos al Documento 4 (UX Flows).
