# Cursonube — Roadmap
### Documento 12 de 16 · Estado: 🟡 En revisión — pendiente de aprobación

---

Este documento consolida en un solo lugar todas las clasificaciones MVP / V1.1 / V2 / V3 ya decididas a lo largo de los Documentos 1 a 11 — no introduce features nuevas, las organiza y les da una secuencia de construcción.

## 1. MVP — todo lo imprescindible para lanzar

| Épica | Documento de origen |
|---|---|
| Registro + Wizard de onboarding (5 pasos) | 1, 4 |
| Multi-tenancy por subdominio (wildcard DNS) | 1, 2, 6 |
| Editor de landing por bloques (12 tipos) | 1, 5 |
| Sistema de 5 plantillas | 1, 5 |
| Sitio institucional autogenerado | 1, 5 |
| Gestión de cursos (Academia → Curso → Módulo → Clase) | 1, 3, 9 |
| Landing de curso autogenerada | 1 |
| Video embebido (YouTube No Listado) | 1, 9 |
| Checkout y pago alumno→creador (Mercado Pago) | 1, 8 |
| Compra sin registro previo (guest checkout) | 1, 4 |
| Certificados PDF automáticos (con código de verificación ya generado) | 1, 9 |
| Captura de Leads (Newsletter/Contacto) | 5 |
| Roles y permisos (Owner/Admin/Profesor/Editor/Alumno) + 2FA para staff | 1, 7 |
| Panel del Creador (8 secciones) | 10 |
| Panel del Alumno | 11 |
| Billing propio de Cursonube (Mercado Pago Suscripciones) | 1, 8 |
| Panel interno de administración (Cursonube staff) | 1, 10 |
| Motor de Entitlements data-driven | 1, 2 |
| Soft-delete en entidades transaccionales/académicas | 3 |

## 2. V1.1 — inmediatamente después del lanzamiento

| Feature | Documento de origen |
|---|---|
| Stripe como segundo gateway alumno→creador | 1 |
| Dominio propio (custom domain) — modelo y resolución ya listos desde el MVP, falta la verificación/SSL | 1, 6, 14 (pendiente) |
| Suscripciones/membresías recurrentes del creador a sus alumnos | 1 |
| Verificación de certificados por QR | 1, 3 |
| Botón de reembolso dentro del panel (hoy solo se escucha el webhook) | 8 |
| Centro de notificaciones in-app (si hay demanda real) | 10 |
| Exportación de datos (CSV) | 10 |
| Integración con proveedores externos de email marketing | 5 |

## 3. V2 — cuando el producto ya factura de forma sostenida

- Video hosting propio (Bunny Stream / Cloudflare Stream / Mux), reemplazando YouTube No Listado.
- Segundo Billing Provider (Stripe Billing) para expansión fuera de LatAm.
- Clases en vivo / webinars.
- Gamificación básica.

## 4. V3 — con base sólida de clientes

- IA (generación de contenido, asistente para el creador).
- Marketplace opcional — **no se reabre esta discusión sin datos reales de usuarios pidiéndolo**, contradice el posicionamiento fundacional (Documento 1).
- Aplicación móvil nativa.
- Comunidad, chat, foros.
- Afiliados.
- Drip content.

## 5. Secuencia de construcción sugerida dentro del MVP

No es una decisión de negocio, es orden técnico dictado por dependencias (no se puede construir lo de arriba sin lo de abajo):

1. Multi-tenancy + resolución de tenant (Documento 6) + Autenticación y roles (Documento 7) — la base sobre la que todo lo demás corre.
2. Modelo de datos completo + Entitlements (Documentos 2, 3).
3. Wizard de onboarding + sistema de plantillas y bloques (Documentos 1, 5).
4. Sistema de Cursos (Documento 9).
5. Pagos alumno→creador + guest checkout (Documento 8).
6. Certificados.
7. Paneles del Creador y del Alumno (Documentos 10, 11).
8. Billing propio de Cursonube + Panel de Administración interno (Documentos 8, 10).

## 6. Decisiones irreversibles o costosas de revertir

No son decisiones técnicas — son decisiones de **estrategia de lanzamiento** que, una vez comunicadas públicamente, son costosas de cambiar (generan expectativa en usuarios reales):

| # | Decisión | Por qué vale la pena decidirlo ahora | Estado |
|---|---|---|---|
| R1 | **Registro público abierto desde el día 1** — sin beta cerrada ni lista de espera. No hace falta landing de "lista de espera" ni mecanismo de invitación; el wizard de onboarding debe estar lo suficientemente pulido y probado (QA propio del equipo, no de una beta externa) antes del lanzamiento, dado que cualquiera podrá crear su academia desde el primer día. | Decisión de estrategia de negocio del usuario — implica que el foco de calidad/testing pre-lanzamiento recae 100% en QA interno, sin margen de un grupo piloto externo que absorba los primeros bugs. | ✅ Confirmado. |
| R2 | Los criterios para pasar de V1.1 a V2 a V3 quedan **cualitativos por ahora** ("cuando el producto factura de forma sostenida", "con base sólida de clientes") — se fijan umbrales numéricos concretos más adelante, con datos reales de los primeros meses de operación. | Fijar un número hoy sin datos de mercado sería una meta inventada, no basada en evidencia. | ✅ Confirmado. |

---
**Documento 12 (Roadmap) — sin puntos pendientes.** Si confirmás, lo marco ✅ Aprobado en `docs/README.md` y avanzamos al Documento 13 (API Design).
