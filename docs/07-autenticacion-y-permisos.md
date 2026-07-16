# Cursonube — Autenticación y Permisos
### Documento 7 de 16 · Estado: 🟡 En revisión — pendiente de aprobación

---

## 1. Mecanismo técnico de sesión

Heredado del Documento 2: auth propia (sin IDaaS externo), NestJS (API) separado de Next.js (frontend). Definición concreta:

- **Cookie de sesión `httpOnly` + `Secure`, scoped al hostname exacto de la request** (no a `.cursonube.com` como dominio padre). Esto es deliberado: cuando una academia tenga dominio propio (`academia.com`, V1.1), la sesión de sus alumnos debe funcionar en ese dominio específico — atarla a un dominio padre compartido no tendría sentido y además contradice la identidad aislada por tenant ya decidida.
- Dentro de esa cookie viaja un **JWT de corta duración** (ej. 15 minutos) + un **refresh token** de sesión más larga, patrón estándar de NestJS + Passport. Se descarta JWT en `localStorage`: es vulnerable a robo por XSS, mientras que una cookie `httpOnly` no es accesible desde JavaScript del lado del cliente.
- El **panel de gestión del creador vive bajo el mismo subdominio de la academia** (ej. `academia.cursonube.com/admin`), no en un dominio centralizado separado — consecuencia directa de la decisión de la sección 3 (una cuenta de creador pertenece a una sola academia).

## 2. Tres audiencias de autenticación (heredado del Documento 3)

| Audiencia | Tabla | Login |
|---|---|---|
| Staff de Cursonube | `CursonubeStaff` | Dominio interno de administración, no expuesto a academias/alumnos |
| Creador (Owner/Administrador/Profesor/Editor) | `AcademiaUsuario` | `academia.cursonube.com/admin/login` |
| Alumno | `Alumno` | `academia.cursonube.com/login` |

Cada audiencia tiene su propio flujo de login sobre el mismo mecanismo técnico (sección 1) — no se comparten sesiones entre audiencias ni entre tenants.

## 3. ¿Una cuenta de creador puede gestionar más de una academia?

**Confirmado: una cuenta = una academia**, mismo patrón que `Alumno`. Cada `AcademiaUsuario` pertenece a un único `tenant_id`. Si una persona quiere una segunda academia, crea una cuenta nueva (mismo email posible, tenant distinto) y alterna con logins separados. No existe selector de academias ni panel centralizado en el MVP.

## 4. Matriz de roles y permisos — propuesta

| Acción | Owner | Administrador | Profesor | Editor |
|---|---|---|---|---|
| Configuración de la academia (branding, plantilla) | ✅ | ✅ | ❌ | ❌ |
| Plan y facturación con Cursonube | ✅ | ❌ (exclusivo Owner) | ❌ | ❌ |
| Invitar/remover Administrador | ✅ | ❌ | ❌ | ❌ |
| Invitar/remover Profesor/Editor | ✅ | ✅ | ❌ | ❌ |
| Crear/editar/publicar cursos propios | ✅ | ✅ | ✅ | ❌ |
| Editar contenido de páginas (bloques) | ✅ | ✅ | ❌ | ✅ (borrador) |
| **Publicar cambios de página al sitio público** | ✅ | ✅ | ❌ | ❌ (solo deja borradores) |
| Ver alumnos y ventas | ✅ | ✅ | Solo de sus propios cursos | ❌ |
| Eliminar la academia | ✅ | ❌ | ❌ | ❌ |

`Alumno` no tiene ningún permiso sobre el panel de gestión — solo accede a su propio panel (Mis cursos, progreso, certificados).

Técnicamente, esta matriz se implementa como **guards declarativos de NestJS** (`@RequirePermission('cursos.publicar')`) que consultan una matriz Rol→Permiso centralizada — nunca condicionales `if (rol === 'owner')` dispersos por el código, por la misma razón ya aplicada a Entitlements (Documento 1, D3): cambiar qué puede hacer un rol debe ser un cambio en un solo lugar, no una búsqueda por todo el código.

## 5. Invitaciones y recuperación de contraseña

- Invitación de Profesor/Editor: email con link de activación de un solo uso, con expiración (ej. 7 días), define su contraseña al aceptar (Documento 4, Flujo 4).
- Recuperación de contraseña (todas las audiencias): flujo estándar de link por email de un solo uso con expiración corta.

## 6. Autenticación reforzada para Staff de Cursonube

Dado el nivel de privilegio de `CursonubeStaff` (acceso potencial a datos de cualquier tenant vía el Panel Admin), se exige **2FA obligatorio** para esta audiencia desde el MVP — el costo es mínimo (son pocas cuentas internas, no cientos de miles) y el riesgo de una cuenta de staff comprometida es el más alto de todo el sistema. No se exige 2FA a creadores ni alumnos en el MVP (fricción no justificada todavía para esas audiencias; queda como candidato de V1.1/V2 si hay demanda o incidentes).

## 7. Decisiones irreversibles o costosas de revertir

| # | Decisión | Por qué es costosa de revertir | Estado |
|---|---|---|---|
| P1 | Una cuenta de creador gestiona una sola academia (mismo patrón que Alumno) — no hay selector multi-academia en el MVP. | Elegirlo ahora y necesitar "varias academias por cuenta" después implicaría desacoplar `AcademiaUsuario` de un tenant único y migrar cuentas ya creadas. | ✅ Confirmado. |
| P2 | Plan y facturación con Cursonube es exclusivo del rol Owner — Administrador no tiene acceso. | Cambiarlo después de tener Administradores reales invitados implica revocar o ampliar acceso a información financiera sensible sobre cuentas ya activas. | ✅ Confirmado. |
| P3 | El rol Editor solo deja borradores — nunca publica directamente al sitio público. | Cambiarlo después implica revisar contenido ya publicado por Editores bajo la política anterior. | ✅ Confirmado. |
| P4 | Matriz de permisos implementada como guards declarativos contra una tabla Rol→Permiso centralizada, nunca condicionales dispersos. | Igual razonamiento que Entitlements (Documento 1, D3): revertir un diseño disperso después de escrito en decenas de lugares es un refactor grande. | ✅ Confirmado, sin alternativa razonable dada la disciplina ya aplicada al resto del sistema. |

---
**Documento 7 (Autenticación y Permisos) — sin puntos pendientes.** Si confirmás, lo marco ✅ Aprobado en `docs/README.md` y avanzamos al Documento 8 (Sistema de Pagos).
