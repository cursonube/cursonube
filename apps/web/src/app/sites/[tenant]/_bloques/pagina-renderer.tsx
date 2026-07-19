import {
  CtaBloque,
  FaqBloque,
  FooterBloque,
  HeroBloque,
  ImagenBloque,
  InstructorBloque,
  TestimoniosBloque,
  TextoBloque,
  VideoBloque,
} from './bloques-estaticos';
import { CursosBloque } from './cursos-bloque';
import { ContactoBloque, NewsletterBloque } from './formularios-bloque';
import type { Bloque } from './tipos';

/**
 * Documento 5, sección 2 — motor de renderizado: un registro central que
 * mapea tipo de bloque -> componente, igual que el "registro de bloques"
 * que el documento pide para poder agregar tipos nuevos sin tocar los
 * existentes.
 */
export function PaginaRenderer({ bloques }: { bloques: Bloque[] }) {
  return (
    <>
      {bloques.map((bloque) => {
        switch (bloque.tipo) {
          case 'Hero':
            return <HeroBloque key={bloque.id} propiedades={bloque.propiedades} />;
          case 'Texto':
            return <TextoBloque key={bloque.id} propiedades={bloque.propiedades} />;
          case 'Imagen':
            return <ImagenBloque key={bloque.id} propiedades={bloque.propiedades} />;
          case 'Video':
            return <VideoBloque key={bloque.id} propiedades={bloque.propiedades} />;
          case 'Cursos':
            return <CursosBloque key={bloque.id} propiedades={bloque.propiedades} />;
          case 'Instructor':
            return <InstructorBloque key={bloque.id} />;
          case 'Testimonios':
            return <TestimoniosBloque key={bloque.id} propiedades={bloque.propiedades} />;
          case 'Faq':
            return <FaqBloque key={bloque.id} propiedades={bloque.propiedades} />;
          case 'Cta':
            return <CtaBloque key={bloque.id} propiedades={bloque.propiedades} />;
          case 'Newsletter':
            return <NewsletterBloque key={bloque.id} propiedades={bloque.propiedades} />;
          case 'Contacto':
            return <ContactoBloque key={bloque.id} propiedades={bloque.propiedades} />;
          case 'Footer':
            return <FooterBloque key={bloque.id} propiedades={bloque.propiedades} />;
          default:
            return null;
        }
      })}
    </>
  );
}
