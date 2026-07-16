# Cursonube — Product Book
### Documento 1 de 16 · Estado: 🟡 En revisión — pendiente de aprobación

---

## 1. Visión

Cursonube es la infraestructura que le permite a cualquier persona no técnica crear su propia academia online — con marca propia, dominio propio y cursos propios — en menos de cinco minutos, sin instalar nada, sin configurar servidores y sin depender de un desarrollador.

**Analogía de referencia:** lo que Tiendanube hizo por el e-commerce en LatAm (democratizar tener una tienda propia sin saber de hosting ni de código), Cursonube lo hace por la educación online.

## 2. Problema

Hoy, alguien que quiere vender cursos online tiene dos malos caminos:

1. **Marketplaces (Hotmart, Udemy):** rápidos para empezar, pero el creador no tiene marca propia, compite por atención dentro del marketplace, y cede control de la relación con el alumno y (en Udemy) del precio.
2. **Autoalojado (WordPress + LearnDash/Tutor LMS, o construir a medida):** control total, pero exige hosting, mantenimiento, seguridad, actualizaciones de plugins y conocimiento técnico que el usuario objetivo no tiene ni quiere tener.

No existe hoy, con presencia fuerte en Argentina/LatAm y pagos nativos en Mercado Pago, una opción intermedia: **SaaS 100% hospedado, con marca propia, sin marketplace, sin fricción técnica.**

## 3. Posicionamiento competitivo

Es importante ser honestos sobre esto para que el equipo entienda el terreno real:

| Competidor | Categoría | Por qué Cursonube es distinto |
|---|---|---|
| Hotmart, Udemy, Hotmart Club | Marketplace | Cursonube no lista academias entre sí ni compite por el mismo alumno. La academia es dueña de su tráfico y su marca. |
| WordPress + LearnDash/Tutor LMS | Autoalojado | Cero mantenimiento técnico, cero hosting, cero plugins que romper. |
| **Teachable, Kajabi, Thinkific** | SaaS hospedado, sin marketplace | **Este es el competidor real y directo.** Cursonube no inventa una categoría nueva — la localiza: onboarding más simple (wizard de 5 pasos vs. configuración libre), pagos nativos en Mercado Pago (no soportado de forma nativa por ninguno de los tres), precios en moneda local, soporte en español, y un editor de bloques deliberadamente más acotado (menos poder, menos fricción). |

**Implicación estratégica:** nuestra ventaja no es "hacer algo que no existe", es "hacerlo simple, en español y con Mercado Pago nativo, para un mercado que hoy tiene que resolver todo esto con herramientas en inglés y pasarelas que no encajan con cómo cobra la región". Esto debe guiar cada decisión de producto: cuando dudemos entre una feature "poderosa" y una "simple", gana simple.

## 4. Usuario objetivo (personas)

### Persona primaria — "El Creador"
Infoproductor, coach, consultor, profesional independiente o pyme de capacitación. No es técnico. Ya tiene (o está por grabar) contenido en video. Hoy probablemente usa Hotmart, un grupo de WhatsApp/Telegram, o Google Drive + YouTube no listado de forma artesanal. Quiere verse profesional, cobrar sin fricción, y no quiere aprender una herramienta compleja.

### Persona secundaria — "El Profesor/Editor invitado"
Instructor o colaborador agregado por el Owner de la academia (según plan contratado). Necesita cargar contenido o gestionar alumnos sin acceso a configuración de facturación ni datos sensibles.

### Persona terciaria — "El Alumno"
Compra o se inscribe a un curso dentro de una academia puntual. No tiene relación con Cursonube como marca — su experiencia es 100% con la marca de la academia.

## 5. Propuesta de valor

> "Creá tu academia online en 5 minutos. Sin código, sin hosting, sin complicaciones. Empezá a vender hoy."

Pilares de la propuesta de valor, en orden de prioridad:
1. **Time-to-value:** de registro a academia funcional y vendible, en minutos.
2. **Cero pantalla vacía:** todo estado intermedio del producto debe verse terminado, nunca "en construcción".
3. **Simplicidad sobre poder:** el editor de bloques es deliberadamente menos potente que un builder libre — es una feature, no una limitación a disculpar.
4. **Pagos nativos de la región:** Mercado Pago de punta a punta en el lanzamiento.

## 6. Modelo de negocio

- Cursonube **no cobra comisión sobre las ventas del creador.** El dinero de la venta alumno→creador va directo a la cuenta de Mercado Pago del creador; Cursonube nunca lo retiene ni administra.
- Cursonube monetiza **exclusivamente vía suscripción mensual/anual de la academia** a un plan de Cursonube (modelo Tiendanube), cobrado a través de Mercado Pago Suscripciones en el lanzamiento.
- Esto implica que el valor percibido de cada plan debe justificarse por **límites y funcionalidades de la plataforma** (cantidad de profesores, alumnos, cursos, dominio propio, marca "Powered by Cursonube", etc.), no por un % de facturación.

### 6.1 Planes de Cursonube — estructura (sin precios)

Definición **solo de estructura y límites**, sin precios — el pricing se define más adelante, en un ejercicio de negocio separado (no bloquea el diseño técnico, que solo necesita saber *cuántos niveles* y *qué varía entre ellos*):

| Plan | Profesores/editores | Alumnos | Cursos | Dominio propio | Marca Cursonube |
|---|---|---|---|---|---|
| **Free** | 1 (solo Owner) | Límite bajo (a definir) | 1 | No (solo subdominio) | Visible ("Powered by Cursonube") |
| **Starter** | Hasta 2 | Límite medio (a definir) | Limitado (a definir) | No (solo subdominio) | Visible |
| **Pro** | Hasta 5 (a definir) | Alto/ilimitado (a definir) | Ilimitados | Sí (cuando se lance en V1.1) | Oculta |
| **Business** | Ilimitado o límite alto (a definir) | Ilimitado | Ilimitados | Sí | Oculta + soporte prioritario |

Los valores exactos ("a definir") se completan cuando el equipo de negocio los defina; lo que sí queda fijado ahora es la **cantidad de niveles (4) y qué dimensiones son plan-gateable**: cantidad de profesores/editores, cantidad de alumnos, cantidad de cursos, dominio propio, marca Cursonube visible/oculta.

> ⚠️ **Decisión de arquitectura derivada de esto (ver sección 11):** para que agregar/modificar/reordenar planes en el futuro sea un cambio de configuración y no de código, el modelo de **Entitlements** debe ser data-driven desde el día 1, no una serie de condicionales `if (plan === 'pro')` distribuidos por el código.

**Explícitamente NO son dimensiones de plan (confirmado):**
- **Plantillas:** las 5 plantillas (Creator, Academy, Business, Modern, Dark) están disponibles por igual en todos los planes, incluido Free. No son un diferenciador — evita romper el Flujo 1 de onboarding (Documento 4) para algunos planes, y evita que una academia gratuita (que también expone la marca Cursonube) se vea "capada" estéticamente.
- **Editor de bloques:** los 12 tipos de bloque (Hero, Texto, Imagen, Video, Cursos, Instructor, Testimonios, FAQ, CTA, Newsletter, Contacto, Footer) están disponibles por igual en todos los planes. Los planes se diferencian **solo por escala** (profesores/alumnos/cursos) + dominio propio + marca visible — nunca por funcionalidad básica del sitio.

## 7. Alcance del producto — clasificación de funcionalidades

Convención de clasificación (todas las features de este documento y de los siguientes se etiquetan así):
- **MVP** — imprescindible para lanzar.
- **V1.1** — inmediatamente después del lanzamiento.
- **V2** — cuando el producto ya factura de forma sostenida.
- **V3** — cuando existe una base sólida de clientes.

### 7.1 Épicas MVP (imprescindibles para lanzar)

| # | Épica | Notas |
|---|---|---|
| E1 | Registro + Wizard de onboarding (5 pasos) | Nombre → subdominio (validado en tiempo real) → plantilla → branding (logo, colores, imagen principal) → primer curso (opcional). Al finalizar, la academia es 100% funcional, nunca vacía. |
| E2 | Multi-tenancy por subdominio (wildcard DNS) | `academia.cursonube.com`. Un solo deploy, una sola infra. |
| E3 | Editor de landing por bloques | Hero, Texto, Imagen, Video, Cursos, Instructor, Testimonios, FAQ, CTA, Newsletter, Contacto, Footer. Agregar/eliminar/duplicar/reordenar/editar propiedades. Nunca rompe el diseño. |
| E4 | Sistema de 5 plantillas | Creator, Academy, Business, Modern, Dark. Mismo sistema de bloques, estilos propios. |
| E5 | Sitio institucional autogenerado | Inicio, Cursos, Sobre Nosotros, Contacto, FAQ, Políticas, Login. Editable con el mismo editor de bloques. Páginas nuevas también vía bloques. |
| E6 | Gestión de cursos | Jerarquía Academia → Curso → Módulo → Clase. Clase admite Video, Texto, PDF, Archivos, Links. |
| E7 | Landing de curso autogenerada | `academia.cursonube.com/cursos/slug`, generada por la plantilla, sin diseño manual del usuario. |
| E8 | Video embebido (sin hosting propio) | **Únicamente YouTube No Listado en MVP.** La arquitectura debe aislar el proveedor de video detrás de un adaptador (`VideoProvider`), de forma que el dominio de Cursos nunca conozca detalles de YouTube — así se incorporan Vimeo, Bunny Stream, Cloudflare Stream o Mux en el futuro sin tocar el dominio de cursos. Ver decisión irreversible en sección 11. |
| E9 | Checkout y pagos alumno→creador (Mercado Pago) | Solo pago único + inscripción gratuita en MVP. Interfaz de Payment Provider desacoplada. Incluye **compra sin registro previo** (ver E16). |
| E10 | Certificados PDF automáticos | Generado al completar el curso. Arquitectura lista para QR de verificación (V1.1/V2). |
| E11 | Roles y permisos | Owner, Administrador, Profesor, Editor, Alumno. Límite de profesores/editores según plan contratado (vía Entitlements, ver sección 11). Matriz detallada en Documento 7. |
| E12 | Panel del creador | Dashboard, cursos, alumnos, ventas, configuración de academia. |
| E13 | Panel del alumno | Mis cursos, progreso, certificados. |
| E14 | Billing propio de Cursonube | Suscripción de la academia a un plan de Cursonube vía Mercado Pago Suscripciones. Interfaz de Billing Provider desacoplada del resto del sistema. |
| E15 | Panel interno de administración (Cursonube staff) | **Confirmado MVP, minimalista.** Debe permitir: administrar academias (ver/suspender/reactivar), usuarios, planes, suscripciones y su estado, y estadísticas básicas del sistema (cantidad de tenants activos, MRR, etc.). |
| E16 | Compra sin registro previo (guest checkout) | El alumno puede pagar un curso sin tener cuenta creada de antemano. El sistema genera la cuenta automáticamente en el momento de la compra, dentro de esa academia (coherente con la identidad aislada por tenant ya definida). Reduce fricción de compra, que es el evento de negocio más importante del sistema. Estrategia de autenticación de la cuenta auto-creada: ver decisión irreversible en sección 11. |

### 7.2 V1.1 (inmediatamente después del lanzamiento)

| # | Feature | Por qué no es MVP |
|---|---|---|
| F1 | Stripe como segundo gateway alumno→creador | Duplicaría integración/QA de pagos en el lanzamiento sin agregar valor al primer cliente LatAm. |
| F2 | Dominio propio (custom domain) | La arquitectura de resolución de tenant se diseña para soportarlo desde el día 1 (Documento 6), pero la feature en sí (verificación de dominio, automatización de SSL) se puede lanzar después sin bloquear la venta del primer curso. |
| F3 | Suscripciones/membresías recurrentes del creador a sus alumnos | Dunning, reintentos de cobro, cancelaciones y prorrateo — la funcionalidad más cara de "Planes" en esfuerzo/riesgo. Pago único + gratis ya permite vender el día 1. |
| F4 | Verificación de certificados por QR | Mejora incremental sobre el certificado PDF ya funcional. |

### 7.3 V2 (cuando el producto ya factura)

- Video hosting propio (Bunny Stream / Cloudflare Stream / Mux) — reemplaza YouTube/enlace cuando el volumen y el riesgo de contenido pirateado lo justifiquen.
- Billing Provider adicional (Stripe Billing) para expansión fuera de LatAm.
- Clases en vivo / webinars.
- Gamificación básica (progreso, badges).

### 7.4 V3 (con base sólida de clientes)

- IA (generación de contenido, asistente para el creador).
- Marketplace opcional (si en algún momento se valida como línea de negocio separada — **no reabrir esta discusión sin datos reales de usuarios pidiéndolo**, ya que contradice el posicionamiento fundacional).
- Aplicación móvil nativa.
- Comunidad, chat, foros.
- Afiliados.
- Drip content (liberación progresiva de contenido).

### 7.5 Explícitamente fuera de alcance de V1 (confirmado en el brief)

IA, Marketplace, aplicación móvil, comunidad, chat, foros, afiliados, gamificación, drip content, clases en vivo. La arquitectura debe dejar espacio para estos (no debe requerir reescritura), pero ninguno se diseña en detalle todavía.

## 8. Riesgos identificados (como CTO, no puedo dejarlos sin nombrar)

| Riesgo | Impacto | Mitigación propuesta |
|---|---|---|
| **Piratería de contenido.** YouTube no listado / enlaces no tienen DRM real. Cualquier alumno puede compartir el link. | Alto para creadores de contenido de alto valor (cursos caros). | Ser explícitos en el Product Book y en el marketing de que la protección de contenido es débil en MVP; roadmap claro a Bunny/Cloudflare Stream/Mux en V2 con tokens firmados y expiración. No prometer "contenido protegido" en MVP. |
| **Concentración en Mercado Pago.** Tanto el billing propio de Cursonube como el pago alumno→creador dependen de un solo proveedor al día 1. | Si Mercado Pago tiene una caída o problema regulatorio, afecta ingresos de Cursonube Y de todas las academias simultáneamente. | Ya mitigado parcialmente por la decisión de interfaces desacopladas (Payment Provider / Billing Provider) — permite reaccionar rápido, aunque no elimina el riesgo de day-1. |
| **"Plan-gating" desordenado.** Límites por plan (profesores, alumnos, cursos, dominio propio) tocan casi todos los módulos del sistema. | Si se implementa como `if (plan === 'pro')` disperso por el código, se vuelve inmantenible rápido. | Diseñar desde el Documento 2 (Arquitectura) un módulo central de **Entitlements** que centralice "qué puede hacer este tenant según su plan", consultado por el resto del sistema — nunca lógica de plan duplicada en cada feature. |
| **Cero pantalla vacía + plantillas limitadas a 5.** Puede generar percepción de "todas las academias se ven iguales". | Medio — afecta diferenciación de marca entre academias. | Mitigado por personalización de logo/colores/imágenes dentro de cada plantilla; monitorear feedback real post-lanzamiento antes de sumar plantillas. |

## 9. Idioma

MVP: interfaz únicamente en español (Argentina/LatAm). No se implementan múltiples idiomas hasta una versión posterior. Ver decisión irreversible en sección 11 sobre cómo se prepara la arquitectura para esto sin construir i18n completo ahora.

## 10. Métricas de éxito (KPIs) — propuesta

- **Activación:** % de registros que completan el wizard y llegan a "academia funcional".
- **Time-to-first-course:** tiempo desde registro hasta primer curso publicado.
- **Time-to-first-sale:** tiempo desde academia funcional hasta primera venta.
- **MRR** (suscripciones de academias a Cursonube).
- **Churn mensual de academias.**
- **GMV** (volumen de ventas alumno→creador, aunque no genere comisión directa — es la métrica de salud del ecosistema).

## 11. Decisiones irreversibles o costosas de revertir

A partir de este documento, cada uno de los 16 documentos incluirá esta sección. Regla de trabajo acordada: si una decisión de este tipo aparece, el proceso se detiene y se valida explícitamente antes de continuar — no se asume.

| # | Decisión | Por qué es costosa de revertir | Estado |
|---|---|---|---|
| D1 | No somos marketplace: academias aisladas, sin descubrimiento cruzado. | Cambiarlo después implica rediseñar búsqueda, checkout, ranking y moderación de contenido cross-tenant — es esencialmente otro producto. | ✅ Confirmado (brief original). |
| D2 | Alumno = identidad aislada por academia (no hay cuenta global cross-tenant). | Una vez que existan miles de alumnos duplicados por email entre tenants, unificarlos requiere migración de datos y rediseño de autenticación con riesgo de colisión/seguridad. | ✅ Confirmado. |
| D3 | Entitlements (límites por plan) deben ser **data-driven** desde el día 1, no condicionales hardcodeados. | Si se lanza con `if (plan === 'x')` disperso en el código, agregar/dividir/renombrar un plan más adelante obliga a tocar cada feature gateada — refactor grande y riesgoso con tenants ya en producción. | ✅ Confirmado: motor de Entitlements data-driven desde el Documento 2. |
| D4 | Proveedor de video (YouTube en MVP) debe vivir detrás de un adaptador (`VideoProvider`), nunca acoplado al dominio de Cursos. | Si el modelo de datos de Clase/Curso asume "YouTube" en su estructura, migrar a Bunny/Cloudflare Stream/Mux en V2 requiere tocar el dominio de cursos, no solo agregar un proveedor. Vos mismo lo pediste explícitamente. | ✅ Confirmado, se implementa así. |
| D5 | i18n: strings de UI externalizados a un sistema de claves de traducción desde el primer commit, aunque en MVP solo exista el locale español. | Si el texto se hardcodea en español directo en componentes/plantillas, agregar un segundo idioma después implica tocar cada pantalla una por una. El costo de hacerlo bien ahora es bajo (una capa de indirección); el costo de no hacerlo es alto y creciente con cada pantalla nueva que se construya sin la capa. | ✅ Confirmado: claves de traducción desde el primer commit, único locale `es` cargado en MVP. |
| D6 | Estrategia de autenticación para cuentas auto-creadas en compra sin registro previo (E16). | La forma en que se crea y autentica esa cuenta define el modelo de sesión de todo el sistema de alumnos — cambiarlo después de tener alumnos activos implica migrar credenciales o forzar resets masivos. | ✅ Confirmado. Flujo: (1) Alumno click "Comprar" → (2) completa Nombre + Email → (3) paga con Mercado Pago → (4) pago aprobado → (5) Cursonube crea la cuenta automáticamente → (6) pantalla in-session "Compra exitosa, creá tu contraseña" (sin depender de que llegue un email para activarla) → (7) el alumno define su contraseña ahí mismo → (8) queda logueado automáticamente y entra al curso → (9) recibe además un email de bienvenida (informativo, no bloqueante). No hay estado intermedio de "cuenta pendiente de activación": la cuenta queda utilizable en el mismo flujo, sin depender del email. |

## 12. Estado de aprobación

Todas las decisiones y preguntas abiertas de este documento (secciones 6.1, 7, 9 y 11) quedaron resueltas. No hay puntos pendientes de validación.

---
**Documento 1 (Product Book) — listo para tu aprobación final.** Si confirmás, actualizo el estado a ✅ Aprobado en `docs/README.md` y avanzamos al Documento 2 (Arquitectura).
