'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Banner } from '@/components/ui/banner';
import { Card } from '@/components/ui/card';

/**
 * Login del panel de gestión (Owner/Administrador/Profesor/Editor) —
 * Documento 7, sección 2: `academia.cursonube.com/admin/login`. Distinto
 * del login de Alumno (`/login`, Panel del Alumno).
 *
 * `?email=`/`?bienvenida=1`/`?tituloSugerido=`/`?descripcionSugerida=`:
 * handoff del wizard de onboarding (Documento 4, Flujo 1) — las sesiones
 * están scoped al hostname exacto (Documento 7), así que no se puede llegar
 * ya logueado desde el dominio raíz donde corre el wizard — esto evita
 * pedir de nuevo el email y retoma el curso opcional del paso 5 si se cargó.
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const bienvenida = searchParams.get('bienvenida') === '1';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch('auth/academia/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      const tituloSugerido = searchParams.get('tituloSugerido');
      if (tituloSugerido) {
        const params = new URLSearchParams({ tituloSugerido });
        const descripcionSugerida = searchParams.get('descripcionSugerida');
        if (descripcionSugerida) {
          params.set('descripcionSugerida', descripcionSugerida);
        }
        router.push(`/admin/cursos/nuevo?${params.toString()}`);
      } else {
        router.push('/admin');
      }
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
              Panel de gestión
            </h1>
            <p className="text-[13px] text-[var(--p-color-text-secondary)]">
              Iniciá sesión para administrar tu academia
            </p>
          </div>

          {bienvenida && !error && (
            <Banner tone="success">
              ¡Tu academia ya está lista! Iniciá sesión para entrar a tu panel.
            </Banner>
          )}

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
