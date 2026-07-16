# Cursonube — Panel del Creador
### Documento 10 de 16 · Estado: 🟡 En revisión — pendiente de aprobación

---

Este documento define la arquitectura de información del panel de gestión (`academia.cursonube.com/admin`, Documento 7) — qué secciones existen y qué muestra cada una. La mayoría del comportamiento detrás de cada sección ya quedó definido en documentos anteriores; acá se organiza en una navegación coherente.

## 1. Navegación general

| Sección | Visible para | Contenido |
|---|---|---|
| **Inicio** | Todos los roles de gestión | Checklist de activación (Documento 1) + métricas clave + actividad reciente (sección 2) |
| **Cursos** | Owner, Admin, Profesor (los propios) | Listado, creación y edición (Documento 9) |
| **Sitio** | Owner, Admin, Editor | Editor de bloques por página (Documento 5) |
| **Alumnos** | Owner, Admin, Profesor (solo de sus cursos) | Listado, detalle, progreso (sección 3) |
| **Contactos** | Owner, Admin | Leads capturados por Newsletter/Contacto (Documento 5) |
| **Equipo** | Owner, Admin | Gestión de `AcademiaUsuario`, invitaciones (Documento 7) |
| **Plan y Facturación** | Solo Owner | Plan actual, upgrade/downgrade, historial de facturas (Documentos 4 y 8) |
| **Configuración** | Owner, Admin | Branding, subdominio, dominio propio, conexión de Mercado Pago |

El panel es una aplicación web responsive — usable desde el navegador de un celular para consultar ventas o alumnos rápidamente. Esto **no** es la "aplicación móvil" excluida de V1 (Product Book): es el mismo panel web, sin instalación, simplemente con un diseño que no se rompe en pantallas chicas.

## 2. Inicio (dashboard)

- **Checklist de activación** (Documento 1): "Agregá tu primer curso", "Conectá tu Mercado Pago", "Invitá a tu equipo" — desaparece a medida que se completa cada paso.
- **Métricas clave:** ventas del mes (derivadas de `Pago`, aunque el dinero nunca pase por Cursonube — el registro del pago sí existe, Documento 8), alumnos nuevos del mes, cursos publicados, tasa de finalización promedio.
- **Actividad reciente:** un feed simple de los últimos eventos (nueva venta, nuevo alumno, nuevo Lead) — construido sobre datos ya existentes (`Pago`, `Inscripcion`, `Lead`), sin infraestructura nueva.

## 3. Alumnos

Listado global (o filtrado por curso) de `Alumno` con: nombre, email, curso(s) en los que está inscripto, progreso, fecha de inscripción. Detalle de un alumno muestra su historial de pagos y certificados obtenidos. Owner/Admin pueden desactivar el acceso de un alumno puntual (revoca su `Inscripcion`) — casos de soporte o sospecha de fraude. El borrado real de datos personales (derecho al olvido) se trata en el Documento 16 (Seguridad), no acá.

## 4. Qué no incluye el MVP del panel

- Exportación de datos (CSV, etc.) — no solicitado, candidato de V1.1 si hay demanda real.
- Búsqueda global dentro del panel — el volumen de datos de una academia típica en MVP no lo justifica todavía.

## 5. Decisiones irreversibles o costosas de revertir

Ninguna decisión de este documento es técnicamente difícil de revertir (es organización de UI sobre datos y reglas ya definidas) — es, en su mayoría, una decisión de **alcance del MVP** más que de arquitectura. Se documenta igual porque define cuánto esfuerzo lleva construir el panel completo antes de lanzar:

| # | Decisión | Por qué vale la pena decidirlo ahora | Estado |
|---|---|---|---|
| N1 | Sin centro de notificaciones in-app en el MVP. Cada evento importante ya dispara email + aparece en el feed de "Actividad reciente" del dashboard. | Construir un centro de notificaciones in-app implica infraestructura nueva (estado de leído/no leído, posible tiempo real) no solicitada en el brief. | ✅ Confirmado. |

---
**Documento 10 (Panel del Creador) — sin puntos pendientes.** Si confirmás, lo marco ✅ Aprobado en `docs/README.md` y avanzamos al Documento 11 (Panel del Alumno).
