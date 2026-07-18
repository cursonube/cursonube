import { serverApiFetch } from '@/lib/api-server';
import { AcademiaAcciones } from './academia-acciones';

interface AcademiaDetalle {
  id: string;
  nombre: string;
  subdominio: string;
  estado: 'Activa' | 'Suspendida' | 'Cancelada';
  plan: { slug: string };
  createdAt: string;
}

interface Suscripcion {
  id: string;
  estado: string;
  fechaInicio: string;
  fechaProximaFacturacion: string | null;
}

interface Pago {
  id: string;
  montoCentavos: number;
  moneda: string;
  estado: string;
  createdAt: string;
}

interface AcademiaDetalleResponse {
  academia: AcademiaDetalle;
  suscripcion: Suscripcion | null;
  alumnosCount: number;
  pagos: Pago[];
}

interface AuditLogEntry {
  id: string;
  accion: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  staff: { email: string };
}

function formatMonto(centavos: number, moneda: string) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: moneda }).format(
    centavos / 100,
  );
}

/** Documento 4, Flujo 9, punto 3-4 — detalle de una academia + acciones de soporte. */
export default async function StaffAcademiaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [detalle, auditLog] = await Promise.all([
    serverApiFetch<AcademiaDetalleResponse>(`staff/academias/${id}`),
    serverApiFetch<AuditLogEntry[]>(`staff/academias/${id}/audit-log`),
  ]);

  const { academia, suscripcion, alumnosCount, pagos } = detalle;

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold tracking-tight">{academia.nombre}</h1>
      <p className="text-sm text-zinc-500">{academia.subdominio}</p>

      <AcademiaAcciones
        academiaId={academia.id}
        estado={academia.estado}
        planActual={academia.plan.slug}
      />

      <h2 className="mt-8 mb-3 text-sm font-medium text-zinc-500 uppercase tracking-wide">
        Suscripción
      </h2>
      {suscripcion ? (
        <div className="text-sm">
          <p>Estado: {suscripcion.estado}</p>
          <p className="text-zinc-500">
            Inicio: {new Date(suscripcion.fechaInicio).toLocaleDateString('es-AR')}
          </p>
          {suscripcion.fechaProximaFacturacion && (
            <p className="text-zinc-500">
              Próxima facturación:{' '}
              {new Date(suscripcion.fechaProximaFacturacion).toLocaleDateString('es-AR')}
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-zinc-500">Sin suscripción paga (plan Free).</p>
      )}

      <h2 className="mt-8 mb-3 text-sm font-medium text-zinc-500 uppercase tracking-wide">
        Alumnos
      </h2>
      <p className="text-sm">{alumnosCount} alumnos inscriptos.</p>

      <h2 className="mt-8 mb-3 text-sm font-medium text-zinc-500 uppercase tracking-wide">
        Historial de facturación (alumno → creador)
      </h2>
      {pagos.length === 0 ? (
        <p className="text-sm text-zinc-500">Sin pagos registrados todavía.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {pagos.map((pago) => (
            <li key={pago.id} className="flex justify-between">
              <span>{new Date(pago.createdAt).toLocaleDateString('es-AR')}</span>
              <span>{pago.estado}</span>
              <span>{formatMonto(pago.montoCentavos, pago.moneda)}</span>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-8 mb-3 text-sm font-medium text-zinc-500 uppercase tracking-wide">
        Historial de acciones (Audit Log)
      </h2>
      {auditLog.length === 0 ? (
        <p className="text-sm text-zinc-500">Sin acciones registradas sobre esta academia.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {auditLog.map((entrada) => (
            <li key={entrada.id} className="text-zinc-600 dark:text-zinc-400">
              {new Date(entrada.createdAt).toLocaleString('es-AR')} — {entrada.accion} (
              {entrada.staff.email})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
