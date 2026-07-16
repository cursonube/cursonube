# Cursonube — Sistema de Cursos
### Documento 9 de 16 · Estado: 🟡 En revisión — pendiente de aprobación

---

Este documento detalla el comportamiento del módulo Course Catalog (Documento 2) sobre la estructura ya definida en el Modelo de Datos (Documento 3): `Curso → Módulo → Clase → Adjunto`.

## 1. Ciclo de vida del curso

- **Borrador → Publicado:** requiere al menos un módulo con una clase para poder publicarse — evita que un alumno pague por un curso sin contenido real. Solo Owner/Administrador/Profesor pueden publicar (Documento 7; Editor no puede).
- **Publicado → Despublicado:** un curso puede volver a borrador en cualquier momento. **Los alumnos ya inscriptos no pierden acceso** — solo desaparece del catálogo público para nuevas compras. Es el mismo principio ya validado dos veces en este proyecto (impago de la academia no corta acceso de alumnos ya pagos, Documento 4 U1; certificado sigue siendo válido aunque el creador borre el curso, Documento 3): **las decisiones del creador nunca revocan retroactivamente algo que un alumno ya pagó.**

## 2. Edición de contenido

- Jerarquía y adjuntos: sin cambios respecto al Modelo de Datos (Documento 3).
- **Validación del link de video:** al pegar un link de YouTube No Listado, el sistema lo valida contra la oEmbed API de YouTube antes de guardar (confirma que el video existe y es accesible) — evita clases "rotas" desde el momento en que se cargan.
- **Duración estimada:** se obtiene automáticamente de la oEmbed API cuando es posible, con opción de sobreescritura manual — reduce carga de trabajo del creador sin quitarle control.

## 3. Múltiples instructores por curso

Cuando un curso tiene más de un instructor asignado (`CursoInstructor`), todos tienen el **mismo nivel de permisos** sobre ese curso puntual — no existe un "instructor principal" con más poder que otro. Simplifica el modelo y coincide con el alcance ya definido en el Documento 7 (Profesor gestiona "sus propios cursos").

## 4. Progreso del alumno

- El progreso se calcula sobre `ProgresoClase` (Documento 3): clases completadas / total de clases **activas actualmente** en el curso.
- Clases con video: se marcan completadas automáticamente al evento `ended` del reproductor, con botón manual de respaldo (Documento 4, Flujo 7).
- Clases sin video (solo texto/PDF/links): **únicamente** se marcan completadas de forma manual por el alumno — no hay señal automática posible sin un video que reproducir hasta el final.
- No existen "clases opcionales" que queden fuera del cálculo — no hay evidencia en el brief de que se necesite esa distinción; se puede incorporar en una versión futura si surge demanda real, no se construye de antemano.

## 5. Certificación

- Se dispara automáticamente (`CourseCompletedEvent`) al llegar al 100% de clases completadas (Documento 4, Flujo 7).
- El PDF generado usa como snapshot: nombre del alumno, nombre del curso, nombre de la academia, fecha de emisión — estos datos quedan fijos en el PDF ya generado, sin importar cambios posteriores al curso o a la academia (mismo principio de "congelar en el momento" ya usado para precios).

## 6. Casos borde de integridad de contenido

- **Borrado de una clase/módulo con progreso de alumnos ya registrado:** aplica soft-delete (extensión directa de la decisión M1 del Documento 3, que ya cubre `Curso` con inscripciones) — nunca se borra físicamente una clase que algún alumno ya completó, para no perder el historial de `ProgresoClase`.
- **Riesgo menor identificado:** como el % de progreso se calcula sobre clases *activas actualmente*, un creador podría en teoría eliminar clases pendientes para que un alumno "complete" el curso más fácil. Es un escenario de baja probabilidad (el creador perjudicaría la calidad percibida de su propio curso, no hay incentivo económico real) y de bajo impacto (no compromete datos de otros tenants ni la integridad del sistema) — se documenta como riesgo conocido y aceptado, no se construye una solución de snapshot histórico de contenido para mitigarlo en el MVP.

## 7. Qué no se modela en este documento

- Clases opcionales, cupones/descuentos, preview de curso sin publicar compartible con terceros, drip content — ninguno mencionado en el Product Book; no se asumen.
- Suscripciones/membresías del creador a sus alumnos — V1.1 (ya definido).

## 8. Decisiones irreversibles o costosas de revertir

| # | Decisión | Por qué es costosa de revertir | Estado |
|---|---|---|---|
| C1 | Un certificado ya emitido sigue siendo válido para siempre, sin importar contenido nuevo agregado al curso después — snapshot al momento de completarlo. | Definirlo distinto más adelante obligaría a decidir retroactivamente si certificados ya emitidos "valen menos" — un problema de confianza con alumnos que ya lo recibieron. | ✅ Confirmado. |
| C2 | Despublicar un curso nunca revoca el acceso de alumnos ya inscriptos. | Es una extensión directa de un principio ya validado dos veces en el proyecto; revertirlo rompería esa consistencia y la confianza que ya se construyó sobre esa regla. | ✅ Confirmado. |
| C3 | Requisito mínimo de al menos una clase para poder publicar un curso. | Bajo costo de mantener, protege la reputación de la plataforma frente a cursos vacíos vendibles. | ✅ Confirmado. |

---
**Documento 9 (Sistema de Cursos) — sin puntos pendientes.** Si confirmás, lo marco ✅ Aprobado en `docs/README.md` y avanzamos al Documento 10 (Panel del Creador).
