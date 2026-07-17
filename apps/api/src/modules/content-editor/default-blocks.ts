import { TipoBloque, TipoPagina } from '@prisma/client';

export interface DefaultBlockSpec {
  tipo: TipoBloque;
  propiedades: Record<string, unknown>;
}

/**
 * Composición por defecto de cada página fija — Documento 5, sección 4.
 * Contenido de placeholder editable, nunca una página en blanco (Documento
 * 1: "nunca debe existir una pantalla vacía"). `Login` no aparece: no tiene
 * composición de bloques definida en el documento (es una página de sistema).
 *
 * Es una función pura (sin acceso a datos) para que Tenancy pueda usarla al
 * aprovisionar una academia sin depender del resto de este módulo.
 */
export function getDefaultBlocksForPagina(
  tipo: TipoPagina,
  academiaNombre: string,
): DefaultBlockSpec[] {
  switch (tipo) {
    case 'Home':
      return [
        {
          tipo: 'Hero',
          propiedades: {
            titulo: `Bienvenido a ${academiaNombre}`,
            subtitulo: 'Aprendé a tu ritmo, con los cursos de esta academia.',
            textoBoton: 'Ver cursos',
            linkBoton: '/cursos',
            alineacion: 'centro',
          },
        },
        {
          tipo: 'Cursos',
          propiedades: {
            titulo: 'Cursos destacados',
            seleccion: 'destacados',
            columnas: 3,
          },
        },
        { tipo: 'Instructor', propiedades: { instructorIds: [] } },
        { tipo: 'Testimonios', propiedades: { testimonios: [] } },
        {
          tipo: 'Cta',
          propiedades: {
            texto: '¿Listo para empezar?',
            textoBoton: 'Ver cursos',
            linkBoton: '/cursos',
          },
        },
        {
          tipo: 'Footer',
          propiedades: {
            links: [],
            redes: [],
            copyright: `© ${academiaNombre}`,
          },
        },
      ];

    case 'Cursos':
      return [
        {
          tipo: 'Hero',
          propiedades: {
            titulo: 'Nuestros cursos',
            subtitulo: '',
            alineacion: 'centro',
          },
        },
        {
          tipo: 'Cursos',
          propiedades: { titulo: '', seleccion: 'todos', columnas: 3 },
        },
        {
          tipo: 'Footer',
          propiedades: {
            links: [],
            redes: [],
            copyright: `© ${academiaNombre}`,
          },
        },
      ];

    case 'SobreNosotros':
      return [
        {
          tipo: 'Hero',
          propiedades: {
            titulo: 'Sobre nosotros',
            subtitulo: '',
            alineacion: 'centro',
          },
        },
        {
          tipo: 'Texto',
          propiedades: {
            titulo: 'Nuestra historia',
            cuerpo: `Contanos qué hace especial a ${academiaNombre}.`,
            alineacion: 'izquierda',
          },
        },
        { tipo: 'Instructor', propiedades: { instructorIds: [] } },
        {
          tipo: 'Footer',
          propiedades: {
            links: [],
            redes: [],
            copyright: `© ${academiaNombre}`,
          },
        },
      ];

    case 'Contacto':
      return [
        {
          tipo: 'Texto',
          propiedades: {
            titulo: 'Contacto',
            cuerpo: '¿Tenés dudas? Escribinos.',
            alineacion: 'centro',
          },
        },
        {
          tipo: 'Contacto',
          propiedades: { textoDescriptivo: 'Te respondemos a la brevedad.' },
        },
        {
          tipo: 'Footer',
          propiedades: {
            links: [],
            redes: [],
            copyright: `© ${academiaNombre}`,
          },
        },
      ];

    case 'Faq':
      return [
        {
          tipo: 'Texto',
          propiedades: {
            titulo: 'Preguntas frecuentes',
            cuerpo: '',
            alineacion: 'centro',
          },
        },
        { tipo: 'Faq', propiedades: { preguntas: [] } },
        {
          tipo: 'Footer',
          propiedades: {
            links: [],
            redes: [],
            copyright: `© ${academiaNombre}`,
          },
        },
      ];

    case 'Politicas':
      return [
        {
          tipo: 'Texto',
          propiedades: {
            titulo: 'Políticas',
            cuerpo: 'Completá acá los términos y condiciones de tu academia.',
            alineacion: 'izquierda',
          },
        },
        {
          tipo: 'Footer',
          propiedades: {
            links: [],
            redes: [],
            copyright: `© ${academiaNombre}`,
          },
        },
      ];

    case 'Login':
    case 'Custom':
      return [];
  }
}
