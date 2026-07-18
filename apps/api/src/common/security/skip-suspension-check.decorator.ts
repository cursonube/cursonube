import { SetMetadata } from '@nestjs/common';

export const SKIP_SUSPENSION_CHECK_KEY = 'skipSuspensionCheck';

/**
 * Documento 6, sección 4 (U1): al vencer el período de gracia se bloquea el
 * panel de gestión — pero el propio Owner necesita seguir pudiendo ver su
 * plan y regularizar el pago mientras está suspendido (si no, no hay forma
 * de salir del bloqueo desde el panel). Marca rutas exentas de ese chequeo.
 */
export const SkipSuspensionCheck = () =>
  SetMetadata(SKIP_SUSPENSION_CHECK_KEY, true);
