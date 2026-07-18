'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';

interface DatosWizard {
  email: string;
  password: string;
  nombre: string;
  subdominio: string;
  subdominioTocado: boolean;
  plantillaId: string;
  logoUrl: string;
  colorPrimario: string;
  colorSecundario: string;
  imagenPrincipalUrl: string;
  tituloCurso: string;
  descripcionCurso: string;
}

const DATOS_INICIALES: DatosWizard = {
  email: '',
  password: '',
  nombre: '',
  subdominio: '',
  subdominioTocado: false,
  plantillaId: '',
  logoUrl: '',
  colorPrimario: '#4F46E5',
  colorSecundario: '#111827',
  imagenPrincipalUrl: '',
  tituloCurso: '',
  descripcionCurso: '',
};

const STORAGE_KEY = 'cursonube_registro_wizard';

/** Mismo criterio que `slugify` del backend (apps/api/src/common/slug/slugify.ts). */
function slugify(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

interface Plantilla {
  id: string;
  nombre: 'Creator' | 'Academy' | 'Business' | 'Modern' | 'Dark';
}

const DESCRIPCION_PLANTILLA: Record<Plantilla['nombre'], string> = {
  Creator: 'Cálida y personal, ideal para un creador individual.',
  Academy: 'Institucional y confiable, para academias establecidas.',
  Business: 'Corporativa y directa, orientada a resultados.',
  Modern: 'Minimalista, con foco en el contenido.',
  Dark: 'Tema oscuro, look moderno y llamativo.',
};

function StepShell({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{titulo}</h1>
        {descripcion && (
          <p className="mt-1 text-sm text-zinc-500">{descripcion}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function Botones({
  onAtras,
  onSiguiente,
  siguienteLabel = 'Continuar',
  siguienteDisabled,
  loading,
}: {
  onAtras?: () => void;
  onSiguiente: () => void;
  siguienteLabel?: string;
  siguienteDisabled?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="flex items-center justify-between pt-2">
      {onAtras ? (
        <button
          type="button"
          onClick={onAtras}
          className="text-sm text-zinc-500 transition hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          Atrás
        </button>
      ) : (
        <span />
      )}
      <button
        type="button"
        onClick={onSiguiente}
        disabled={siguienteDisabled || loading}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900"
      >
        {loading ? 'Guardando…' : siguienteLabel}
      </button>
    </div>
  );
}

const inputClass =
  'w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900';

export function RegistroWizard() {
  const [step, setStep] = useState(0);
  const [datos, setDatos] = useState<DatosWizard>(DATOS_INICIALES);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [disponibilidad, setDisponibilidad] = useState<{
    checking: boolean;
    disponible: boolean | null;
    motivo?: string;
  }>({ checking: false, disponible: null });

  // Casos borde (Documento 4, Flujo 1): "botón atrás / refresh no pierde
  // datos". La contraseña deliberadamente no se persiste acá (no guardar un
  // secreto en texto plano en sessionStorage), el resto sí.
  useEffect(() => {
    const guardado = sessionStorage.getItem(STORAGE_KEY);
    if (guardado) {
      const resto = JSON.parse(guardado);
      delete resto.password;
      setDatos((prev) => ({ ...prev, ...resto }));
    }
  }, []);

  useEffect(() => {
    const aPersistir: Partial<DatosWizard> = { ...datos };
    delete aPersistir.password;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(aPersistir));
  }, [datos]);

  useEffect(() => {
    apiFetch<Plantilla[]>('plantillas')
      .then(setPlantillas)
      .catch(() => setPlantillas([]));
  }, []);

  // Paso 1→2: sugiere subdominio a partir del nombre, mientras el usuario no
  // haya editado el subdominio a mano todavía (Documento 4, Flujo 1, paso 1).
  useEffect(() => {
    if (!datos.subdominioTocado) {
      setDatos((prev) => ({ ...prev, subdominio: slugify(prev.nombre) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datos.nombre]);

  // Chequeo de disponibilidad en tiempo real (debounced).
  useEffect(() => {
    if (step !== 2 || datos.subdominio.length < 3) {
      return;
    }
    setDisponibilidad({ checking: true, disponible: null });
    const timeout = setTimeout(() => {
      apiFetch<{ disponible: boolean; motivo?: string }>(
        `academias/disponibilidad?subdominio=${encodeURIComponent(datos.subdominio)}`,
      )
        .then((res) => setDisponibilidad({ checking: false, ...res }))
        .catch(() =>
          setDisponibilidad({
            checking: false,
            disponible: false,
            motivo: 'No se pudo verificar el subdominio',
          }),
        );
    }, 400);
    return () => clearTimeout(timeout);
  }, [datos.subdominio, step]);

  function set<K extends keyof DatosWizard>(key: K, value: DatosWizard[K]) {
    setDatos((prev) => ({ ...prev, [key]: value }));
  }

  async function finalizar() {
    setError(null);
    setSubmitting(true);
    try {
      await apiFetch('academias', {
        method: 'POST',
        body: JSON.stringify({
          email: datos.email,
          password: datos.password,
          nombre: datos.nombre,
          subdominio: datos.subdominio,
          plantillaId: datos.plantillaId,
          logoUrl: datos.logoUrl || undefined,
          colorPrimario: datos.colorPrimario,
          colorSecundario: datos.colorSecundario,
          imagenPrincipalUrl: datos.imagenPrincipalUrl || undefined,
        }),
      });

      sessionStorage.removeItem(STORAGE_KEY);

      const params = new URLSearchParams({ email: datos.email, bienvenida: '1' });
      if (datos.tituloCurso) {
        params.set('tituloSugerido', datos.tituloCurso);
        if (datos.descripcionCurso) {
          params.set('descripcionSugerida', datos.descripcionCurso);
        }
      }
      // Documento 4: "Al finalizar, redirección a subdominio.cursonube.com".
      // Las cookies de sesión están scoped al hostname exacto (Documento 7),
      // así que no se puede llegar ya logueado desde el dominio raíz — se
      // pide iniciar sesión una vez más con la contraseña recién creada, ya
      // en el subdominio real.
      window.location.href = `${window.location.protocol}//${datos.subdominio}.${window.location.host}/admin/login?${params.toString()}`;
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setStep(2);
        setError(`${err.message} — probá con "${datos.subdominio}-2"`);
      } else {
        setError(
          err instanceof ApiError
            ? err.message
            : 'No se pudo crear la academia — intentá de nuevo',
        );
      }
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-10">
      <p className="mb-6 text-center text-xs font-medium tracking-wide text-zinc-400 uppercase">
        Paso {step + 1} de 6
      </p>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
          {error}
        </p>
      )}

      {step === 0 && (
        <StepShell
          titulo="Creá tu cuenta"
          descripcion="Vas a ser el Owner de tu academia."
        >
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                required
                value={datos.email}
                onChange={(e) => set('email', e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Contraseña</label>
              <input
                type="password"
                required
                minLength={8}
                value={datos.password}
                onChange={(e) => set('password', e.target.value)}
                className={inputClass}
              />
            </div>
            <p className="text-xs text-zinc-500">
              Al continuar aceptás los Términos de Servicio y la Política de
              Privacidad de Cursonube.
            </p>
          </div>
          <Botones
            onSiguiente={() => setStep(1)}
            siguienteDisabled={!datos.email || datos.password.length < 8}
          />
        </StepShell>
      )}

      {step === 1 && (
        <StepShell titulo="¿Cómo se llama tu academia?">
          <input
            required
            autoFocus
            value={datos.nombre}
            onChange={(e) => set('nombre', e.target.value)}
            placeholder="Mi Academia de Marketing"
            className={inputClass}
          />
          <Botones
            onAtras={() => setStep(0)}
            onSiguiente={() => setStep(2)}
            siguienteDisabled={datos.nombre.trim().length < 2}
          />
        </StepShell>
      )}

      {step === 2 && (
        <StepShell
          titulo="Elegí tu subdominio"
          descripcion="Así se va a ver la URL de tu academia."
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <input
                required
                value={datos.subdominio}
                onChange={(e) => {
                  set('subdominio', slugify(e.target.value));
                  set('subdominioTocado', true);
                }}
                className={inputClass}
              />
              <span className="text-sm text-zinc-500">
                .{process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'cursonube.com'}
              </span>
            </div>
            {disponibilidad.checking && (
              <p className="text-xs text-zinc-500">Verificando…</p>
            )}
            {!disponibilidad.checking && disponibilidad.disponible === true && (
              <p className="text-xs text-green-700 dark:text-green-400">
                Disponible
              </p>
            )}
            {!disponibilidad.checking && disponibilidad.disponible === false && (
              <p className="text-xs text-red-700 dark:text-red-400">
                {disponibilidad.motivo}
              </p>
            )}
          </div>
          <Botones
            onAtras={() => setStep(1)}
            onSiguiente={() => setStep(3)}
            siguienteDisabled={
              datos.subdominio.length < 3 || disponibilidad.disponible !== true
            }
          />
        </StepShell>
      )}

      {step === 3 && (
        <StepShell titulo="Elegí una plantilla">
          <div className="grid grid-cols-1 gap-2">
            {plantillas.map((plantilla) => (
              <button
                type="button"
                key={plantilla.id}
                onClick={() => set('plantillaId', plantilla.id)}
                className={`rounded-md border px-4 py-3 text-left text-sm transition ${
                  datos.plantillaId === plantilla.id
                    ? 'border-zinc-900 ring-1 ring-zinc-900 dark:border-white dark:ring-white'
                    : 'border-zinc-300 hover:border-zinc-500 dark:border-zinc-700'
                }`}
              >
                <p className="font-medium">{plantilla.nombre}</p>
                <p className="text-xs text-zinc-500">
                  {DESCRIPCION_PLANTILLA[plantilla.nombre]}
                </p>
              </button>
            ))}
          </div>
          <Botones
            onAtras={() => setStep(2)}
            onSiguiente={() => setStep(4)}
            siguienteDisabled={!datos.plantillaId}
          />
        </StepShell>
      )}

      {step === 4 && (
        <StepShell
          titulo="Personalizá tu marca"
          descripcion="Todo esto es opcional — podés cambiarlo después."
        >
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Logo (URL)</label>
              <input
                value={datos.logoUrl}
                onChange={(e) => set('logoUrl', e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Color primario</label>
                <input
                  type="color"
                  value={datos.colorPrimario}
                  onChange={(e) => set('colorPrimario', e.target.value)}
                  className="h-9 w-16 rounded-md border border-zinc-300 dark:border-zinc-700"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Color secundario</label>
                <input
                  type="color"
                  value={datos.colorSecundario}
                  onChange={(e) => set('colorSecundario', e.target.value)}
                  className="h-9 w-16 rounded-md border border-zinc-300 dark:border-zinc-700"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Imagen principal (URL)
              </label>
              <input
                value={datos.imagenPrincipalUrl}
                onChange={(e) => set('imagenPrincipalUrl', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <Botones onAtras={() => setStep(3)} onSiguiente={() => setStep(5)} />
        </StepShell>
      )}

      {step === 5 && (
        <StepShell
          titulo="Creá tu primer curso"
          descripcion="Opcional — si lo omitís, tu panel te va a guiar para crearlo después."
        >
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Título</label>
              <input
                value={datos.tituloCurso}
                onChange={(e) => set('tituloCurso', e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Descripción</label>
              <input
                value={datos.descripcionCurso}
                onChange={(e) => set('descripcionCurso', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <Botones
            onAtras={() => setStep(4)}
            onSiguiente={finalizar}
            siguienteLabel="Crear mi academia"
            loading={submitting}
          />
        </StepShell>
      )}
    </main>
  );
}
