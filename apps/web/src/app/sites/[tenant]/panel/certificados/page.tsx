import { serverApiFetch } from '@/lib/api-server';

interface Certificado {
  id: string;
  codigoVerificacion: string;
  fechaEmision: string;
  inscripcion: { curso: { titulo: string } };
}

/**
 * Documento 11, sección 1 — "Certificados". El link de descarga pasa por
 * el proxy same-origin (`/api/backend/...`) para que el browser mande la
 * cookie de sesión automáticamente, sin necesidad de JS (Documento 7).
 */
export default async function CertificadosPage() {
  const certificados = await serverApiFetch<Certificado[]>('certificados');

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Certificados</h1>

      {certificados.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">
          Todavía no obtuviste ningún certificado — completá un curso al 100%
          para generar el tuyo.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {certificados.map((certificado) => (
            <li
              key={certificado.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div>
                <p className="font-medium">{certificado.inscripcion.curso.titulo}</p>
                <p className="text-xs text-zinc-500">
                  Emitido el{' '}
                  {new Date(certificado.fechaEmision).toLocaleDateString('es-AR')}{' '}
                  · Código {certificado.codigoVerificacion}
                </p>
              </div>
              <a
                href={`/api/backend/certificados/${certificado.id}/descargar`}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm transition hover:border-zinc-500 dark:border-zinc-700"
              >
                Descargar PDF
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
