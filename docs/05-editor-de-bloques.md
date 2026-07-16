# Cursonube — Diseño del Editor por Bloques
### Documento 5 de 16 · Estado: 🟡 En revisión — pendiente de aprobación

---

## 1. Objetivo y principio rector

Un editor **basado en bloques predefinidos**, no un constructor libre tipo Elementor. Consecuencia directa de esto: cada bloque expone únicamente las propiedades que su diseño soporta (formulario estructurado: inputs, selects, color pickers, selector de imagen) — **nunca** HTML/CSS libre. Esta restricción es la que garantiza la promesa "nunca podrán romper el diseño" del Product Book: no es una limitación a disculpar, es lo que hace posible que una academia gratuita se vea profesional sin que nadie del equipo de Cursonube la haya diseñado a mano.

## 2. Relación entre Plantilla y Bloque

Un mismo `Bloque` (ej. `hero`) tiene **una sola estructura de datos**, pero se renderiza distinto según la `Plantilla` activa de la academia. La plantilla aporta el sistema de diseño (tipografía, paleta de colores, espaciado, bordes, sombras) como tokens; el bloque aporta el contenido y la estructura. Técnicamente: un único componente de render por tipo de bloque, parametrizado por los design tokens de la plantilla activa (variables CSS) — **no** hay 5 implementaciones distintas de `HeroBlock`, una por plantilla. Esto es lo que permite que "cada plantilla tenga estilos propios pero comparta el mismo sistema de bloques" (Product Book) sin multiplicar el trabajo de mantenimiento por 5 cada vez que se ajusta un bloque.

## 3. Catálogo de bloques (MVP — catálogo cerrado)

| Bloque | Propiedades editables |
|---|---|
| **Hero** | Título, subtítulo, imagen o video de fondo, texto de botón, link de botón, alineación (izquierda/centro) |
| **Texto** | Título (opcional), cuerpo (rich text: negrita/itálica/listas/links — sin HTML libre), alineación |
| **Imagen** | Imagen, texto alternativo (accesibilidad), link opcional, ancho (completo / contenido) |
| **Video** | URL del video — usa el mismo adaptador `VideoProvider` ya definido (Documento 2/3): YouTube No Listado en MVP |
| **Cursos** | Título de sección, selección de cursos (todos los publicados / destacados manualmente), cantidad de columnas |
| **Instructor** | Selección de `AcademiaUsuario` con rol Profesor u Owner a mostrar, foto, bio corta, links a redes sociales (opcional) |
| **Testimonios** | Lista de testimonios cargados manualmente por el creador (nombre, foto, texto). Sin integración con reseñas reales de alumnos en MVP — no existe ese sistema todavía. |
| **FAQ** | Lista de pares pregunta/respuesta |
| **CTA** | Texto, texto de botón, link de botón |
| **Newsletter** | Texto descriptivo, campo de captura de email — destino de los datos capturados: ver sección 6 (pregunta abierta) |
| **Contacto** | Formulario (nombre, email, mensaje) — destino de los datos capturados: ver sección 6 (pregunta abierta) |
| **Footer** | Links de navegación, links a redes sociales, texto de copyright |

Cualquier bloque puede agregarse a cualquier página, sin restricciones artificiales por tipo de página — mantiene el sistema simple y no requiere una matriz de "qué bloque va en qué página".

## 4. Composición por defecto (para que "nunca exista pantalla vacía")

Cada página fija que el wizard crea automáticamente (Documento 1, E5) trae una composición inicial de bloques ya cargada con contenido de placeholder editable — nunca una página en blanco esperando que el usuario arme todo desde cero:

| Página | Composición por defecto |
|---|---|
| Inicio | Hero → Cursos (destacados) → Instructor → Testimonios → CTA → Footer |
| Cursos | Hero (breve) → Cursos (todos los publicados) → Footer |
| Sobre Nosotros | Hero → Texto → Instructor → Footer |
| Contacto | Texto → Contacto → Footer |
| FAQ | Texto (breve) → FAQ → Footer |
| Políticas | Texto → Footer |

Ningún bloque es obligatorio ni "no removible" — el creador puede eliminar cualquiera, incluido el Footer, si así lo decide. La composición por defecto es un punto de partida, no una restricción.

## 5. Reglas de validación y tolerancia a cambios futuros

- Cada tipo de bloque define su propio schema de propiedades (Zod) en la capa de aplicación — la base de datos solo almacena JSONB (Documento 3, decisión M3), la validación de forma ocurre siempre antes de guardar.
- **Compatibilidad hacia atrás obligatoria:** si en el futuro se agrega una propiedad nueva a un tipo de bloque existente, el renderer debe aplicar un valor por defecto para el contenido ya creado — nunca se exige una migración de contenido de academias reales solo porque se agregó un campo opcional a un bloque.
- Extensibilidad: un tipo de bloque nuevo se agrega registrando su schema + su componente de render en un **registro de bloques** central — no requiere tocar los bloques existentes ni el motor de renderizado.

## 6. Destino de los datos capturados por Newsletter y Contacto

**Confirmado:** cada envío (Newsletter o Contacto) se persiste en una entidad `Lead` propia de Cursonube (ver Documento 3, sección 2.5 actualizada), scoped a `tenant_id`, visible en una sección simple del panel del creador, y dispara además un email de notificación al Owner. Sin integración con proveedores externos de email marketing en MVP — se evalúa como posible feature de V1.1/V2 si hay demanda real.

## 7. Decisiones irreversibles o costosas de revertir

| # | Decisión | Por qué es costosa de revertir | Estado |
|---|---|---|---|
| E1 | Destino de los datos capturados por los bloques Newsletter y Contacto: entidad `Lead` propia + notificación por email al Owner, sin integración externa en MVP. | Sin definirlo, esos datos no tenían dónde persistirse. | ✅ Confirmado. |
| E2 | Schema de bloque tolerante a campos faltantes — nunca se migra contenido existente al cambiar un tipo de bloque. | Sin esto, cualquier evolución futura del editor rompe el contenido ya creado por academias reales. | ✅ Confirmado, sin alternativa razonable. |
| E3 | Ningún bloque es obligatorio ni no-removible. | Reafirma la simplicidad ya acordada; agregar bloques obligatorios después sería una restricción nueva sobre contenido que los usuarios ya armaron con libertad total. | ✅ Confirmado. |

---
**Documento 5 (Editor por Bloques) — sin puntos pendientes.** Si confirmás, lo marco ✅ Aprobado en `docs/README.md` y avanzamos al Documento 6 (Sistema Multi-Tenant). También agrego la entidad `Lead` al Modelo de Datos (Documento 3), ya aprobado, como una adenda menor.
