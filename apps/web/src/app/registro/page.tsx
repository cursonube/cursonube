/**
 * Paso 0 del wizard de onboarding (Documento 1 / Documento 4, Flujo 1),
 * vive en el dominio raíz porque todavía no existe ningún subdominio
 * al cual redirigir (Documento 17, sección 2/4).
 */
export default function RegistroPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">
        Creá tu cuenta
      </h1>
      <p className="max-w-md text-zinc-600 dark:text-zinc-400">
        Paso 0 del wizard de onboarding — placeholder de scaffolding.
      </p>
    </main>
  );
}
