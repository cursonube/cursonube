import { ApiError } from '@/lib/api-client';
import { serverApiFetch } from '@/lib/api-server';
import { BloqueadoPorImpago } from '@/components/bloqueado-por-impago';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Lead {
  id: string;
  origen: 'Newsletter' | 'Contacto';
  nombre: string | null;
  email: string;
  mensaje: string | null;
  createdAt: string;
}

const ORIGEN_TONE: Record<Lead['origen'], 'info' | 'neutral'> = {
  Newsletter: 'info',
  Contacto: 'neutral',
};

/**
 * Documento 10, sección 1 — "Contactos": Leads capturados por los bloques
 * Newsletter/Contacto del sitio público (Documento 5, sección 6).
 */
export default async function ContactosPage() {
  let leads: Lead[];
  try {
    leads = await serverApiFetch<Lead[]>('leads');
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) {
      return <BloqueadoPorImpago />;
    }
    throw err;
  }

  return (
    <div>
      <h1 className="text-[length:var(--p-text-xl)] font-[650] tracking-tight text-[var(--p-color-text)]">
        Contactos
      </h1>

      {leads.length === 0 ? (
        <p className="mt-6 text-[13px] text-[var(--p-color-text-secondary)]">
          Todavía no capturaste ningún contacto — aparecen acá cuando alguien
          se suscribe al newsletter o completa el formulario de contacto de
          tu sitio.
        </p>
      ) : (
        <ul className="mt-6 max-w-2xl space-y-3">
          {leads.map((lead) => (
            <li key={lead.id}>
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-[550] text-[var(--p-color-text)]">
                      {lead.nombre ?? lead.email}
                    </p>
                    {lead.nombre && (
                      <p className="text-[12px] text-[var(--p-color-text-secondary)]">
                        {lead.email}
                      </p>
                    )}
                  </div>
                  <Badge tone={ORIGEN_TONE[lead.origen]}>{lead.origen}</Badge>
                </div>
                {lead.mensaje && (
                  <p className="mt-2 text-[13px] text-[var(--p-color-text)]">{lead.mensaje}</p>
                )}
                <p className="mt-2 text-[12px] text-[var(--p-color-text-secondary)]">
                  {new Date(lead.createdAt).toLocaleString('es-AR')}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
