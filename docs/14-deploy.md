# Cursonube — Deploy
### Documento 14 de 16 · Estado: 🟡 En revisión — pendiente de aprobación

---

Este documento resuelve dos cosas que quedaron **deliberadamente diferidas** hasta acá: el proveedor concreto de hosting (Documento 2 solo fijó el requisito: contenedores estándar, sin Kubernetes, plataforma gestionada) y el mecanismo de verificación/SSL de dominio propio (Documento 6, sección 5).

## 1. Topología de despliegue

- **Frontend Next.js → Vercel.** Resuelve nativamente el wildcard DNS y el dominio propio de cada academia (verificación + SSL automático vía su API de dominios), sin que Cursonube opere infraestructura de certificados.
- **Backend NestJS (API + worker), PostgreSQL, Redis → Railway.** Contenedores estándar, sin Kubernetes, dashboard simple, buen costo inicial.

## 2. Wildcard DNS y SSL

`*.cursonube.com` se configura como dominio wildcard sobre el proveedor del frontend — cubre automáticamente cada subdominio de academia nueva sin ninguna acción manual por tenant (coherente con "no se crea infraestructura por cliente").

## 3. Dominio propio (custom domain) — mecanismo concreto

Con el frontend en Vercel: cuando una academia con plan habilitado (Documento 1, sección 6.1) agrega su dominio propio, Cursonube usa la API de dominios del proveedor para (a) dar las instrucciones de verificación (registro CNAME/TXT que el creador agrega en su propio proveedor de DNS) y (b) una vez verificado, la emisión y renovación del certificado SSL es automática — sin que Cursonube tenga que operar su propia infraestructura de ACME. Esto es lo que Document 6 dejó pendiente de esta elección de hosting.

## 4. CI/CD

GitHub Actions: en cada push a `main`, corre lint + type-check + tests como gate obligatorio antes de cualquier deploy — un fallo bloquea el deploy, nunca se despliega código que no pasó sus propios checks.

## 5. Migraciones en el pipeline

Las migraciones de Prisma corren como un paso del pipeline **antes** de levantar la nueva versión de la aplicación — nunca la aplicación arranca con un esquema desincronizado. Sigue la convención expand-contract ya fijada en el Documento 6 (columnas nuevas siempre nullable primero, backfill, constraint estricto en un deploy posterior).

## 6. Entornos

**Staging obligatorio** antes de producción — todo cambio se prueba en un entorno idéntico a producción (misma topología, datos de prueba) antes de llegar a academias reales. Esto pesa más de lo habitual en este proyecto puntual: el Documento 12 (Roadmap) ya definió lanzamiento con **registro público abierto desde el día 1, sin beta cerrada** — sin un grupo piloto externo que absorba los primeros bugs, staging es la única red de seguridad real antes de que un problema llegue a un usuario de verdad.

## 7. Procesos del backend

El backend NestJS corre como **dos procesos separados** desplegados desde la misma imagen: el servidor HTTP (API) y un **worker** que consume la cola de BullMQ (generación de certificados, envío de emails, procesamiento de webhooks — Documento 2, Documento 8). Separarlos evita que un job pesado (ej. generar un PDF) bloquee la capacidad de responder requests HTTP normales, y permite escalar cada uno de forma independiente si hace falta más adelante.

## 8. Decisiones irreversibles o costosas de revertir

| # | Decisión | Por qué es costosa de revertir | Estado |
|---|---|---|---|
| D1 | Frontend en Vercel, backend/DB/cache en Railway. | Migrar de proveedor de hosting con tenants reales en producción implica downtime potencial, reconfiguración de DNS, y posible necesidad de re-verificar dominios propios ya conectados por creadores. | ✅ Confirmado. |

---
**Documento 14 (Deploy) — sin puntos pendientes.** Si confirmás, lo marco ✅ Aprobado en `docs/README.md` y avanzamos al Documento 15 (Escalabilidad).
