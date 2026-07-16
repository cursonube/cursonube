# Cursonube — Sistema de Pagos
### Documento 8 de 16 · Estado: 🟡 En revisión — pendiente de aprobación

---

Este documento cubre la implementación de las **dos integraciones de pago completamente independientes** ya identificadas desde el Product Book (Documento 1, Pushback #2) — no se reabren las decisiones de negocio ya tomadas, se detalla su funcionamiento técnico.

## 1. Las dos integraciones (recordatorio para no confundirlas)

| | Alumno → Creador | Cursonube → Academia |
|---|---|---|
| Qué cobra | El curso, al alumno | La suscripción al plan de Cursonube |
| Cuenta de Mercado Pago usada | La del **creador** (conectada vía OAuth) | La **de Cursonube** |
| Producto de Mercado Pago | Checkout Pro (pago único) | Suscripciones (preapproval, cobro recurrente) |
| A dónde va el dinero | 100% al creador, nunca pasa por Cursonube | A Cursonube |

## 2. Alumno → Creador: conexión de la cuenta del creador

1. El creador conecta su Mercado Pago desde el panel (`CuentaPagoCreador`, Documento 3) vía **OAuth de Mercado Pago** — el flujo estándar de autorización, no se le pide nunca su usuario/contraseña de Mercado Pago a Cursonube.
2. Cursonube guarda el `access_token` resultante, cifrado en reposo (detalle de cifrado/rotación en el Documento 16).
3. **Decisión deliberada:** al crear una preferencia de pago (`Checkout Pro`), Cursonube usa directamente el `access_token` del creador para crear una preferencia **regular**, sin usar el mecanismo de `marketplace_fee` que Mercado Pago ofrece para plataformas. Esto no es un detalle menor — es lo que hace que "Cursonube nunca administra dinero de terceros" sea literalmente cierto a nivel técnico, no solo una promesa: el sistema ni siquiera tiene habilitado el mecanismo para tomar una comisión, no es que la configuremos en 0%.
4. Si el creador **no tiene una cuenta de Mercado Pago conectada y activa**, sus cursos de tipo `pago_unico` no pueden mostrarse como comprables — se oculta el botón "Comprar" con un aviso, en vez de dejar que un alumno llegue al checkout y falle ahí.

## 3. Alumno → Creador: checkout y confirmación

1. Alumno hace click en "Comprar" → Cursonube crea una preferencia en Mercado Pago (a nombre del creador) → redirige al Checkout Pro de Mercado Pago.
2. Mercado Pago redirige de vuelta a Cursonube con una URL de éxito/fallo/pendiente — **esta redirección nunca es la fuente de verdad** (puede manipularse o no completarse). Es solo lo que ve el alumno mientras el sistema espera confirmación real.
3. La fuente de verdad es el **webhook** de Mercado Pago notificando el estado real del pago. Solo cuando el webhook confirma `aprobado` se crea/activa la `Inscripcion` y se dispara el flujo de guest-checkout (Documento 1, D6).
4. **Curso gratuito:** no pasa por Mercado Pago en absoluto y **no genera un registro `Pago`** (no hay transacción financiera real que registrar) — la `Inscripcion` se crea directamente en estado `activa`.

## 4. Procesamiento de webhooks (aplica a ambas integraciones)

- Todo webhook se **verifica** (firma/origen de Mercado Pago) antes de procesarse — nunca se confía en un payload sin validar que realmente vino de Mercado Pago.
- El procesamiento es **idempotente**: un mismo evento puede llegar duplicado (comportamiento normal de webhooks) y no debe duplicar su efecto — ej. no debe crear dos `Inscripcion` por el mismo pago. Se garantiza guardando `external_payment_id` como clave de deduplicación.
- El procesamiento ocurre en una cola de background (Redis + BullMQ, ya decidido en el Documento 2), con reintentos automáticos si falla — nunca se procesa un webhook de forma síncrona bloqueando la respuesta HTTP a Mercado Pago.

## 5. Reembolsos

Dos cosas distintas que no hay que confundir:

- **Enterarse de un reembolso:** Cursonube **siempre** escucha el webhook de reembolso, sin importar dónde se haya originado. Al confirmarse, `Pago.estado` pasa a `reembolsado` y la `Inscripcion` asociada se cancela automáticamente — revocando el acceso del alumno al curso. Esto es necesario siempre, no es opcional: sin esto, un curso reembolsado seguiría dando acceso indefinidamente.
- **Iniciar un reembolso desde el panel de Cursonube** (un botón que llame a la API de reembolso de Mercado Pago en nombre del creador) es una comodidad adicional, no un requisito — el creador puede reembolsar directamente desde su propia cuenta de Mercado Pago igualmente, y Cursonube se entera por el webhook de todas formas.

## 6. Cursonube → Academia: suscripción y dunning

1. Al elegir/cambiar de plan pago, se crea/actualiza una suscripción de tipo `preapproval` en Mercado Pago Suscripciones, asociada a `SuscripcionAcademia` (Documento 3).
2. Mercado Pago gestiona los reintentos automáticos de cobro fallido de la suscripción.
3. Cursonube escucha el webhook de resultado de cada cobro de la suscripción: pago exitoso mantiene `SuscripcionAcademia.estado = activa`; pago fallido tras agotar reintentos inicia el período de gracia ya definido en el Documento 4 (U1), y al vencer sin regularizar, bloquea el panel de gestión (Documento 6, sección 4).

## 7. Nota operativa fuera del alcance de este documento (no bloqueante, pero real)

Cobrar una suscripción a academias en Argentina probablemente implica una obligación de **facturación electrónica (AFIP)** sobre esos cobros. Esto es una cuestión legal/contable, no de arquitectura de software — no se resuelve en este documento, pero se deja registrado como pendiente a validar con un contador/gestoría antes del lanzamiento comercial, para saber si Mercado Pago Suscripciones ya cubre el comprobante fiscal o si hace falta una integración adicional (ej. un servicio de facturación electrónica).

## 8. Decisiones irreversibles o costosas de revertir

| # | Decisión | Por qué es costosa de revertir | Estado |
|---|---|---|---|
| PG1 | Sin mecanismo de `marketplace_fee` habilitado — Cursonube usa el `access_token` del creador para crear preferencias regulares, nunca toma comisión técnica sobre la venta. | Habilitar esto después requeriría reconectar/re-autorizar la cuenta de cada creador con permisos distintos, y contradice una promesa ya comunicada como pilar del modelo de negocio. | ✅ Confirmado — implementación directa de una decisión de negocio ya tomada. |
| PG2 | Webhook (nunca el redirect del browser) es la única fuente de verdad sobre el estado de un pago. | Es la única forma correcta de manejar pagos online — no es una alternativa real, es una corrección de un error de diseño que sería grave si se hiciera al revés. | ✅ Confirmado, sin alternativa razonable. |
| PG3 | **Reembolsos:** el MVP solo escucha el webhook de reembolso (para revocar acceso automáticamente); **no** incluye un botón de "iniciar reembolso" dentro del panel de Cursonube — el creador reembolsa directamente desde su propia cuenta de Mercado Pago. | Construirlo ahora es esfuerzo adicional no solicitado; no construirlo y necesitarlo después es agregar un botón que llama a una API ya integrada — bajo costo de agregar más adelante. | ✅ Confirmado. |

---
**Documento 8 (Sistema de Pagos) — sin puntos pendientes.** Si confirmás, lo marco ✅ Aprobado en `docs/README.md` y avanzamos al Documento 9 (Sistema de Cursos). Queda registrada la nota operativa de facturación electrónica (sección 7) para validar con contador/gestoría antes del lanzamiento.
