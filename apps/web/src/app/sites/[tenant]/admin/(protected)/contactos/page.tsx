import { ApiError } from '@/lib/api-client';
import { serverApiFetch } from '@/lib/api-server';
import { BloqueadoPorImpago } from '@/components/bloqueado-por-impago';

interface Lead {
  id: string;
  origen: 'Newsletter' | 'Contacto';
  nombre: string | null;
  email: string;
  mensaje: string | null;
  createdAt: string;
}

const ORIGEN_BADGE: Record<Lead['origen'], string> = {
  Newsletter: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  Contacto: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
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
      <h1 className="text-xl font-semibold tracking-tight">Contactos</h1>

      {leads.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">
          Todavía no capturaste ningún contacto — aparecen acá cuando alguien
          se suscribe al newsletter o completa el formulario de contacto de
          tu sitio.
        </p>
      ) : (
        <ul className="mt-6 max-w-2xl space-y-3">
          {leads.map((lead) => (
            <li
              key={lead.id}
              className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{lead.nombre ?? lead.email}</p>
                  {lead.nombre && (
                    <p className="text-xs text-zinc-500">{lead.email}</p>
                  )}
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${ORIGEN_BADGE[lead.origen]}`}
                >
                  {lead.origen}
                </span>
              </div>
              {lead.mensaje && (
                <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                  {lead.mensaje}
                </p>
              )}
              <p className="mt-2 text-xs text-zinc-500">
                {new Date(lead.createdAt).toLocaleString('es-AR')}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
