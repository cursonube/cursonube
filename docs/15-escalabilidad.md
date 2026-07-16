# Cursonube — Escalabilidad
### Documento 15 de 16 · Estado: 🟡 En revisión — pendiente de aprobación

---

Este documento cierra lo que el Documento 2 dejó deliberadamente pendiente: **el plan concreto de sharding y sus umbrales**. El principio general no cambia — "medido, no anticipado" (Documento 2): no se construye nada de esto en el MVP, se define ahora el criterio objetivo para saber *cuándo* construirlo, igual que el Documento 12 dejó cualitativos los criterios de negocio para pasar de fase.

## 1. Escalado horizontal (API y worker)

La sesión vive en cookie/JWT, no en memoria del servidor (Documento 7) — el backend NestJS es **stateless**, por lo que escalar horizontalmente es agregar réplicas del mismo contenedor detrás de un balanceador, sin coordinación especial. Se configura autoscaling basado en CPU/memoria con un **tope máximo de instancias** (límite de costo explícito, no autoscaling sin techo).

## 2. Conexiones a la base de datos

Con múltiples réplicas de API + worker, hace falta un **pooler de conexiones** (PgBouncer o el pooling gestionado que ofrezca Railway) para no agotar el límite de conexiones de Postgres — práctica estándar cuando hay más de un proceso hablando con la misma base.

## 3. Cache

Además de la resolución de tenant por hostname (ya definida en el Documento 6), se cachea en Redis: el catálogo de cursos publicados por academia (lo que ve el público, cambia poco) y los Entitlements resueltos de un tenant (para no resolver el plan y sus límites en cada acción). Se invalida activamente cuando el dato subyacente cambia — nunca cache con expiración ciega sobre datos que el usuario espera ver actualizados al instante.

## 4. CDN

Resuelto por las elecciones ya tomadas: Vercel sirve el frontend con CDN/edge caching nativo; Cloudflare R2 (Documento 2) ya sirve archivos con CDN de Cloudflare integrado. No se agrega una capa de CDN adicional.

## 5. Plan concreto de sharding (lo que quedó pendiente del Documento 2)

- **Mecanismo:** hash consistente de `tenant_id` sobre el número de shards — distribución pareja de tenants entre instancias, evita puntos calientes que un particionamiento por rango (ej. por fecha de creación) sí tendría.
- **Umbral de disparo** (cualquiera de estos, sostenido, no un pico puntual): uso de CPU de la instancia de Postgres por encima del 70% en horario pico durante más de una semana; o latencia p95 de queries tenant-scoped por encima de 200ms bajo carga normal; o tamaño de la base acercándose al límite práctico del plan de Postgres contratado en Railway.
- Estos son umbrales técnicos medibles, no una proyección de negocio — se fijan ahora como criterio objetivo, y se ejecuta el sharding cuando la métrica real los cruce, no antes.

## 6. Réplicas de lectura

No se agregan en el MVP. Mismo principio que el sharding: se agregan cuando se mida que las queries de lectura (ej. el catálogo público de cursos) compiten de forma medible con las de escritura (compras, progreso) — no antes.

## 7. Multi-región

Una sola región de despliegue en el MVP, la más cercana al mercado inicial (Argentina/LatAm). Multi-región se evalúa si y cuando haya expansión geográfica real que lo justifique — no se construye por anticipado.

## 8. Igualdad de rendimiento entre planes

**Los planes de Cursonube no gatean infraestructura ni rendimiento** — ya se confirmó que solo gatean escala de negocio (profesores, alumnos, cursos, dominio propio, marca visible — Documento 1). Una academia Free no tiene peor rendimiento técnico que una Business; el rate limiting básico (Documento 6) es por IP contra abuso, no una forma encubierta de diferenciar planes.

## 9. Backups

Backups automáticos diarios + point-in-time recovery de al menos 7 días (soportado nativamente por el Postgres gestionado de Railway). El detalle de continuidad de negocio ante un desastre mayor se trata en el Documento 16 (Seguridad), para no duplicar contenido.

## 10. Decisiones irreversibles o costosas de revertir

No hay una decisión de negocio nueva en este documento — es la extensión técnica directa de la estrategia de datos ya aprobada (Documento 2, decisión A1). Los umbrales de la sección 5 son criterio de ingeniería medible, no una preferencia de negocio, por eso se fijan directamente en vez de preguntarse.

---
**Documento 15 (Escalabilidad) — sin puntos pendientes.** Si confirmás, lo marco ✅ Aprobado en `docs/README.md` y avanzamos al Documento 16 (Seguridad) — el último de los 16.
