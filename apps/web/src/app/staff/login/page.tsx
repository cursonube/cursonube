'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Banner } from '@/components/ui/banner';
import { Card } from '@/components/ui/card';

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
    <div className="p-shell flex flex-1 items-center justify-center px-6">
      <Card className="w-full max-w-sm space-y-5 p-8">
        <div className="space-y-1 text-center">
          <h1 className="text-[length:var(--p-text-xl)] font-[650] tracking-tight text-[var(--p-color-text)]">
            Panel interno de Cursonube
          </h1>
          <p className="text-[13px] text-[var(--p-color-text-secondary)]">
            Acceso exclusivo para staff
          </p>
        </div>

        {error && <Banner>{error}</Banner>}

        {fase === 'credenciales' && (
          <form onSubmit={handleCredenciales} className="space-y-4">
            <TextField
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label="Contraseña"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" variant="primary" disabled={loading} className="w-full">
              {loading ? 'Verificando…' : 'Continuar'}
            </Button>
          </form>
        )}

        {fase === 'codigo' && (
          <form onSubmit={handleCodigo} className="space-y-4">
            {qrCodeDataUrl && (
              <div className="space-y-2 text-center">
                <p className="text-[13px] text-[var(--p-color-text-secondary)]">
                  Escaneá este código con tu app de autenticación (Google
                  Authenticator, Authy, etc.) para activar la verificación en
                  dos pasos.
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrCodeDataUrl}
                  alt="Código QR para 2FA"
                  className="mx-auto h-40 w-40 rounded-[var(--p-radius-md)] border border-[var(--p-color-border)]"
                />
                {claveManual && (
                  <p className="[font-family:var(--p-font-mono)] text-xs break-all text-[var(--p-color-text-secondary)]">
                    Clave manual: {claveManual}
                  </p>
                )}
              </div>
            )}
            <TextField
              label="Código de 6 dígitos"
              required
              inputMode="numeric"
              minLength={6}
              maxLength={6}
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              className="text-center text-lg tracking-widest"
            />
            <Button type="submit" variant="primary" disabled={loading} className="w-full">
              {loading ? 'Ingresando…' : 'Ingresar'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
