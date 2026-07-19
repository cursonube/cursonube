/**
 * Documento 5, sección 5 — `propiedades` es JSONB tolerante a campos
 * faltantes (M3): cada componente de bloque debe aplicar sus propios
 * valores por defecto, nunca asumir que un campo está presente.
 */
export interface Bloque {
  id: string;
  tipo:
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
  orden: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  propiedades: Record<string, any>;
}

export interface PaginaPublica {
  id: string;
  tipo: string;
  titulo: string;
  bloques: Bloque[];
}
