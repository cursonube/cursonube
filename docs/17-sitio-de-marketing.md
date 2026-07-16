# Cursonube — Sitio de Marketing (cursonube.com)
### Documento 17 (adenda) · Estado: 🟡 En revisión — pendiente de aprobación

---

Gap detectado después de cerrar los 16 documentos originales: se diseñó exhaustivamente el sitio de **cada academia** (`academia.cursonube.com`), pero nunca el sitio de **Cursonube como empresa** (`cursonube.com`) — la landing que vende la plataforma a futuros creadores. Se trata como adenda (toca directamente los Documentos 4 y 6 ya aprobados) en vez de reabrir esos documentos desde cero.

## 1. Dónde vive técnicamente

**Mismo proyecto Next.js** que sirve a las academias — no un deploy separado. Extiende la resolución de tenant del Documento 6: el middleware, al recibir `Host = cursonube.com` o `www.cursonube.com`, **no** intenta resolver un tenant — sirve directamente las páginas de marketing. Es un caso especial explícito, no una consecuencia accidental de que "cursonube" sea justo una de las palabras reservadas de subdominio (Documento 4) — son dos mecanismos relacionados pero distintos: la palabra reservada evita que una academia *tome* `cursonube.cursonube.com`; el caso especial de dominio raíz define qué se sirve en el dominio *sin* subdominio.

## 2. Alcance del MVP del sitio de marketing

Sin blog ni contenido de SEO todavía (decisión de alcance, no técnica — se puede sumar después sin rediseñar nada):

| Página | Contenido |
|---|---|
| **Home** | Propuesta de valor, posicionamiento (Documento 1, secciones 3 y 5) |
| **Precios** | Estructura de planes ya definida (Documento 1, sección 6.1) — sin montos todavía, igual que en ese documento |
| **Registro** | Paso 0 del wizard (Documento 4, Flujo 1): cuenta del futuro Owner. Es el único punto donde el flujo de onboarding vive en el dominio raíz — desde el Paso 1 en adelante (una vez elegido el subdominio) todo pasa a `subdominio.cursonube.com` |
| **Legales** | Términos de Servicio y Política de Privacidad **de Cursonube como empresa** — distintas de la página "Políticas" que cada academia tiene en su propio sitio (Documento 1), que es contenido de cada academia, no de Cursonube |

## 3. Nota operativa/legal (no bloqueante, mismo criterio que la nota de facturación del Documento 8)

Términos de Servicio y Política de Privacidad de Cursonube deben redactarse con asesoría legal antes del lanzamiento público — no se fabrica el texto legal en este documento de arquitectura. Queda registrado como pendiente junto a la nota de facturación electrónica ya anotada en el Documento 8.

## 4. Ajuste al Documento 4 (UX Flows)

El Flujo 1 (Registro y Wizard de Onboarding) queda aclarado así: **Paso 0 ocurre en `cursonube.com/registro`**, no en un subdominio (todavía no existe ninguno en ese momento). Al completar el Paso 2 (elección de subdominio), el resto del wizard (Pasos 3, 4, 5) puede continuar ya bajo `subdominio.cursonube.com`, o completarse antes de la redirección — detalle de implementación sin impacto de producto, se resuelve en desarrollo.

## 5. Decisiones irreversibles o costosas de revertir

| # | Decisión | Por qué es costosa de revertir | Estado |
|---|---|---|---|
| M1 | Sitio de marketing en el mismo proyecto Next.js, con caso especial de dominio raíz en el middleware de tenant (extiende Documento 6). | Separarlo en otro proyecto después implicaría duplicar el sistema de diseño/componentes o migrar contenido ya publicado a otro repo. | ✅ Confirmado. |
| M2 | Sin blog/SEO en el MVP. | Bajo costo de agregar después (es contenido adicional, no un rediseño); construirlo ahora sin necesidad sería alcance no solicitado. | ✅ Confirmado. |

---
**Documento 17 (adenda) — sin puntos pendientes.** Si confirmás, lo marco ✅ Aprobado en `docs/README.md`.
