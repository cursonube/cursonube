import Link from 'next/link';
import { Banner } from '@/components/ui/banner';

/** Documento 6, sección 4 (U1): pantalla mostrada en vez del contenido cuando el panel está bloqueado por impago. */
export function BloqueadoPorImpago() {
  return (
    <Banner>
      <p>El panel de gestión está bloqueado por falta de pago.</p>
      <Link href="/admin/facturacion" className="mt-1 inline-block underline">
        Ir a Plan y Facturación para regularizar tu suscripción
      </Link>
    </Banner>
  );
}
