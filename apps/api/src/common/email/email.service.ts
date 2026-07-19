import { Injectable, Logger } from '@nestjs/common';

const RESEND_API_URL = 'https://api.resend.com/emails';
const RESEND_API_KEY = process.env.RESEND_API_KEY ?? '';
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? 'Cursonube <notificaciones@cursonube.com>';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

/**
 * Documento 18, sección 2 — Resend detrás de una interfaz propia, mismo
 * patrón que Video/Payment/Billing Provider (Documento 2): para cambiar de
 * proveedor de email no hace falta tocar los servicios que disparan un
 * envío, solo esta clase.
 *
 * Nunca relanza: un email que falla no debe romper el flujo de negocio que
 * lo dispara — la Inscripcion o el Lead ya se guardaron en la base antes de
 * intentar el envío, y no hay nada que revertir si el email no sale.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async send(message: EmailMessage): Promise<void> {
    try {
      const response = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: message.to,
          subject: message.subject,
          html: message.html,
        }),
      });
      if (!response.ok) {
        const detalle = await response.text();
        this.logger.error(
          `Resend rechazó el envío a ${message.to} ("${message.subject}"): ${detalle}`,
        );
      }
    } catch (error) {
      this.logger.error(`No se pudo enviar el email a ${message.to}`, error);
    }
  }
}
