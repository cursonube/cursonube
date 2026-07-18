import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { generateId } from '../src/common/id/generate-id';

const prisma = new PrismaClient();

/**
 * Catálogo de planes — Documento 1, sección 6.1: estructura y niveles ya
 * aprobados, los números concretos son un placeholder ("a definir" en el
 * documento) hasta que el equipo de negocio fije el pricing real. Cambiar
 * estos valores es un cambio de datos, no de código (Documento 1, decisión
 * derivada de D3: Entitlements data-driven).
 */
const PLANES = [
  {
    slug: 'Free' as const,
    maxProfesoresEditores: 1,
    maxAlumnos: 50,
    maxCursos: 1,
    dominioPropioHabilitado: false,
    marcaCursonubeVisible: true,
    precioMensualCentavos: null,
    moneda: null,
  },
  {
    slug: 'Starter' as const,
    maxProfesoresEditores: 2,
    maxAlumnos: 300,
    maxCursos: 5,
    dominioPropioHabilitado: false,
    marcaCursonubeVisible: true,
    precioMensualCentavos: 900000, // ARS 9.000 — placeholder
    moneda: 'ARS',
  },
  {
    slug: 'Pro' as const,
    maxProfesoresEditores: 5,
    maxAlumnos: null,
    maxCursos: null,
    dominioPropioHabilitado: true,
    marcaCursonubeVisible: false,
    precioMensualCentavos: 2500000, // ARS 25.000 — placeholder
    moneda: 'ARS',
  },
  {
    slug: 'Business' as const,
    // Documento 3: max_profesores_editores nunca es nullable (a diferencia de
    // max_alumnos/max_cursos) — "ilimitado" acá se modela como límite alto.
    maxProfesoresEditores: 50,
    maxAlumnos: null,
    maxCursos: null,
    dominioPropioHabilitado: true,
    marcaCursonubeVisible: false,
    precioMensualCentavos: 6000000, // ARS 60.000 — placeholder
    moneda: 'ARS',
  },
];

/**
 * Catálogo de plantillas — Documento 1/5: las 5, disponibles por igual en
 * todos los planes. `configBase` es un placeholder de tokens de diseño;
 * el sistema de diseño real se define al construir el Editor de Bloques.
 */
const PLANTILLAS = [
  { nombre: 'Creator' as const },
  { nombre: 'Academy' as const },
  { nombre: 'Business' as const },
  { nombre: 'Modern' as const },
  { nombre: 'Dark' as const },
];

async function main() {
  for (const plan of PLANES) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: { id: generateId(), ...plan },
    });
  }

  for (const plantilla of PLANTILLAS) {
    await prisma.plantilla.upsert({
      where: { nombre: plantilla.nombre },
      update: {},
      create: {
        id: generateId(),
        nombre: plantilla.nombre,
        configBase: { placeholder: true },
      },
    });
  }

  // Documento 7, sección 2: sin self-registration para CursonubeStaff (dominio
  // interno, no expuesto a academias/alumnos) — la única forma de tener una
  // primera cuenta es este bootstrap. Contraseña de desarrollo únicamente;
  // `update: {}` para no resetearla en reseeds si ya se cambió a mano.
  const BOOTSTRAP_STAFF_EMAIL = 'admin@cursonube.com';
  const staffExistente = await prisma.cursonubeStaff.findUnique({
    where: { email: BOOTSTRAP_STAFF_EMAIL },
  });
  if (!staffExistente) {
    await prisma.cursonubeStaff.create({
      data: {
        id: generateId(),
        email: BOOTSTRAP_STAFF_EMAIL,
        passwordHash: await argon2.hash('dev-local-staff-password'),
        rol: 'SuperAdmin',
      },
    });
  }

  console.log(
    `Seed OK: ${PLANES.length} planes, ${PLANTILLAS.length} plantillas, staff bootstrap (${BOOTSTRAP_STAFF_EMAIL}).`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
