'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { AlumnoDetalleData, CursoInscripcion } from './page';

const ESTADO_BADGE: Record<CursoInscripcion['estado'], string> = {
  Activa: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  Completada: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  Cancelada: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
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
    <li className="flex items-center justify-between rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
      <div>
        <p className="text-sm font-medium">{inscripcion.curso.titulo}</p>
        <p className="text-xs text-zinc-500">
          Inscripto el{' '}
          {new Date(inscripcion.fechaInscripcion).toLocaleDateString('es-AR')}
        </p>
        {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${ESTADO_BADGE[inscripcion.estado]}`}
        >
          {inscripcion.estado}
        </span>
        {inscripcion.estado !== 'Cancelada' && (
          <button
            onClick={revocar}
            disabled={loading}
            className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-600 transition hover:border-red-500 disabled:opacity-50 dark:border-red-900 dark:text-red-400"
          >
            Revocar acceso
          </button>
        )}
      </div>
    </li>
  );
}

export function AlumnoDetalle({ alumno }: { alumno: AlumnoDetalleData }) {
  return (
    <div>
      <Link href="/admin/alumnos" className="text-sm text-zinc-500 hover:underline">
        ← Volver a Alumnos
      </Link>

      <h1 className="mt-2 text-xl font-semibold tracking-tight">{alumno.nombre}</h1>
      <p className="text-sm text-zinc-500">{alumno.email}</p>

      <h2 className="mt-6 mb-2 text-sm font-medium text-zinc-500 uppercase tracking-wide">
        Cursos
      </h2>
      <ul className="max-w-xl space-y-2">
        {alumno.cursos.map((inscripcion) => (
          <CursoRow key={inscripcion.inscripcionId} inscripcion={inscripcion} />
        ))}
      </ul>

      <h2 className="mt-8 mb-2 text-sm font-medium text-zinc-500 uppercase tracking-wide">
        Historial de pagos
      </h2>
      {alumno.pagos.length === 0 ? (
        <p className="text-sm text-zinc-500">Sin pagos registrados.</p>
      ) : (
        <table className="max-w-xl text-left text-sm">
          <thead className="text-zinc-500">
            <tr>
              <th className="pb-2 pr-4 font-medium">Curso</th>
              <th className="pb-2 pr-4 font-medium">Monto</th>
              <th className="pb-2 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {alumno.pagos.map((pago) => (
              <tr key={pago.id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="py-2 pr-4">{pago.curso}</td>
                <td className="py-2 pr-4">{formatMonto(pago.montoCentavos, pago.moneda)}</td>
                <td className="py-2">{pago.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 className="mt-8 mb-2 text-sm font-medium text-zinc-500 uppercase tracking-wide">
        Certificados
      </h2>
      {alumno.certificados.length === 0 ? (
        <p className="text-sm text-zinc-500">Sin certificados obtenidos todavía.</p>
      ) : (
        <ul className="max-w-xl space-y-1 text-sm">
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
