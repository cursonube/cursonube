import { PaginaRenderer } from '../_bloques/pagina-renderer';
import { obtenerPaginaPublica } from '../_bloques/obtener-pagina';

/** Documento 5 — home de la academia (academia.cursonube.com). */
export default async function SitioHomePage() {
  const pagina = await obtenerPaginaPublica('');
  return <PaginaRenderer bloques={pagina.bloques} />;
}
