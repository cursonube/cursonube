/**
 * Home de una academia (academia.cursonube.com) — renderizada a partir de
 * la Pagina tipo "home" y su composición de Bloques (Documento 5, sección 4).
 * Placeholder de scaffolding: la resolución real de la Academia por
 * `params.tenant` (con cache, Documento 6) se agrega en desarrollo. El
 * guard de acceso directo vive en el layout compartido (sites/[tenant]/layout.tsx).
 */
export default async function TenantHomePage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">{tenant}</h1>
      <p className="max-w-md text-zinc-600 dark:text-zinc-400">
        Sitio de la academia — placeholder de scaffolding.
      </p>
    </main>
  );
}
