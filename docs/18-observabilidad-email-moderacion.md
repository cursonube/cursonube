# Cursonube — Observabilidad, Email Transaccional y Moderación de Contenido
### Documento 18 (adenda) · Estado: 🟡 En revisión — pendiente de aprobación

---

Última ronda de auditoría antes de pasar a implementación. Tres gaps reales detectados que ningún documento anterior resolvió — se deciden acá directamente (son llamadas técnicas/operativas con una respuesta razonable dado todo lo ya aprobado, no forks de negocio) y quedan documentados para no perderlos.

## 1. Observabilidad

No decidirlo antes del lanzamiento (Documento 12: registro público sin beta cerrada) significa no enterarse de un problema en producción hasta que un usuario se queje.

- **Error tracking:** Sentry, en NestJS y en Next.js. Estándar de la industria para este stack, buen nivel gratuito, integración directa.
- **Logs:** logging estructurado (JSON), usando en el MVP el visor de logs ya incluido en Railway — sin agregar un agregador de logs dedicado (Datadog/Logtail) todavía; se suma si el volumen lo justifica (mismo criterio de "medido, no anticipado" del Documento 15).
- **Uptime monitoring:** un check simple de salud (`/health`) monitoreado por un servicio externo económico (ej. Better Uptime/UptimeRobot), con alerta por email/Slack ante caída — no requiere infraestructura propia.

## 2. Proveedor de email transaccional

**Resend.** Buena experiencia de desarrollo, nivel gratuito razonable, hecho para el mismo ecosistema TypeScript que ya se usa en todo el stack (Documento 2). Se integra detrás de una interfaz propia (`EmailProvider`) — mismo patrón ya aplicado a Video/Payment/Billing Provider — para poder cambiar de proveedor (ej. Postmark si la deliverability a mayor escala lo justifica) sin tocar el resto del sistema.

## 3. Moderación de contenido

Con registro público sin revisión previa (Documento 12), hace falta una política mínima:

- **Enforcement reactivo, no proactivo:** no hay revisión manual de cada academia nueva antes de publicarse (no está presupuestado ni tiene sentido operativo a esta escala inicial) — se apoya en (a) Términos de Servicio que prohíban explícitamente contenido ilegal/fraudulento (ya anotado como pendiente de redacción legal en el Documento 17) y (b) un mecanismo simple de "Reportar esta academia/curso" visible en el sitio público, que llega al Panel de Administración interno (Documento 10) como un caso a revisar.
- La **capacidad de actuar ya existe:** el Panel Admin ya permite suspender/reactivar una academia (Documento 10) — no hace falta construir nada nuevo, solo el mecanismo de reporte que alimenta esa cola de revisión.
- Nota: al no administrar dinero de terceros (Documento 8), Cursonube ya delega en Mercado Pago buena parte del riesgo de KYC/fraude de pagos sobre cada creador — esta política cubre específicamente moderación de **contenido**, no de pagos.

## 4. Decisiones irreversibles o costosas de revertir

Ninguna — las tres son elecciones de herramientas/proceso de bajo riesgo, reversibles sin fricción real (proveedores intercambiables detrás de interfaces ya establecidas; el proceso de moderación es una política operativa, no una decisión de esquema o de datos).

---
**Documento 18 (adenda) — sin puntos pendientes.** Si confirmás, lo marco ✅ Aprobado en `docs/README.md` y el diseño completo queda cerrado.
