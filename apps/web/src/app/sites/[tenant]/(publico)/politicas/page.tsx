import { PaginaRenderer } from '../../_bloques/pagina-renderer';
import { obtenerPaginaPublica } from '../../_bloques/obtener-pagina';

export default async function SitioPoliticasPage() {
  const pagina = await obtenerPaginaPublica('politicas');
  return <PaginaRenderer bloques={pagina.bloques} />;
}
