'use client';

import { useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';

export function CambiarPasswordForm() {
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMensaje(null);
    setLoading(true);
    try {
      await apiFetch('auth/alumno/cambiar-password', {
        method: 'POST',
        body: JSON.stringify({ passwordActual, passwordNueva }),
      });
      setMensaje({ tipo: 'ok', texto: 'Contraseña actualizada correctamente' });
      setPasswordActual('');
      setPasswordNueva('');
    } catch (err) {
      setMensaje({
        tipo: 'error',
        texto: err instanceof ApiError ? err.message : 'No se pudo cambiar la contraseña',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 max-w-sm space-y-4">
      {mensaje && (
        <p
          className={`rounded-md px-3 py-2 text-sm ${
            mensaje.tipo === 'ok'
              ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400'
              : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'
          }`}
        >
          {mensaje.texto}
        </p>
      )}

      <div className="space-y-1.5">
        <label htmlFor="passwordActual" className="text-sm font-medium">
          Contraseña actual
        </label>
        <input
          id="passwordActual"
          type="password"
          required
          value={passwordActual}
          onChange={(e) => setPasswordActual(e.target.value)}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="passwordNueva" className="text-sm font-medium">
          Contraseña nueva
        </label>
        <input
          id="passwordNueva"
          type="password"
          required
          minLength={8}
          value={passwordNueva}
          onChange={(e) => setPasswordNueva(e.target.value)}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900"
      >
        {loading ? 'Actualizando…' : 'Cambiar contraseña'}
      </button>
    </form>
  );
}
