import { serverApiFetch } from '@/lib/api-server';
import { Card } from '@/components/ui/card';
import { buttonClassName } from '@/components/ui/button';

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
      <h1 className="text-[length:var(--p-text-xl)] font-[650] tracking-tight text-[var(--p-color-text)]">
        Certificados
      </h1>

      {certificados.length === 0 ? (
        <p className="mt-4 text-[13px] text-[var(--p-color-text-secondary)]">
          Todavía no obtuviste ningún certificado — completá un curso al 100%
          para generar el tuyo.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {certificados.map((certificado) => (
            <li key={certificado.id}>
              <Card className="flex items-center justify-between p-4">
                <div>
                  <p className="text-[13px] font-[550] text-[var(--p-color-text)]">
                    {certificado.inscripcion.curso.titulo}
                  </p>
                  <p className="text-[12px] text-[var(--p-color-text-secondary)]">
                    Emitido el{' '}
                    {new Date(certificado.fechaEmision).toLocaleDateString('es-AR')}{' '}
                    · Código {certificado.codigoVerificacion}
                  </p>
                </div>
                <a
                  href={`/api/backend/certificados/${certificado.id}/descargar`}
                  className={buttonClassName('secondary')}
                >
                  Descargar PDF
                </a>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
