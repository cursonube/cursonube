# Cursonube — Seguridad
### Documento 16 de 16 · Estado: 🟡 En revisión — pendiente de aprobación

---

Último documento de la serie. Consolida todo lo que quedó explícitamente diferido hasta acá (cifrado de credenciales, rate limiting detallado, derecho al olvido) y agrega lo que un documento de seguridad necesita cubrir que ningún otro documento tocó.

## 1. Modelo de amenazas (resumen)

| Actor | Riesgo principal |
|---|---|
| Atacante externo | Acceso a datos de un tenant ajeno; fuerza bruta de login; SSRF vía links pegados por usuarios |
| Creador malicioso o negligente | Contenido con XSS en su propia landing (afecta a sus visitantes) |
| Alumno malicioso | Intentar acceder a cursos sin pagar; manipular su propio progreso |
| Staff de Cursonube comprometido | Acceso indebido a datos de cualquier tenant (mitigado con 2FA obligatorio, Documento 7) |
| Falla de infraestructura | Pérdida de datos o downtime prolongado |

## 2. Cifrado en tránsito y en reposo

- **En tránsito:** TLS en todo el sistema, ya cubierto por Vercel y Railway por defecto (Documento 14) — sin excepciones.
- **Contraseñas:** hasheadas con Argon2 (o bcrypt), nunca en texto plano, en las tres audiencias (`CursonubeStaff`, `AcademiaUsuario`, `Alumno`).
- **`CuentaPagoCreador.access_token_encriptado`** (Documento 3): cifrado con AES-256-GCM, con la clave de cifrado gestionada en el secrets manager del proveedor de hosting (no en variables de entorno planas del repo), rotable sin necesitar re-cifrar todo el histórico (usando un esquema de versión de clave).

## 3. Rate limiting concreto

Sobre la base ya fijada en el Documento 6 (por IP, en endpoints públicos sensibles), umbrales concretos: login (5 intentos cada 15 minutos por combinación IP+cuenta), reset de contraseña (3 cada hora por cuenta), captura de Leads (10 por IP cada hora, contra spam), checkout (limitado por IP para dificultar scripts de compra automatizada). Implementado sobre Redis (ya disponible en la arquitectura).

## 4. Sanitización de contenido (XSS)

El bloque **Texto** del editor (Documento 5) acepta rich text (negrita, listas, links) — **nunca** HTML libre. Todo contenido se sanitiza contra una whitelist estricta de tags/atributos permitidos antes de guardarse y antes de renderizarse, para que un creador (malicioso o con una cuenta comprometida) no pueda inyectar scripts en su propia landing que afecten a sus propios visitantes.

## 5. SSRF en validación de links externos

La validación de links de video contra la oEmbed API (Documento 9) y cualquier otra validación de URL externa se restringe a una **whitelist de dominios permitidos** (`youtube.com`, `youtu.be` en MVP) — el servidor nunca hace fetch de una URL arbitraria pegada por un usuario, para evitar que se use como vector de acceso a recursos internos de la infraestructura.

## 6. Gestión de secretos

Todas las claves y credenciales (JWT signing secret, clave de cifrado de `access_token`, credenciales de Mercado Pago de Cursonube, credenciales de base de datos) viven en el secrets manager del proveedor de hosting — nunca en el repositorio, nunca en variables de entorno versionadas. Rotación periódica programada de los secretos más sensibles (JWT signing secret, clave de cifrado).

## 7. Aislamiento multi-tenant

Sin cambios respecto al Documento 6: doble barrera (aplicación + Row-Level Security de Postgres). Este documento no repite ese diseño, solo confirma que es, en los hechos, el control de seguridad más importante de todo el sistema — una falla acá es la que más daño reputacional causaría.

## 8. Continuidad de negocio (derivado del Documento 15)

Con backups diarios + point-in-time recovery de 7 días ya decididos (Documento 15), el objetivo de recuperación razonable para esta etapa del proyecto es: **RPO de 24 horas** (como máximo se pierde lo ocurrido desde el último backup) y **RTO de pocas horas** (restaurar desde backup + redeploy). No se justifica invertir en failover activo-activo multi-región en esta etapa — sería sobreingeniería frente al riesgo real actual.

## 9. Recomendación: revisión de seguridad antes de abrir el registro público

El Documento 12 confirmó lanzamiento con **registro público abierto desde el día 1, sin beta cerrada** — todo el peso de la calidad y seguridad pre-lanzamiento recae en el equipo interno, sin un grupo piloto que absorba los primeros incidentes. Dado que el sistema procesa pagos reales desde el primer usuario, recomiendo — no como alternativa opcional, sino como práctica mínima responsable — al menos una revisión de seguridad (automatizada con herramientas de análisis estático + una revisión manual dirigida al aislamiento multi-tenant y al flujo de pagos) antes de abrir el registro al público, no necesariamente un pentest externo completo si el presupuesto no lo permite todavía.

## 10. Derecho al olvido y retención de datos

Esto quedó diferido desde los Documentos 10 y 11. Había una tensión real entre el soft-delete obligatorio ya exigido en `Pago`, `Certificado` e `Inscripcion` (Documento 3, M1) por motivos contables/legales, y el derecho de un alumno a pedir la eliminación de sus datos personales (Ley 25.326 de Protección de Datos Personales en Argentina, de espíritu similar al GDPR).

**Confirmado: anonimización, no borrado físico.** Al recibir un pedido de baja, se reemplazan los datos personales identificables (nombre → "Usuario eliminado", email → hash irreversible) pero se preservan los registros transaccionales (`Pago`, `Certificado`, `Inscripcion`) sin vínculo a datos reales — cumple el pedido del alumno sin violar la obligación de retención contable/legal. Mismo patrón que Stripe/Shopify usan para esta tensión exacta.

## 11. Decisiones irreversibles o costosas de revertir

| # | Decisión | Por qué es costosa de revertir | Estado |
|---|---|---|---|
| S1 | Anonimización (no borrado físico) como respuesta a pedidos de derecho al olvido, preservando registros transaccionales sin vínculo a datos personales reales. | Definirlo tarde, con pedidos de baja reales ya recibidos y sin proceso, obligaría a decidir bajo presión y con riesgo de incumplimiento legal (Ley 25.326) o de perder registros contables obligatorios. | ✅ Confirmado. |

---
**Documento 16 (Seguridad) — sin puntos pendientes.** Si confirmás, lo marco ✅ Aprobado en `docs/README.md`.

## Los 16 documentos quedan completos y aprobados.
