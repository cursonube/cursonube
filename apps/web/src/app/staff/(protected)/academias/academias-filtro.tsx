'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';

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
      <TextField
        placeholder="Buscar por nombre o subdominio…"
        value={valorBusqueda}
        onChange={(e) => setValorBusqueda(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') aplicar(valorBusqueda, estado);
        }}
        className="w-64"
      />
      <Button type="button" onClick={() => aplicar(valorBusqueda, estado)}>
        Buscar
      </Button>
      <div className="flex gap-2">
        <Button
          type="button"
          variant={!estado ? 'primary' : 'secondary'}
          onClick={() => aplicar(valorBusqueda, undefined)}
          className="!rounded-[var(--p-radius-full)]"
        >
          Todas
        </Button>
        {ESTADOS.map((opcion) => (
          <Button
            key={opcion}
            type="button"
            variant={estado === opcion ? 'primary' : 'secondary'}
            onClick={() => aplicar(valorBusqueda, opcion)}
            className="!rounded-[var(--p-radius-full)]"
          >
            {opcion}
          </Button>
        ))}
      </div>
    </div>
  );
}
