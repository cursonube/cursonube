'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api-client';

interface Curso {
  id: string;
}

export default function NuevoCursoPage() {
  const router = useRouter();
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipoAcceso, setTipoAcceso] = useState<'Gratis' | 'PagoUnico'>('Gratis');
  const [precio, setPrecio] = useState('');
  const [moneda, setMoneda] = useState('ARS');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const curso = await apiFetch<Curso>('cursos', {
        method: 'POST',
        body: JSON.stringify({
          titulo,
          descripcion,
          tipoAcceso,
          ...(tipoAcceso === 'PagoUnico'
            ? { precioCentavos: Math.round(Number(precio) * 100), moneda }
            : {}),
        }),
      });
      router.push(`/admin/cursos/${curso.id}`);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'No se pudo crear el curso',
      );
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Crear curso</h1>

      <form onSubmit={handleSubmit} className="mt-6 max-w-lg space-y-4">
        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="space-y-1.5">
          <label htmlFor="titulo" className="text-sm font-medium">
            Título
          </label>
          <input
            id="titulo"
            required
            minLength={3}
            maxLength={150}
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="descripcion" className="text-sm font-medium">
            Descripción
          </label>
          <textarea
            id="descripcion"
            required
            minLength={10}
            maxLength={2000}
            rows={4}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Acceso</label>
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                checked={tipoAcceso === 'Gratis'}
                onChange={() => setTipoAcceso('Gratis')}
              />
              Gratis
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                checked={tipoAcceso === 'PagoUnico'}
                onChange={() => setTipoAcceso('PagoUnico')}
              />
              Pago único
            </label>
          </div>
        </div>

        {tipoAcceso === 'PagoUnico' && (
          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <label htmlFor="precio" className="text-sm font-medium">
                Precio
              </label>
              <input
                id="precio"
                type="number"
                min="0"
                step="0.01"
                required
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
            <div className="w-24 space-y-1.5">
              <label htmlFor="moneda" className="text-sm font-medium">
                Moneda
              </label>
              <input
                id="moneda"
                required
                maxLength={3}
                value={moneda}
                onChange={(e) => setMoneda(e.target.value.toUpperCase())}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900"
        >
          {loading ? 'Creando…' : 'Crear curso'}
        </button>
      </form>
    </div>
  );
}
