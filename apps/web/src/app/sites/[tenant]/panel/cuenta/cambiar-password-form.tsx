'use client';

import { useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Banner } from '@/components/ui/banner';

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
        <Banner tone={mensaje.tipo === 'ok' ? 'success' : 'critical'}>
          {mensaje.texto}
        </Banner>
      )}

      <TextField
        label="Contraseña actual"
        id="passwordActual"
        type="password"
        required
        value={passwordActual}
        onChange={(e) => setPasswordActual(e.target.value)}
      />

      <TextField
        label="Contraseña nueva"
        id="passwordNueva"
        type="password"
        required
        minLength={8}
        value={passwordNueva}
        onChange={(e) => setPasswordNueva(e.target.value)}
      />

      <Button type="submit" variant="primary" disabled={loading}>
        {loading ? 'Actualizando…' : 'Cambiar contraseña'}
      </Button>
    </form>
  );
}
