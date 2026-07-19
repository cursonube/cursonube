import { PaginaRenderer } from '../../_bloques/pagina-renderer';
import { obtenerPaginaPublica } from '../../_bloques/obtener-pagina';

export default async function SitioContactoPage() {
  const pagina = await obtenerPaginaPublica('contacto');
  return <PaginaRenderer bloques={pagina.bloques} />;
}
