'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api-client';

interface LoginResponse {
  requiereEnrollment: boolean;
  qrCodeDataUrl?: string;
  claveManual?: string;
}

/**
 * Documento 7, sección 6 — 2FA obligatorio para Staff de Cursonube desde el
 * MVP: login en dos pasos, nunca se entra solo con email+contraseña. Vive
 * en el dominio raíz (Documento 7, sección 2: "dominio interno, no expuesto
 * a academias/alumnos"), nunca bajo un subdominio de tenant.
 */
export default function StaffLoginPage() {
  const router = useRouter();
  const [fase, setFase] = useState<'credenciales' | 'codigo'>('credenciales');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [codigo, setCodigo] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [claveManual, setClaveManual] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCredenciales(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const resultado = await apiFetch<LoginResponse>('staff/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setQrCodeDataUrl(resultado.qrCodeDataUrl ?? null);
      setClaveManual(resultado.claveManual ?? null);
      setFase('codigo');
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'No se pudo iniciar sesión',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCodigo(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch('staff/auth/2fa/verificar', {
        method: 'POST',
        body: JSON.stringify({ codigo }),
      });
      router.push('/staff/academias');
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Código incorrecto',
      );
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-5 rounded-xl border border-zinc-200 p-8 dark:border-zinc-800">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold tracking-tight">
            Panel interno de Cursonube
          </h1>
          <p className="text-sm text-zinc-500">Acceso exclusivo para staff</p>
        </div>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
            {error}
          </p>
        )}

        {fase === 'credenciales' && (
          <form onSubmit={handleCredenciales} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Contraseña</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900"
            >
              {loading ? 'Verificando…' : 'Continuar'}
            </button>
          </form>
        )}

        {fase === 'codigo' && (
          <form onSubmit={handleCodigo} className="space-y-4">
            {qrCodeDataUrl && (
              <div className="space-y-2 text-center">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Escaneá este código con tu app de autenticación (Google
                  Authenticator, Authy, etc.) para activar la verificación en
                  dos pasos.
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrCodeDataUrl}
                  alt="Código QR para 2FA"
                  className="mx-auto h-40 w-40"
                />
                {claveManual && (
                  <p className="font-mono text-xs break-all text-zinc-500">
                    Clave manual: {claveManual}
                  </p>
                )}
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Código de 6 dígitos
              </label>
              <input
                required
                inputMode="numeric"
                minLength={6}
                maxLength={6}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-center text-lg tracking-widest outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900"
            >
              {loading ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
