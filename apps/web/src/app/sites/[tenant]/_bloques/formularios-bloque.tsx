'use client';

import { useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { Bloque } from './tipos';

const inputClass =
  'w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900';

/** Documento 5, sección 6 — captura de Newsletter, persiste como Lead. */
export function NewsletterBloque({ propiedades }: { propiedades: Bloque['propiedades'] }) {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch('leads', {
        method: 'POST',
        body: JSON.stringify({ origen: 'Newsletter', email }),
      });
      setEnviado(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo suscribir');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-lg px-6 py-12 text-center">
      {propiedades.textoDescriptivo && (
        <p className="text-zinc-600 dark:text-zinc-400">{propiedades.textoDescriptivo}</p>
      )}
      {enviado ? (
        <p className="mt-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-400">
          ¡Gracias por suscribirte!
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
          {error && <p className="w-full text-sm text-red-700 dark:text-red-400">{error}</p>}
          <input
            type="email"
            required
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={loading}
            className="shrink-0 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900"
          >
            {loading ? 'Enviando…' : 'Suscribirme'}
          </button>
        </form>
      )}
    </section>
  );
}

/** Documento 5, sección 6 — formulario de Contacto, persiste como Lead. */
export function ContactoBloque({ propiedades }: { propiedades: Bloque['propiedades'] }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch('leads', {
        method: 'POST',
        body: JSON.stringify({ origen: 'Contacto', email, nombre, mensaje }),
      });
      setEnviado(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo enviar el mensaje');
    } finally {
      setLoading(false);
    }
  }

  if (enviado) {
    return (
      <section className="mx-auto max-w-lg px-6 py-12 text-center">
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-400">
          ¡Gracias! Te vamos a responder a la brevedad.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-lg px-6 py-12">
      {propiedades.textoDescriptivo && (
        <p className="mb-4 text-center text-zinc-600 dark:text-zinc-400">
          {propiedades.textoDescriptivo}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
            {error}
          </p>
        )}
        <input
          required
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className={inputClass}
        />
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
        <textarea
          required
          rows={4}
          placeholder="Mensaje"
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          className={inputClass}
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900"
        >
          {loading ? 'Enviando…' : 'Enviar'}
        </button>
      </form>
    </section>
  );
}
