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
      <h1 className="text-[length:var(--p-text-xl)] font-[650] tracking-tight text-[var(--p-color-text)]">
        Mi Cuenta
      </h1>

      <dl className="mt-6 max-w-sm space-y-3 text-[13px]">
        <div>
          <dt className="text-[var(--p-color-text-secondary)]">Nombre</dt>
          <dd className="text-[var(--p-color-text)]">{alumno.nombre}</dd>
        </div>
        <div>
          <dt className="text-[var(--p-color-text-secondary)]">Email</dt>
          <dd className="text-[var(--p-color-text)]">{alumno.email}</dd>
        </div>
      </dl>

      <h2 className="mt-8 text-[13px] font-[550] text-[var(--p-color-text)]">
        Cambiar contraseña
      </h2>
      <CambiarPasswordForm />
    </div>
  );
}
