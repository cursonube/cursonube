import Link from 'next/link';
import type { Bloque } from './tipos';

/**
 * Documento 5, sección 2 — un único componente de render por tipo de
 * bloque, parametrizado por los design tokens de la plantilla activa
 * (--color-primario/--color-secundario, ver layout.tsx). No hay 5
 * implementaciones distintas por plantilla.
 */

function extractYoutubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.slice(1) || null;
    }
    if (parsed.hostname.endsWith('youtube.com')) {
      return parsed.searchParams.get('v');
    }
    return null;
  } catch {
    return null;
  }
}

export function HeroBloque({ propiedades }: { propiedades: Bloque['propiedades'] }) {
  const {
    titulo = '',
    subtitulo = '',
    imagenFondoUrl,
    textoBoton,
    linkBoton,
    alineacion = 'centro',
  } = propiedades;

  return (
    <section
      className="relative flex min-h-[360px] flex-col justify-center px-6 py-16"
      style={
        imagenFondoUrl
          ? {
              backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${imagenFondoUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : { backgroundColor: 'var(--color-primario)' }
      }
    >
      <div
        className={`mx-auto max-w-3xl ${alineacion === 'izquierda' ? 'text-left' : 'text-center'}`}
      >
        {titulo && (
          <h1
            className={`text-3xl font-semibold tracking-tight sm:text-4xl ${imagenFondoUrl ? 'text-white' : 'text-white'}`}
          >
            {titulo}
          </h1>
        )}
        {subtitulo && (
          <p className={`mt-3 text-lg ${imagenFondoUrl ? 'text-white/90' : 'text-white/90'}`}>
            {subtitulo}
          </p>
        )}
        {textoBoton && linkBoton && (
          <Link
            href={linkBoton}
            className="mt-6 inline-block rounded-md bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100"
          >
            {textoBoton}
          </Link>
        )}
      </div>
    </section>
  );
}

export function TextoBloque({ propiedades }: { propiedades: Bloque['propiedades'] }) {
  const { titulo, cuerpo = '', alineacion = 'centro' } = propiedades;
  return (
    <section
      className={`mx-auto max-w-2xl px-6 py-12 ${alineacion === 'izquierda' ? 'text-left' : 'text-center'}`}
    >
      {titulo && <h2 className="text-2xl font-semibold tracking-tight">{titulo}</h2>}
      <p className="mt-3 whitespace-pre-wrap text-zinc-600 dark:text-zinc-400">{cuerpo}</p>
    </section>
  );
}

export function ImagenBloque({ propiedades }: { propiedades: Bloque['propiedades'] }) {
  const { imagenUrl, textoAlt = '', linkUrl, ancho = 'completo' } = propiedades;
  if (!imagenUrl) return null;

  const contenedorClase = ancho === 'contenido' ? 'mx-auto max-w-2xl px-6' : 'w-full';
  // eslint-disable-next-line @next/next/no-img-element
  const img = <img src={imagenUrl} alt={textoAlt} className="w-full object-cover" />;

  return (
    <section className={`${contenedorClase} py-8`}>
      {linkUrl ? (
        <Link href={linkUrl}>{img}</Link>
      ) : (
        img
      )}
    </section>
  );
}

export function VideoBloque({ propiedades }: { propiedades: Bloque['propiedades'] }) {
  const videoId = propiedades.url ? extractYoutubeVideoId(propiedades.url) : null;
  if (!videoId) return null;

  return (
    <section className="mx-auto max-w-3xl px-6 py-8">
      <div className="aspect-video overflow-hidden rounded-lg">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}`}
          title="Video"
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </section>
  );
}

/**
 * Documento 5, sección 3 — selección de `AcademiaUsuario` con foto/bio: no
 * hay todavía esos campos en el modelo (la sección "Equipo" del panel nunca
 * se construyó), así que este bloque no tiene datos reales que mostrar
 * todavía. Se oculta en vez de mostrar una tarjeta vacía — "nunca pantalla
 * vacía" se resuelve acá no mostrando el bloque, no inventando datos.
 */
export function InstructorBloque() {
  return null;
}

export function TestimoniosBloque({ propiedades }: { propiedades: Bloque['propiedades'] }) {
  const testimonios: Array<{ nombre?: string; foto?: string; texto?: string }> =
    propiedades.testimonios ?? [];
  if (testimonios.length === 0) return null;

  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {testimonios.map((t, i) => (
          <div key={i} className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">&ldquo;{t.texto}&rdquo;</p>
            <div className="mt-3 flex items-center gap-2">
              {t.foto && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.foto} alt="" className="h-8 w-8 rounded-full object-cover" />
              )}
              <p className="text-sm font-medium">{t.nombre}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function FaqBloque({ propiedades }: { propiedades: Bloque['propiedades'] }) {
  const preguntas: Array<{ pregunta?: string; respuesta?: string }> =
    propiedades.preguntas ?? [];
  if (preguntas.length === 0) return null;

  return (
    <section className="mx-auto max-w-2xl px-6 py-12">
      <div className="space-y-3">
        {preguntas.map((p, i) => (
          <details key={i} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <summary className="cursor-pointer font-medium">{p.pregunta}</summary>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{p.respuesta}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function CtaBloque({ propiedades }: { propiedades: Bloque['propiedades'] }) {
  const { texto = '', textoBoton, linkBoton } = propiedades;
  return (
    <section className="px-6 py-12 text-center" style={{ backgroundColor: 'var(--color-secundario)' }}>
      {texto && <p className="text-xl font-semibold text-white">{texto}</p>}
      {textoBoton && linkBoton && (
        <Link
          href={linkBoton}
          className="mt-5 inline-block rounded-md bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100"
        >
          {textoBoton}
        </Link>
      )}
    </section>
  );
}

export function FooterBloque({ propiedades }: { propiedades: Bloque['propiedades'] }) {
  const links: Array<{ label?: string; url?: string }> = propiedades.links ?? [];
  const redes: Array<{ plataforma?: string; url?: string }> = propiedades.redes ?? [];
  const copyright = propiedades.copyright ?? '';

  return (
    <footer className="border-t border-zinc-200 px-6 py-8 text-sm text-zinc-500 dark:border-zinc-800">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p>{copyright}</p>
        <nav className="flex gap-4">
          {links.map((link, i) => (
            <Link key={i} href={link.url ?? '#'} className="hover:text-zinc-900 dark:hover:text-zinc-100">
              {link.label}
            </Link>
          ))}
        </nav>
        {redes.length > 0 && (
          <div className="flex gap-4">
            {redes.map((red, i) => (
              <a
                key={i}
                href={red.url}
                target="_blank"
                rel="noreferrer"
                className="hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                {red.plataforma}
              </a>
            ))}
          </div>
        )}
      </div>
    </footer>
  );
}
