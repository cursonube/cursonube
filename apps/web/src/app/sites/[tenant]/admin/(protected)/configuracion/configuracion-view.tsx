'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { EstadoMercadoPago, MiAcademia } from './page';
import { Button, buttonClassName } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Banner } from '@/components/ui/banner';
import { Badge } from '@/components/ui/badge';

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
  if (error) return <Banner>{error}</Banner>;
  if (ok) return <Banner tone="success">Guardado correctamente</Banner>;
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

      <TextField
        label="Nombre de la academia"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
      />

      <div className="flex gap-4">
        <div className="space-y-1.5">
          <label className="text-[13px] font-[550] text-[var(--p-color-text)]">
            Color primario
          </label>
          <input
            type="color"
            value={colorPrimario}
            onChange={(e) => setColorPrimario(e.target.value)}
            className="h-9 w-16 rounded-[var(--p-radius-md)] border border-[var(--p-color-border)]"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[13px] font-[550] text-[var(--p-color-text)]">
            Color secundario
          </label>
          <input
            type="color"
            value={colorSecundario}
            onChange={(e) => setColorSecundario(e.target.value)}
            className="h-9 w-16 rounded-[var(--p-radius-md)] border border-[var(--p-color-border)]"
          />
        </div>
      </div>

      <TextField
        label="Logo (URL)"
        value={logoUrl}
        onChange={(e) => setLogoUrl(e.target.value)}
      />

      <TextField
        label="Imagen principal (URL)"
        value={imagenPrincipalUrl}
        onChange={(e) => setImagenPrincipalUrl(e.target.value)}
      />

      <Button type="submit" variant="primary" disabled={loading}>
        {loading ? 'Guardando…' : 'Guardar branding'}
      </Button>
    </form>
  );
}

function SubdominioForm({ miAcademia }: { miAcademia: MiAcademia }) {
  const { run, error, ok, loading } = useApiAction();
  const [subdominio, setSubdominio] = useState(miAcademia.subdominio);

  if (!miAcademia.puedeCambiarSubdominio) {
    return (
      <div className="max-w-md">
        <p className="text-[13px] text-[var(--p-color-text)]">
          Subdominio actual: <strong>{miAcademia.subdominio}</strong>
        </p>
        <p className="mt-1 text-[12px] text-[var(--p-color-text-secondary)]">
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
      <p className="text-[12px] text-[var(--p-color-text-secondary)]">
        Cambiable solo dentro de las primeras 48hs desde la creación de tu
        academia.
      </p>
      <div className="flex gap-2">
        <TextField
          value={subdominio}
          onChange={(e) => setSubdominio(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={loading}>
          Guardar
        </Button>
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
      <p className="text-[12px] text-[var(--p-color-text-secondary)]">
        La verificación de propiedad y el certificado SSL automático dependen
        del proveedor de hosting (Documento 14) — todavía no desplegado. Por
        ahora el valor se guarda sin verificar.
      </p>
      <div className="flex gap-2">
        <TextField
          placeholder="miacademia.com"
          value={dominioPropio}
          onChange={(e) => setDominioPropio(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={loading}>
          Guardar
        </Button>
      </div>
    </form>
  );
}

function MercadoPagoSection({ estadoMp }: { estadoMp: EstadoMercadoPago }) {
  return (
    <div className="max-w-md">
      <div className="flex items-center gap-2 text-[13px] text-[var(--p-color-text)]">
        <span>Estado:</span>
        <Badge tone={estadoMp.conectada ? 'success' : 'neutral'}>
          {estadoMp.conectada ? 'Conectada' : 'Sin conectar'}
        </Badge>
      </div>
      {!estadoMp.conectada && (
        // No es una ruta de Next.js — es un endpoint del proxy que responde
        // con un 302 real hacia Mercado Pago (ver cuenta-pago-creador.controller.ts).
        // <Link /> haría una transición de router interna, no la navegación
        // real que este redirect necesita.
        // eslint-disable-next-line @next/next/no-html-link-for-pages
        <a
          href="/api/backend/pagos/mercado-pago/conectar"
          className={`mt-3 inline-block ${buttonClassName('primary')}`}
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
      <h1 className="text-[length:var(--p-text-xl)] font-[650] tracking-tight text-[var(--p-color-text)]">
        Configuración
      </h1>

      <h2 className="mt-6 mb-3 text-[12px] font-[550] text-[var(--p-color-text-secondary)] uppercase tracking-wide">
        Branding
      </h2>
      <BrandingForm miAcademia={miAcademia} />

      <h2 className="mt-8 mb-3 text-[12px] font-[550] text-[var(--p-color-text-secondary)] uppercase tracking-wide">
        Subdominio
      </h2>
      <SubdominioForm miAcademia={miAcademia} />

      <h2 className="mt-8 mb-3 text-[12px] font-[550] text-[var(--p-color-text-secondary)] uppercase tracking-wide">
        Dominio propio
      </h2>
      <DominioPropioForm miAcademia={miAcademia} />

      <h2 className="mt-8 mb-3 text-[12px] font-[550] text-[var(--p-color-text-secondary)] uppercase tracking-wide">
        Mercado Pago
      </h2>
      <MercadoPagoSection estadoMp={estadoMp} />
    </div>
  );
}
