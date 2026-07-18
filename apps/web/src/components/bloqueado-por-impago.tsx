import Link from 'next/link';

/** Documento 6, sección 4 (U1): pantalla mostrada en vez del contenido cuando el panel está bloqueado por impago. */
export function BloqueadoPorImpago() {
  return (
    <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
      <p>El panel de gestión está bloqueado por falta de pago.</p>
      <Link href="/admin/facturacion" className="mt-1 inline-block underline">
        Ir a Plan y Facturación para regularizar tu suscripción
      </Link>
    </div>
  );
}
