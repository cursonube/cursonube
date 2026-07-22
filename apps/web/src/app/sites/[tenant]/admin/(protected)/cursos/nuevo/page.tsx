'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Textarea } from '@/components/ui/textarea';
import { Banner } from '@/components/ui/banner';

interface Curso {
  id: string;
}

/**
 * `tituloSugerido`/`descripcionSugerida`: handoff del paso 5 (opcional) del
 * wizard de onboarding (Documento 4, Flujo 1) — ese paso no puede crear el
 * curso directamente (todavía no hay sesión ni tenant en ese punto), así que
 * solo precarga este formulario una vez que el Owner ya inició sesión acá.
 */
export default function NuevoCursoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [titulo, setTitulo] = useState(searchParams.get('tituloSugerido') ?? '');
  const [descripcion, setDescripcion] = useState(
    searchParams.get('descripcionSugerida') ?? '',
  );
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
      <h1 className="text-[length:var(--p-text-xl)] font-[650] tracking-tight text-[var(--p-color-text)]">
        Crear curso
      </h1>

      <form onSubmit={handleSubmit} className="mt-6 max-w-lg space-y-4">
        {error && <Banner>{error}</Banner>}

        <TextField
          label="Título"
          id="titulo"
          required
          minLength={3}
          maxLength={150}
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />

        <Textarea
          label="Descripción"
          id="descripcion"
          required
          minLength={10}
          maxLength={2000}
          rows={4}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />

        <div className="space-y-1.5">
          <label className="text-[13px] font-[550] text-[var(--p-color-text)]">
            Acceso
          </label>
          <div className="flex gap-4 text-[13px] text-[var(--p-color-text)]">
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
            <div className="flex-1">
              <TextField
                label="Precio"
                id="precio"
                type="number"
                min="0"
                step="0.01"
                required
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
              />
            </div>
            <div className="w-24">
              <TextField
                label="Moneda"
                id="moneda"
                required
                maxLength={3}
                value={moneda}
                onChange={(e) => setMoneda(e.target.value.toUpperCase())}
              />
            </div>
          </div>
        )}

        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Creando…' : 'Crear curso'}
        </Button>
      </form>
    </div>
  );
}
