import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { generateId } from '../../common/id/generate-id';
import { EncryptionService } from '../../common/security/encryption.service';
import { JWT_ACCESS_SECRET } from '../../common/security/jwt.config';
import {
  TENANT_SCOPED_PRISMA,
  TenantScopedPrismaClient,
} from '../../common/prisma/tenant-scoped-prisma.provider';
import { TenantContextService } from '../../common/tenant-context/tenant-context.service';
import {
  MP_AUTHORIZATION_URL,
  MP_CLIENT_ID,
  MP_CLIENT_SECRET,
  MP_REDIRECT_URI,
  MP_TOKEN_URL,
} from './mercado-pago.config';

interface MpOAuthStatePayload {
  tenantId: string;
  purpose: 'mp-oauth-state';
}

interface MpTokenResponse {
  access_token: string;
  user_id: number;
  refresh_token?: string;
  [key: string]: unknown;
}

/**
 * Documento 8, sección 2 — conexión OAuth del creador con su propia cuenta
 * de Mercado Pago. Cursonube usa Client ID/Secret que identifican al
 * *software*, no a una cuenta que reciba dinero (aclarado en la
 * conversación con el usuario) — el dinero siempre queda en la cuenta que
 * se conecta acá.
 */
@Injectable()
export class CuentaPagoCreadorService {
  private readonly logger = new Logger(CuentaPagoCreadorService.name);

  constructor(
    @Inject(TENANT_SCOPED_PRISMA)
    private readonly tenantScopedPrisma: TenantScopedPrismaClient,
    private readonly tenantContext: TenantContextService,
    private readonly encryptionService: EncryptionService,
    private readonly jwtService: JwtService,
  ) {}

  /** Documento 4-equivalente: el creador hace click en "Conectar Mercado Pago" desde su panel. */
  getAuthorizationUrl(): string {
    const tenantId = this.tenantContext.requireTenantId();

    const state = this.jwtService.sign(
      { tenantId, purpose: 'mp-oauth-state' } satisfies MpOAuthStatePayload,
      { secret: JWT_ACCESS_SECRET, expiresIn: '15m' },
    );

    const params = new URLSearchParams({
      client_id: MP_CLIENT_ID,
      response_type: 'code',
      platform_id: 'mp',
      redirect_uri: MP_REDIRECT_URI,
      state,
    });

    return `${MP_AUTHORIZATION_URL}?${params.toString()}`;
  }

  /** Documento 8, sección 2 — intercambia el `code` por un access_token real de la cuenta del creador. */
  async handleCallback(code: string, state: string) {
    const payload = this.verifyState(state);

    const response = await fetch(MP_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: MP_CLIENT_ID,
        client_secret: MP_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: MP_REDIRECT_URI,
      }),
    });

    if (!response.ok) {
      const detalle = await response.text();
      this.logger.error(
        `Mercado Pago rechazó el intercambio de code: ${detalle}`,
      );
      throw new BadRequestException(
        'No se pudo conectar la cuenta de Mercado Pago — el código de autorización es inválido o expiró',
      );
    }

    const data = (await response.json()) as MpTokenResponse;
    const accessTokenEncriptado = this.encryptionService.encrypt(
      data.access_token,
    );

    // El callback de Mercado Pago llega directo a la API (no pasa por el
    // middleware de apps/web que setea el header de tenant) — no hay
    // TenantContext activo todavía. Se abre "como" el tenant identificado
    // por el `state` firmado, mismo patrón que TenancyService.createAcademia().
    return this.tenantContext.run({ tenantId: payload.tenantId }, async () => {
      const existente =
        await this.tenantScopedPrisma.cuentaPagoCreador.findFirst({
          where: { proveedor: 'MercadoPago' },
        });

      if (existente) {
        return this.tenantScopedPrisma.cuentaPagoCreador.update({
          where: { id: existente.id },
          data: {
            externalAccountId: String(data.user_id),
            accessTokenEncriptado,
            estadoConexion: 'Conectada',
          },
        });
      }

      return this.tenantScopedPrisma.cuentaPagoCreador.create({
        data: {
          id: generateId(),
          tenantId: payload.tenantId,
          proveedor: 'MercadoPago',
          externalAccountId: String(data.user_id),
          accessTokenEncriptado,
          estadoConexion: 'Conectada',
        },
      });
    });
  }

  async getEstado() {
    const cuenta = await this.tenantScopedPrisma.cuentaPagoCreador.findFirst({
      where: { proveedor: 'MercadoPago' },
    });
    if (!cuenta) {
      return { conectada: false };
    }
    return {
      conectada: cuenta.estadoConexion === 'Conectada',
      estado: cuenta.estadoConexion,
    };
  }

  /** Para el módulo de checkout (próximo paso): el access_token real, descifrado. */
  async getAccessTokenDescifrado(): Promise<string> {
    const cuenta = await this.tenantScopedPrisma.cuentaPagoCreador.findFirst({
      where: { proveedor: 'MercadoPago', estadoConexion: 'Conectada' },
    });
    if (!cuenta) {
      throw new BadRequestException(
        'Esta academia no tiene una cuenta de Mercado Pago conectada',
      );
    }
    return this.encryptionService.decrypt(cuenta.accessTokenEncriptado);
  }

  private verifyState(state: string): MpOAuthStatePayload {
    try {
      const payload = this.jwtService.verify<MpOAuthStatePayload>(state, {
        secret: JWT_ACCESS_SECRET,
      });
      if (payload.purpose !== 'mp-oauth-state') {
        throw new Error('wrong purpose');
      }
      return payload;
    } catch {
      throw new BadRequestException(
        'El estado de la conexión con Mercado Pago es inválido o expiró',
      );
    }
  }
}
