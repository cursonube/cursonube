/**
 * Documento 5 (Editor de Bloques), sección 3 — catálogo cerrado de 12 tipos
 * de bloque. El backend guarda `propiedades` como JSONB sin validar su
 * forma por tipo todavía (decisión M3, validación Zod por tipo queda
 * pendiente del lado de la API) — este registro es hoy la única fuente de
 * verdad de qué campos tiene cada tipo, y vive en el frontend.
 */
export type TipoBloque =
  | 'Hero'
  | 'Texto'
  | 'Imagen'
  | 'Video'
  | 'Cursos'
  | 'Instructor'
  | 'Testimonios'
  | 'Faq'
  | 'Cta'
  | 'Newsletter'
  | 'Contacto'
  | 'Footer';

export type FieldType = 'text' | 'textarea' | 'url' | 'number' | 'select';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
}

export interface ListFieldDef {
  key: string;
  label: string;
  itemFields: FieldDef[];
}

export interface BlockTypeDef {
  tipo: TipoBloque;
  label: string;
  fields: FieldDef[];
  listFields: ListFieldDef[];
}

export const BLOCK_TYPES: BlockTypeDef[] = [
  {
    tipo: 'Hero',
    label: 'Hero',
    fields: [
      { key: 'titulo', label: 'Título', type: 'text' },
      { key: 'subtitulo', label: 'Subtítulo', type: 'text' },
      { key: 'imagenFondoUrl', label: 'Imagen de fondo (URL)', type: 'url' },
      { key: 'textoBoton', label: 'Texto del botón', type: 'text' },
      { key: 'linkBoton', label: 'Link del botón', type: 'url' },
      {
        key: 'alineacion',
        label: 'Alineación',
        type: 'select',
        options: ['centro', 'izquierda'],
      },
    ],
    listFields: [],
  },
  {
    tipo: 'Texto',
    label: 'Texto',
    fields: [
      { key: 'titulo', label: 'Título', type: 'text' },
      { key: 'cuerpo', label: 'Cuerpo', type: 'textarea' },
      {
        key: 'alineacion',
        label: 'Alineación',
        type: 'select',
        options: ['centro', 'izquierda'],
      },
    ],
    listFields: [],
  },
  {
    tipo: 'Imagen',
    label: 'Imagen',
    fields: [
      { key: 'imagenUrl', label: 'Imagen (URL)', type: 'url' },
      { key: 'textoAlt', label: 'Texto alternativo', type: 'text' },
      { key: 'linkUrl', label: 'Link (opcional)', type: 'url' },
      {
        key: 'ancho',
        label: 'Ancho',
        type: 'select',
        options: ['completo', 'contenido'],
      },
    ],
    listFields: [],
  },
  {
    tipo: 'Video',
    label: 'Video',
    fields: [{ key: 'url', label: 'URL del video (YouTube No Listado)', type: 'url' }],
    listFields: [],
  },
  {
    tipo: 'Cursos',
    label: 'Cursos',
    fields: [
      { key: 'titulo', label: 'Título de sección', type: 'text' },
      {
        key: 'seleccion',
        label: 'Selección',
        type: 'select',
        options: ['destacados', 'todos'],
      },
      { key: 'columnas', label: 'Columnas', type: 'number' },
    ],
    listFields: [],
  },
  {
    tipo: 'Instructor',
    label: 'Instructor',
    fields: [
      {
        key: 'instructorIds',
        label: 'IDs de instructor (separados por coma) — el listado de Equipo todavía no existe',
        type: 'text',
      },
    ],
    listFields: [],
  },
  {
    tipo: 'Testimonios',
    label: 'Testimonios',
    fields: [],
    listFields: [
      {
        key: 'testimonios',
        label: 'Testimonios',
        itemFields: [
          { key: 'nombre', label: 'Nombre', type: 'text' },
          { key: 'foto', label: 'Foto (URL)', type: 'url' },
          { key: 'texto', label: 'Texto', type: 'textarea' },
        ],
      },
    ],
  },
  {
    tipo: 'Faq',
    label: 'FAQ',
    fields: [],
    listFields: [
      {
        key: 'preguntas',
        label: 'Preguntas',
        itemFields: [
          { key: 'pregunta', label: 'Pregunta', type: 'text' },
          { key: 'respuesta', label: 'Respuesta', type: 'textarea' },
        ],
      },
    ],
  },
  {
    tipo: 'Cta',
    label: 'CTA',
    fields: [
      { key: 'texto', label: 'Texto', type: 'text' },
      { key: 'textoBoton', label: 'Texto del botón', type: 'text' },
      { key: 'linkBoton', label: 'Link del botón', type: 'url' },
    ],
    listFields: [],
  },
  {
    tipo: 'Newsletter',
    label: 'Newsletter',
    fields: [{ key: 'textoDescriptivo', label: 'Texto descriptivo', type: 'textarea' }],
    listFields: [],
  },
  {
    tipo: 'Contacto',
    label: 'Contacto',
    fields: [{ key: 'textoDescriptivo', label: 'Texto descriptivo', type: 'textarea' }],
    listFields: [],
  },
  {
    tipo: 'Footer',
    label: 'Footer',
    fields: [{ key: 'copyright', label: 'Copyright', type: 'text' }],
    listFields: [
      {
        key: 'links',
        label: 'Links de navegación',
        itemFields: [
          { key: 'label', label: 'Texto', type: 'text' },
          { key: 'url', label: 'URL', type: 'url' },
        ],
      },
      {
        key: 'redes',
        label: 'Redes sociales',
        itemFields: [
          { key: 'plataforma', label: 'Plataforma', type: 'text' },
          { key: 'url', label: 'URL', type: 'url' },
        ],
      },
    ],
  },
];

export function getBlockTypeDef(tipo: string): BlockTypeDef {
  const def = BLOCK_TYPES.find((b) => b.tipo === tipo);
  if (!def) {
    throw new Error(`Tipo de bloque desconocido: ${tipo}`);
  }
  return def;
}
