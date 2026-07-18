import { RegistroWizard } from './registro-wizard';

/**
 * Wizard de onboarding (Documento 1 / Documento 4, Flujo 1), vive en el
 * dominio raíz porque todavía no existe ningún subdominio al cual redirigir
 * (Documento 17, sección 2/4).
 */
export default function RegistroPage() {
  return <RegistroWizard />;
}
