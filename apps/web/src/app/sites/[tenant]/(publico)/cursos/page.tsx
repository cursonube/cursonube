import { PaginaRenderer } from '../../_bloques/pagina-renderer';
import { obtenerPaginaPublica } from '../../_bloques/obtener-pagina';

/** Documento 5 — catálogo de cursos de la academia (distinto de /cursos/[slug], la landing de un curso puntual). */
export default async function SitioCursosPage() {
  const pagina = await obtenerPaginaPublica('cursos');
  return <PaginaRenderer bloques={pagina.bloques} />;
}
