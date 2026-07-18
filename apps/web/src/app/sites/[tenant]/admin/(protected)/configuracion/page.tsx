import { ApiError } from '@/lib/api-client';
import { serverApiFetch } from '@/lib/api-server';
import { BloqueadoPorImpago } from '@/components/bloqueado-por-impago';
import { ConfiguracionView } from './configuracion-view';

export interface MiAcademia {
  nombre: string;
  subdominio: string;
  dominioPropio: string | null;
  logoUrl: string | null;
  colorPrimario: string;
  colorSecundario: string;
  imagenPrincipalUrl: string | null;
  puedeCambiarSubdominio: boolean;
}

export interface EstadoMercadoPago {
  conectada: boolean;
  estado?: 'Conectada' | 'Desconectada';
}

/** Documento 10, sección 1 — "Configuración": branding, subdominio, dominio propio, Mercado Pago. */
export default async function ConfiguracionPage() {
  try {
    const [miAcademia, estadoMp] = await Promise.all([
      serverApiFetch<MiAcademia>('academias/mi-academia'),
      serverApiFetch<EstadoMercadoPago>('pagos/mercado-pago/estado'),
    ]);
    return <ConfiguracionView miAcademia={miAcademia} estadoMp={estadoMp} />;
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) {
      return <BloqueadoPorImpago />;
    }
    throw err;
  }
}
