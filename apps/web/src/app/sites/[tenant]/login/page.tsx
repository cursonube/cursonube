'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Banner } from '@/components/ui/banner';
import { Card } from '@/components/ui/card';

/**
 * Login del Alumno — Documento 7, sección 2: `academia.cursonube.com/login`.
 * Distinto del login de AcademiaUsuario (`/admin/login`, panel del creador).
 */
export default function AlumnoLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch('auth/alumno/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      router.push('/panel');
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No se pudo iniciar sesión — intentá de nuevo',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-shell flex flex-1 items-center justify-center px-6">
      <Card className="w-full max-w-sm p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1 text-center">
            <h1 className="text-[length:var(--p-text-xl)] font-[650] tracking-tight text-[var(--p-color-text)]">
              Iniciá sesión
            </h1>
            <p className="text-[13px] text-[var(--p-color-text-secondary)]">
              Accedé a tus cursos, certificados y compras
            </p>
          </div>

          {error && <Banner>{error}</Banner>}

          <TextField
            label="Email"
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <TextField
            label="Contraseña"
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button type="submit" variant="primary" disabled={loading} className="w-full">
            {loading ? 'Ingresando…' : 'Ingresar'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
