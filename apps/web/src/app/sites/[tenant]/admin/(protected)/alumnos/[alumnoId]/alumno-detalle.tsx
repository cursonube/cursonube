'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { AlumnoDetalleData, CursoInscripcion } from './page';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const ESTADO_TONE: Record<CursoInscripcion['estado'], 'info' | 'success' | 'critical'> = {
  Activa: 'info',
  Completada: 'success',
  Cancelada: 'critical',
};

function formatMonto(centavos: number, moneda: string) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: moneda }).format(
    centavos / 100,
  );
}

function CursoRow({ inscripcion }: { inscripcion: CursoInscripcion }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function revocar() {
    if (
      !confirm(
        `¿Revocar el acceso de este alumno a "${inscripcion.curso.titulo}"? Esta acción es para casos de soporte o sospecha de fraude.`,
      )
    ) {
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await apiFetch(`inscripciones/${inscripcion.inscripcionId}/revocar`, {
        method: 'POST',
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo revocar el acceso');
    } finally {
      setLoading(false);
    }
  }

  return (
    <li>
      <Card className="flex items-center justify-between p-3">
        <div>
          <p className="text-[13px] font-[550] text-[var(--p-color-text)]">
            {inscripcion.curso.titulo}
          </p>
          <p className="text-[12px] text-[var(--p-color-text-secondary)]">
            Inscripto el{' '}
            {new Date(inscripcion.fechaInscripcion).toLocaleDateString('es-AR')}
          </p>
          {error && (
            <p className="mt-1 text-xs text-[var(--p-color-critical-secondary)]">{error}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={ESTADO_TONE[inscripcion.estado]}>{inscripcion.estado}</Badge>
          {inscripcion.estado !== 'Cancelada' && (
            <Button variant="critical" onClick={revocar} disabled={loading} className="!px-2 !py-1 text-xs">
              Revocar acceso
            </Button>
          )}
        </div>
      </Card>
    </li>
  );
}

export function AlumnoDetalle({ alumno }: { alumno: AlumnoDetalleData }) {
  return (
    <div>
      <Link
        href="/admin/alumnos"
        className="text-[13px] text-[var(--p-color-text-secondary)] hover:underline"
      >
        ← Volver a Alumnos
      </Link>

      <h1 className="mt-2 text-[length:var(--p-text-xl)] font-[650] tracking-tight text-[var(--p-color-text)]">
        {alumno.nombre}
      </h1>
      <p className="text-[13px] text-[var(--p-color-text-secondary)]">{alumno.email}</p>

      <h2 className="mt-6 mb-2 text-[12px] font-[550] text-[var(--p-color-text-secondary)] uppercase tracking-wide">
        Cursos
      </h2>
      <ul className="max-w-xl space-y-2">
        {alumno.cursos.map((inscripcion) => (
          <CursoRow key={inscripcion.inscripcionId} inscripcion={inscripcion} />
        ))}
      </ul>

      <h2 className="mt-8 mb-2 text-[12px] font-[550] text-[var(--p-color-text-secondary)] uppercase tracking-wide">
        Historial de pagos
      </h2>
      {alumno.pagos.length === 0 ? (
        <p className="text-[13px] text-[var(--p-color-text-secondary)]">
          Sin pagos registrados.
        </p>
      ) : (
        <table className="max-w-xl text-left text-[13px]">
          <thead className="text-[var(--p-color-text-secondary)]">
            <tr>
              <th className="pb-2 pr-4 font-[550]">Curso</th>
              <th className="pb-2 pr-4 font-[550]">Monto</th>
              <th className="pb-2 font-[550]">Estado</th>
            </tr>
          </thead>
          <tbody>
            {alumno.pagos.map((pago) => (
              <tr key={pago.id} className="border-t border-[var(--p-color-border)]">
                <td className="py-2 pr-4">{pago.curso}</td>
                <td className="py-2 pr-4">{formatMonto(pago.montoCentavos, pago.moneda)}</td>
                <td className="py-2">{pago.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 className="mt-8 mb-2 text-[12px] font-[550] text-[var(--p-color-text-secondary)] uppercase tracking-wide">
        Certificados
      </h2>
      {alumno.certificados.length === 0 ? (
        <p className="text-[13px] text-[var(--p-color-text-secondary)]">
          Sin certificados obtenidos todavía.
        </p>
      ) : (
        <ul className="max-w-xl space-y-1 text-[13px]">
          {alumno.certificados.map((certificado) => (
            <li key={certificado.id}>
              {certificado.curso} — código {certificado.codigoVerificacion} (
              {new Date(certificado.fechaEmision).toLocaleDateString('es-AR')})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
