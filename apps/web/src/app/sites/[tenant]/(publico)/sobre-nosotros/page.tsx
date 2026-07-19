import { PaginaRenderer } from '../../_bloques/pagina-renderer';
import { obtenerPaginaPublica } from '../../_bloques/obtener-pagina';

export default async function SitioSobreNosotrosPage() {
  const pagina = await obtenerPaginaPublica('sobre-nosotros');
  return <PaginaRenderer bloques={pagina.bloques} />;
}
