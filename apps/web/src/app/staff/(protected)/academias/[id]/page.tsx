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
      <h1 className="text-[length:var(--p-text-xl)] font-[650] tracking-tight text-[var(--p-color-text)]">
        {academia.nombre}
      </h1>
      <p className="text-[13px] text-[var(--p-color-text-secondary)]">
        {academia.subdominio}
      </p>

      <AcademiaAcciones
        academiaId={academia.id}
        estado={academia.estado}
        planActual={academia.plan.slug}
      />

      <h2 className="mt-8 mb-3 text-[12px] font-[550] text-[var(--p-color-text-secondary)] uppercase tracking-wide">
        Suscripción
      </h2>
      {suscripcion ? (
        <div className="text-[13px]">
          <p>Estado: {suscripcion.estado}</p>
          <p className="text-[var(--p-color-text-secondary)]">
            Inicio: {new Date(suscripcion.fechaInicio).toLocaleDateString('es-AR')}
          </p>
          {suscripcion.fechaProximaFacturacion && (
            <p className="text-[var(--p-color-text-secondary)]">
              Próxima facturación:{' '}
              {new Date(suscripcion.fechaProximaFacturacion).toLocaleDateString('es-AR')}
            </p>
          )}
        </div>
      ) : (
        <p className="text-[13px] text-[var(--p-color-text-secondary)]">
          Sin suscripción paga (plan Free).
        </p>
      )}

      <h2 className="mt-8 mb-3 text-[12px] font-[550] text-[var(--p-color-text-secondary)] uppercase tracking-wide">
        Alumnos
      </h2>
      <p className="text-[13px]">{alumnosCount} alumnos inscriptos.</p>

      <h2 className="mt-8 mb-3 text-[12px] font-[550] text-[var(--p-color-text-secondary)] uppercase tracking-wide">
        Historial de facturación (alumno → creador)
      </h2>
      {pagos.length === 0 ? (
        <p className="text-[13px] text-[var(--p-color-text-secondary)]">
          Sin pagos registrados todavía.
        </p>
      ) : (
        <ul className="space-y-2 text-[13px]">
          {pagos.map((pago) => (
            <li key={pago.id} className="flex justify-between">
              <span>{new Date(pago.createdAt).toLocaleDateString('es-AR')}</span>
              <span>{pago.estado}</span>
              <span>{formatMonto(pago.montoCentavos, pago.moneda)}</span>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-8 mb-3 text-[12px] font-[550] text-[var(--p-color-text-secondary)] uppercase tracking-wide">
        Historial de acciones (Audit Log)
      </h2>
      {auditLog.length === 0 ? (
        <p className="text-[13px] text-[var(--p-color-text-secondary)]">
          Sin acciones registradas sobre esta academia.
        </p>
      ) : (
        <ul className="space-y-2 text-[13px]">
          {auditLog.map((entrada) => (
            <li key={entrada.id} className="text-[var(--p-color-text-secondary)]">
              {new Date(entrada.createdAt).toLocaleString('es-AR')} — {entrada.accion} (
              {entrada.staff.email})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
