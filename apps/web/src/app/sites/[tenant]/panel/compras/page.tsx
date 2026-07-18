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
      <h1 className="text-xl font-semibold tracking-tight">Mis Compras</h1>

      {pagos.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">
          Todavía no tenés compras — los cursos gratuitos no generan un pago.
        </p>
      ) : (
        <table className="mt-6 w-full text-left text-sm">
          <thead className="text-zinc-500">
            <tr>
              <th className="pb-2 font-medium">Curso</th>
              <th className="pb-2 font-medium">Monto</th>
              <th className="pb-2 font-medium">Estado</th>
              <th className="pb-2 font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {pagos.map((pago) => (
              <tr key={pago.id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="py-2">{pago.inscripcion.curso.titulo}</td>
                <td className="py-2">{formatMonto(pago.montoCentavos, pago.moneda)}</td>
                <td className="py-2">{ESTADO_LABEL[pago.estado]}</td>
                <td className="py-2 text-zinc-500">
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
