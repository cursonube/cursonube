'use client';

import { useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { CursoPublico } from './page';

function formatPrecio(centavos: number | null, moneda: string | null) {
  if (centavos === null) {
    return 'Gratis';
  }
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: moneda ?? 'ARS',
  }).format(centavos / 100);
}

function Sylabo({ modulos }: { modulos: CursoPublico['modulos'] }) {
  if (modulos.length === 0) {
    return null;
  }
  return (
    <div className="mt-8">
      <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide">
        Contenido del curso
      </h2>
      <ol className="mt-3 space-y-4">
        {modulos.map((modulo) => (
          <li key={modulo.orden}>
            <p className="font-medium">{modulo.titulo}</p>
            <ul className="mt-1 space-y-1 pl-4">
              {modulo.clases.map((clase) => (
                <li
                  key={clase.orden}
                  className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400"
                >
                  <span>{clase.titulo}</span>
                  {clase.duracionEstimadaMinutos != null && (
                    <span className="text-zinc-400 dark:text-zinc-500">
                      {clase.duracionEstimadaMinutos} min
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * Documento 4, Flujo 5 — inscripción a un curso Gratis: síncrono, confirma
 * en el momento. `requierePassword` en la respuesta indica que la cuenta
 * quedó creada sin contraseña todavía (Documento 1, D6) — el flujo para
 * definirla desde el sitio público no está construido todavía, así que acá
 * solo se informa, no se redirige a un paso que todavía no existe.
 */
function InscribirseForm({ cursoId }: { cursoId: string }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const resultado = await apiFetch<{ requierePassword: boolean }>(
        `cursos/${cursoId}/inscripciones`,
        { method: 'POST', body: JSON.stringify({ nombre, email }) },
      );
      setMensaje(
        resultado.requierePassword
          ? `¡Listo! Te inscribiste con ${email}. Pronto vas a poder crear tu contraseña para acceder a tu panel de alumno.`
          : '¡Listo! Ya tenés acceso al curso desde tu panel de alumno.',
      );
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'No se pudo completar la inscripción',
      );
    } finally {
      setLoading(false);
    }
  }

  if (mensaje) {
    return (
      <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-400">
        {mensaje}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
          {error}
        </p>
      )}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Nombre</label>
        <input
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
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
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900"
      >
        {loading ? 'Inscribiendo…' : 'Inscribirme gratis'}
      </button>
    </form>
  );
}

/**
 * Documento 8, sección 3 — checkout Pro: crea la preferencia y redirige el
 * browser al Checkout de Mercado Pago. La confirmación real llega después
 * por webhook (Documento 8, sección 3, punto 3), nunca acá.
 */
function ComprarForm({ cursoId }: { cursoId: string }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const resultado = await apiFetch<{ initPoint?: string }>(
        `cursos/${cursoId}/checkout`,
        { method: 'POST', body: JSON.stringify({ nombre, email }) },
      );
      if (!resultado.initPoint) {
        throw new Error('Mercado Pago no devolvió un link de pago');
      }
      window.location.href = resultado.initPoint;
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'No se pudo iniciar la compra',
      );
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
          {error}
        </p>
      )}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Nombre</label>
        <input
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
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
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900"
      >
        {loading ? 'Redirigiendo a Mercado Pago…' : 'Comprar ahora'}
      </button>
    </form>
  );
}

export function CursoPublicoView({ curso }: { curso: CursoPublico }) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10">
      {curso.imagenPortadaUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={curso.imagenPortadaUrl}
          alt=""
          className="mb-6 aspect-video w-full rounded-lg object-cover"
        />
      )}

      <h1 className="text-2xl font-semibold tracking-tight">{curso.titulo}</h1>
      <p className="mt-1 text-lg font-medium text-zinc-700 dark:text-zinc-300">
        {formatPrecio(curso.precioCentavos, curso.moneda)}
      </p>
      <p className="mt-4 whitespace-pre-wrap text-zinc-600 dark:text-zinc-400">
        {curso.descripcion}
      </p>

      <Sylabo modulos={curso.modulos} />

      <div className="mt-8 max-w-sm">
        {curso.tipoAcceso === 'Gratis' ? (
          <InscribirseForm cursoId={curso.id} />
        ) : curso.puedeComprarse ? (
          <ComprarForm cursoId={curso.id} />
        ) : (
          <p className="rounded-md bg-zinc-100 px-3 py-2 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            Este curso todavía no está disponible para la compra.
          </p>
        )}
      </div>
    </main>
  );
}
