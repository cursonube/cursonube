import { serverApiFetch } from '@/lib/api-server';
import { CambiarPasswordForm } from './cambiar-password-form';

interface AlumnoMe {
  id: string;
  email: string;
  nombre: string;
}

/**
 * Documento 11, sección 1 — "Mi Cuenta". El cambio de email con
 * verificación por link queda pendiente de la infraestructura de email
 * transaccional (Resend), todavía no construida — por ahora solo lectura.
 */
export default async function CuentaPage() {
  const alumno = await serverApiFetch<AlumnoMe>('auth/alumno/me');

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Mi Cuenta</h1>

      <dl className="mt-6 max-w-sm space-y-3 text-sm">
        <div>
          <dt className="text-zinc-500">Nombre</dt>
          <dd>{alumno.nombre}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Email</dt>
          <dd>{alumno.email}</dd>
        </div>
      </dl>

      <h2 className="mt-8 text-sm font-medium">Cambiar contraseña</h2>
      <CambiarPasswordForm />
    </div>
  );
}
