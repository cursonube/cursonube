'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api-client';

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
    <main className="flex flex-1 items-center justify-center px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-5 rounded-xl border border-zinc-200 p-8 dark:border-zinc-800"
      >
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold tracking-tight">
            Panel de gestión
          </h1>
          <p className="text-sm text-zinc-500">
            Iniciá sesión para administrar tu academia
          </p>
        </div>

        {bienvenida && !error && (
          <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-400">
            ¡Tu academia ya está lista! Iniciá sesión para entrar a tu panel.
          </p>
        )}

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            Contraseña
          </label>
          <input
            id="password"
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
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </main>
  );
}
