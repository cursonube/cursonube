import { serverApiFetch } from '@/lib/api-server';
import { AlumnoDetalle } from './alumno-detalle';

export interface CursoInscripcion {
  inscripcionId: string;
  curso: { id: string; titulo: string };
  estado: 'Activa' | 'Completada' | 'Cancelada';
  fechaInscripcion: string;
  fechaCompletado: string | null;
}

export interface PagoAlumno {
  id: string;
  curso: string;
  montoCentavos: number;
  moneda: string;
  estado: 'Aprobado' | 'Pendiente' | 'Rechazado' | 'Reembolsado';
  createdAt: string;
}

export interface CertificadoAlumno {
  id: string;
  curso: string;
  codigoVerificacion: string;
  fechaEmision: string;
}

export interface AlumnoDetalleData {
  id: string;
  nombre: string;
  email: string;
  cursos: CursoInscripcion[];
  pagos: PagoAlumno[];
  certificados: CertificadoAlumno[];
}

/** Documento 10, sección 3 — detalle de un alumno: historial de pagos y certificados. */
export default async function AlumnoDetallePage({
  params,
}: {
  params: Promise<{ alumnoId: string }>;
}) {
  const { alumnoId } = await params;
  const alumno = await serverApiFetch<AlumnoDetalleData>(`alumnos/${alumnoId}`);

  return <AlumnoDetalle alumno={alumno} />;
}
