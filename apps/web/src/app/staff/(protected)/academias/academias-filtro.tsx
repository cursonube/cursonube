'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const ESTADOS = ['Activa', 'Suspendida', 'Cancelada'] as const;

export function AcademiasFiltro({
  busqueda,
  estado,
}: {
  busqueda?: string;
  estado?: string;
}) {
  const router = useRouter();
  const [valorBusqueda, setValorBusqueda] = useState(busqueda ?? '');

  function aplicar(nuevaBusqueda: string, nuevoEstado?: string) {
    const params = new URLSearchParams();
    if (nuevaBusqueda) params.set('busqueda', nuevaBusqueda);
    if (nuevoEstado) params.set('estado', nuevoEstado);
    router.push(`/staff/academias${params.toString() ? `?${params.toString()}` : ''}`);
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <input
        placeholder="Buscar por nombre o subdominio…"
        value={valorBusqueda}
        onChange={(e) => setValorBusqueda(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') aplicar(valorBusqueda, estado);
        }}
        className="w-64 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <button
        type="button"
        onClick={() => aplicar(valorBusqueda, estado)}
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm transition hover:border-zinc-500 dark:border-zinc-700"
      >
        Buscar
      </button>
      <div className="flex gap-2 text-sm">
        <button
          type="button"
          onClick={() => aplicar(valorBusqueda, undefined)}
          className={`rounded-full px-3 py-1 transition ${!estado ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'border border-zinc-300 dark:border-zinc-700'}`}
        >
          Todas
        </button>
        {ESTADOS.map((opcion) => (
          <button
            key={opcion}
            type="button"
            onClick={() => aplicar(valorBusqueda, opcion)}
            className={`rounded-full px-3 py-1 transition ${estado === opcion ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'border border-zinc-300 dark:border-zinc-700'}`}
          >
            {opcion}
          </button>
        ))}
      </div>
    </div>
  );
}
