# Cursonube — API Design
### Documento 13 de 16 · Estado: 🟡 En revisión — pendiente de aprobación

---

## 1. Alcance de este documento

La API aquí diseñada es la que expone **NestJS** y consume el **frontend Next.js propio** (Documento 2, decisión A2) — es una API interna, no un producto público para integraciones de terceros. Se diseña con las convenciones suficientes (versionado, documentación autogenerada, formato REST estándar) para que exponerla públicamente en el futuro sea una decisión de **acceso** (agregar API keys, rate limiting comercial, developer portal), no un **rediseño**. Ninguna fase del Roadmap ya aprobado (Documento 12) incluye construir una API pública como producto — no se construye ahora.

## 2. Estilo de API

**REST + OpenAPI.** Es el estándar más portable y universalmente entendido; NestJS genera el spec OpenAPI automáticamente desde decorators. Es la base natural para exponer una eventual API pública a terceros sin rediseñar nada. Se descartan tRPC (no sirve para una futura API pública de terceros — un desarrollador externo no puede "consumir" tRPC) y GraphQL (complejidad real — resolvers, problema N+1, un schema para mantener — que no se justifica con un solo consumidor interno y necesidades de datos relativamente simples; sería la sobreingeniería que el brief pidió evitar).

## 3. Versionado

Todas las rutas bajo `/api/v1/...` desde el primer commit. Agregar el prefijo de versión ahora es gratis; agregarlo después de tener un frontend (o, peor, terceros) consumiendo rutas sin versión es una migración forzada de todos los consumidores a la vez.

## 4. Convenciones

- **Paginación:** cursor-based (no offset/limit clásico) en todo listado que pueda crecer sin techo (alumnos, cursos, pagos). El volumen objetivo del proyecto (cientos de miles de academias, cada una con su propia base de alumnos) hace que offset-pagination degrade en rendimiento y sea inconsistente ante inserts concurrentes — cursor-based es la práctica estándar a esta escala (mismo criterio ya aplicado a UUID v7/ULID en el Documento 2).
- **Formato de error estándar:** toda respuesta de error sigue una forma consistente (`{ error: { code, message, details } }`), nunca mensajes de error ad-hoc distintos por endpoint.
- **Naming:** rutas en kebab-case, propiedades de JSON en camelCase.
- **Documentación autogenerada:** OpenAPI/Swagger generado directamente desde los decorators de NestJS — la documentación nunca se escribe a mano ni puede desincronizarse del código real.

## 5. Contratos compartidos entre backend y frontend

Ambos servicios están en TypeScript (Documento 2) — se evita duplicar definiciones de tipos a mano entre NestJS y Next.js generando un paquete de tipos compartido a partir del spec de OpenAPI (ej. `openapi-typescript`), dentro de un monorepo (workspaces). El frontend nunca define de nuevo la forma de un DTO que el backend ya expone.

## 6. Qué no se decide en este documento

- Autenticación de terceros (API keys, OAuth2 client credentials) para una eventual API pública — se diseña si y cuando esa feature se construya (no está en ninguna fase del Roadmap hoy).
- Rate limiting detallado — Documento 16 (Seguridad).
- Webhooks salientes de Cursonube hacia sistemas del creador (ej. avisarle a su CRM de una venta) — no solicitado, no se asume.

## 7. Decisiones irreversibles o costosas de revertir

| # | Decisión | Por qué es costosa de revertir | Estado |
|---|---|---|---|
| A1 | REST + OpenAPI como estilo de API entre NestJS y Next.js. | Define cómo se comunican los dos servicios en todo el sistema — cambiarlo después implica reescribir cada endpoint y su consumo desde el frontend. | ✅ Confirmado. |
| A2 | Versionado `/api/v1/` desde el primer commit. | Agregarlo después de tener consumidores (internos o de terceros) sin versión implica migrarlos a todos a la vez. | ✅ Confirmado. |
| A3 | Paginación cursor-based en listados sin techo de crecimiento. | Cambiar de offset a cursor con clientes ya integrados contra offset-pagination rompe su forma de navegar resultados. | ✅ Confirmado, dado el volumen objetivo del proyecto. |

---
**Documento 13 (API Design) — sin puntos pendientes.** Si confirmás, lo marco ✅ Aprobado en `docs/README.md` y avanzamos al Documento 14 (Deploy).
