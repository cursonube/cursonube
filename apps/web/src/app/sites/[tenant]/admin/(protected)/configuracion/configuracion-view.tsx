'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { EstadoMercadoPago, MiAcademia } from './page';

function useApiAction() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function run(fn: () => Promise<unknown>) {
    setError(null);
    setOk(false);
    setLoading(true);
    try {
      await fn();
      setOk(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ocurrió un error');
    } finally {
      setLoading(false);
    }
  }

  return { run, error, ok, loading };
}

function Mensaje({ error, ok }: { error: string | null; ok: boolean }) {
  if (error) {
    return (
      <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
        {error}
      </p>
    );
  }
  if (ok) {
    return (
      <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-400">
        Guardado correctamente
      </p>
    );
  }
  return null;
}

function BrandingForm({ miAcademia }: { miAcademia: MiAcademia }) {
  const { run, error, ok, loading } = useApiAction();
  const [nombre, setNombre] = useState(miAcademia.nombre);
  const [colorPrimario, setColorPrimario] = useState(miAcademia.colorPrimario);
  const [colorSecundario, setColorSecundario] = useState(miAcademia.colorSecundario);
  const [logoUrl, setLogoUrl] = useState(miAcademia.logoUrl ?? '');
  const [imagenPrincipalUrl, setImagenPrincipalUrl] = useState(
    miAcademia.imagenPrincipalUrl ?? '',
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(() =>
          apiFetch('academias/mi-academia', {
            method: 'PATCH',
            body: JSON.stringify({
              nombre,
              colorPrimario,
              colorSecundario,
              logoUrl: logoUrl || undefined,
              imagenPrincipalUrl: imagenPrincipalUrl || undefined,
            }),
          }),
        );
      }}
      className="max-w-md space-y-4"
    >
      <Mensaje error={error} ok={ok} />

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Nombre de la academia</label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div className="flex gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Color primario</label>
          <input
            type="color"
            value={colorPrimario}
            onChange={(e) => setColorPrimario(e.target.value)}
            className="h-9 w-16 rounded-md border border-zinc-300 dark:border-zinc-700"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Color secundario</label>
          <input
            type="color"
            value={colorSecundario}
            onChange={(e) => setColorSecundario(e.target.value)}
            className="h-9 w-16 rounded-md border border-zinc-300 dark:border-zinc-700"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Logo (URL)</label>
        <input
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Imagen principal (URL)</label>
        <input
          value={imagenPrincipalUrl}
          onChange={(e) => setImagenPrincipalUrl(e.target.value)}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900"
      >
        {loading ? 'Guardando…' : 'Guardar branding'}
      </button>
    </form>
  );
}

function SubdominioForm({ miAcademia }: { miAcademia: MiAcademia }) {
  const { run, error, ok, loading } = useApiAction();
  const [subdominio, setSubdominio] = useState(miAcademia.subdominio);

  if (!miAcademia.puedeCambiarSubdominio) {
    return (
      <div className="max-w-md">
        <p className="text-sm">
          Subdominio actual: <strong>{miAcademia.subdominio}</strong>
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Ya no se puede cambiar — la ventana de 48hs desde la creación de la
          academia venció (Documento 6, decisión T1).
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(() =>
          apiFetch('academias/mi-academia', {
            method: 'PATCH',
            body: JSON.stringify({ subdominio }),
          }),
        );
      }}
      className="max-w-md space-y-3"
    >
      <Mensaje error={error} ok={ok} />
      <p className="text-xs text-zinc-500">
        Cambiable solo dentro de las primeras 48hs desde la creación de tu
        academia.
      </p>
      <div className="flex gap-2">
        <input
          value={subdominio}
          onChange={(e) => setSubdominio(e.target.value)}
          className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm transition hover:border-zinc-500 disabled:opacity-50 dark:border-zinc-700"
        >
          Guardar
        </button>
      </div>
    </form>
  );
}

function DominioPropioForm({ miAcademia }: { miAcademia: MiAcademia }) {
  const { run, error, ok, loading } = useApiAction();
  const [dominioPropio, setDominioPropio] = useState(miAcademia.dominioPropio ?? '');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(() =>
          apiFetch('academias/mi-academia', {
            method: 'PATCH',
            body: JSON.stringify({ dominioPropio }),
          }),
        );
      }}
      className="max-w-md space-y-3"
    >
      <Mensaje error={error} ok={ok} />
      <p className="text-xs text-zinc-500">
        La verificación de propiedad y el certificado SSL automático dependen
        del proveedor de hosting (Documento 14) — todavía no desplegado. Por
        ahora el valor se guarda sin verificar.
      </p>
      <div className="flex gap-2">
        <input
          placeholder="miacademia.com"
          value={dominioPropio}
          onChange={(e) => setDominioPropio(e.target.value)}
          className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm transition hover:border-zinc-500 disabled:opacity-50 dark:border-zinc-700"
        >
          Guardar
        </button>
      </div>
    </form>
  );
}

function MercadoPagoSection({ estadoMp }: { estadoMp: EstadoMercadoPago }) {
  return (
    <div className="max-w-md">
      <p className="text-sm">
        Estado:{' '}
        <span
          className={
            estadoMp.conectada
              ? 'font-medium text-green-700 dark:text-green-400'
              : 'font-medium text-zinc-500'
          }
        >
          {estadoMp.conectada ? 'Conectada' : 'Sin conectar'}
        </span>
      </p>
      {!estadoMp.conectada && (
        // No es una ruta de Next.js — es un endpoint del proxy que responde
        // con un 302 real hacia Mercado Pago (ver cuenta-pago-creador.controller.ts).
        // <Link /> haría una transición de router interna, no la navegación
        // real que este redirect necesita.
        // eslint-disable-next-line @next/next/no-html-link-for-pages
        <a
          href="/api/backend/pagos/mercado-pago/conectar"
          className="mt-3 inline-block rounded-md border border-zinc-300 px-3 py-1.5 text-sm transition hover:border-zinc-500 dark:border-zinc-700"
        >
          Conectar Mercado Pago
        </a>
      )}
    </div>
  );
}

export function ConfiguracionView({
  miAcademia,
  estadoMp,
}: {
  miAcademia: MiAcademia;
  estadoMp: EstadoMercadoPago;
}) {
  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Configuración</h1>

      <h2 className="mt-6 mb-3 text-sm font-medium text-zinc-500 uppercase tracking-wide">
        Branding
      </h2>
      <BrandingForm miAcademia={miAcademia} />

      <h2 className="mt-8 mb-3 text-sm font-medium text-zinc-500 uppercase tracking-wide">
        Subdominio
      </h2>
      <SubdominioForm miAcademia={miAcademia} />

      <h2 className="mt-8 mb-3 text-sm font-medium text-zinc-500 uppercase tracking-wide">
        Dominio propio
      </h2>
      <DominioPropioForm miAcademia={miAcademia} />

      <h2 className="mt-8 mb-3 text-sm font-medium text-zinc-500 uppercase tracking-wide">
        Mercado Pago
      </h2>
      <MercadoPagoSection estadoMp={estadoMp} />
    </div>
  );
}
