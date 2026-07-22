import { serverApiFetch } from '@/lib/api-server';

interface Pago {
  id: string;
  montoCentavos: number;
  moneda: string;
  estado: 'Aprobado' | 'Pendiente' | 'Rechazado' | 'Reembolsado';
  createdAt: string;
  inscripcion: { curso: { titulo: string } };
}

const ESTADO_LABEL: Record<Pago['estado'], string> = {
  Aprobado: 'Aprobado',
  Pendiente: 'Pendiente',
  Rechazado: 'Rechazado',
  Reembolsado: 'Reembolsado',
};

function formatMonto(centavos: number, moneda: string) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: moneda }).format(
    centavos / 100,
  );
}

/**
 * Documento 11, sección 1 — "Mis Compras": comprobante simple, sin email de
 * recibo separado (el de bienvenida del guest-checkout ya cubre esa
 * función). Los cursos gratis no generan `Pago` (Documento 8, sección 3).
 */
export default async function ComprasPage() {
  const pagos = await serverApiFetch<Pago[]>('alumno/mis-compras');

  return (
    <div>
      <h1 className="text-[length:var(--p-text-xl)] font-[650] tracking-tight text-[var(--p-color-text)]">
        Mis Compras
      </h1>

      {pagos.length === 0 ? (
        <p className="mt-4 text-[13px] text-[var(--p-color-text-secondary)]">
          Todavía no tenés compras — los cursos gratuitos no generan un pago.
        </p>
      ) : (
        <table className="mt-6 w-full text-left text-[13px]">
          <thead className="text-[var(--p-color-text-secondary)]">
            <tr>
              <th className="pb-2 font-[550]">Curso</th>
              <th className="pb-2 font-[550]">Monto</th>
              <th className="pb-2 font-[550]">Estado</th>
              <th className="pb-2 font-[550]">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {pagos.map((pago) => (
              <tr key={pago.id} className="border-t border-[var(--p-color-border)]">
                <td className="py-2">{pago.inscripcion.curso.titulo}</td>
                <td className="py-2">{formatMonto(pago.montoCentavos, pago.moneda)}</td>
                <td className="py-2">{ESTADO_LABEL[pago.estado]}</td>
                <td className="py-2 text-[var(--p-color-text-secondary)]">
                  {new Date(pago.createdAt).toLocaleDateString('es-AR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
