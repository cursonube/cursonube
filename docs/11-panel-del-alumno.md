# Cursonube — Panel del Alumno
### Documento 11 de 16 · Estado: 🟡 En revisión — pendiente de aprobación

---

Arquitectura de información del panel del alumno (`academia.cursonube.com/panel`, Documento 7). La mayor parte del comportamiento ya quedó definida en documentos anteriores (Documentos 3, 4, 7, 9); este documento organiza la navegación y resuelve un puñado de aclaraciones menores por extensión directa de principios ya aprobados — no introduce decisiones de negocio nuevas.

## 1. Navegación general

| Sección | Contenido |
|---|---|
| **Mis Cursos** | Cursos inscriptos, con progreso y acceso directo a "continuar donde lo dejaste" (Documento 4, Flujo 8) |
| **Un curso** (al entrar) | Sidebar de módulos/clases con estado completada/pendiente, reproductor de la clase activa, adjuntos descargables, botón "Marcar como completada" cuando aplica (Documento 9) |
| **Certificados** | Certificados obtenidos, descarga en PDF |
| **Mis Compras** | Historial simple de pagos realizados en esta academia (curso, monto, fecha) — funciona como comprobante de compra sin necesidad de un email de recibo separado; el email de bienvenida del guest-checkout (Documento 1, D6) ya cubre esa función |
| **Mi Cuenta** | Nombre, email (cambiarlo requiere verificación por link enviado al nuevo email antes de aplicarse, evita que alguien tome un email ajeno), cambio de contraseña |

Este panel es **específico de una academia**. Es la consecuencia directa de la identidad de alumno aislada por tenant (Product Book): si la misma persona compró cursos en dos academias distintas, tiene dos paneles y dos logins completamente separados — no hay una vista unificada cross-academia, coherente con "Cursonube no es un marketplace".

## 2. Aclaraciones por extensión de principios ya aprobados

Ninguna de estas es una decisión nueva — son la aplicación directa de reglas ya validadas en documentos anteriores a situaciones concretas del panel del alumno:

- **Un curso al que se le revoca el acceso** (reembolso, desactivación manual por el creador) no desaparece silenciosamente del listado: se muestra con estado "Acceso revocado" y un motivo genérico ("Contactá a la academia para más información"), evitando confusión y tickets de soporte por algo que "desapareció sin explicación".
- **Verificación de certificado por QR** no está disponible todavía en el panel (el código de verificación ya se genera desde el MVP, pero la página pública de verificación es V1.1 — Documento 1, F4). El botón de descarga del PDF sí funciona desde el MVP.
- **Un curso que era gratuito y el creador lo pasa a pago después:** el alumno que ya se había inscripto de forma gratuita mantiene su acceso gratis para siempre — mismo principio de "las decisiones del creador nunca revocan retroactivamente algo que el alumno ya tenía" (Documento 9, C2).
- **"Explorar más cursos"** dentro de Mis Cursos es simplemente un link al catálogo público de la academia (`/cursos`) — no es una funcionalidad nueva, es navegación sobre contenido que ya existe.
- El borrado real de la cuenta de un alumno (derecho al olvido) se trata en el Documento 16 (Seguridad), no en este documento de UI.

## 3. Decisiones irreversibles o costosas de revertir

Ninguna. Todo lo definido en este documento es organización de UI o extensión directa de reglas ya aprobadas en documentos anteriores — no hay un fork de negocio o técnico nuevo que requiera tu validación acá.

---
**Documento 11 (Panel del Alumno) — sin puntos pendientes.** Si confirmás, lo marco ✅ Aprobado en `docs/README.md` y avanzamos al Documento 12 (Roadmap).
