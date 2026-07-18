import { Injectable, UnauthorizedException } from '@nestjs/common';
import { generateSecret, generateURI, verify as verifyTotp } from 'otplib';
import * as QRCode from 'qrcode';
import type { Request, Response } from 'express';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PasswordService } from '../../common/security/password.service';
import { SessionService } from '../../common/security/session.service';
import { STAFF_2FA_PENDING_TOKEN_COOKIE } from '../../common/security/jwt.config';
import { LoginStaffDto } from './dto/login-staff.dto';
import { Verificar2faDto } from './dto/verificar-2fa.dto';

/**
 * Documento 7, sección 6 — 2FA obligatorio para CursonubeStaff desde el
 * MVP: login en dos pasos, nunca se emite sesión real solo con
 * email+contraseña. Sin self-registration (Documento 7, sección 2) — las
 * cuentas de staff se crean por bootstrap/seed o a mano por un SuperAdmin
 * existente, no hay flujo público de alta.
 */
@Injectable()
export class StaffAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly sessionService: SessionService,
  ) {}

  /**
   * Paso 1: credenciales. Si todavía no tiene 2FA habilitado, genera (o
   * reusa) el secreto TOTP y devuelve el QR de enrollment — recién se
   * marca habilitado al confirmar un código válido en `verificar2fa`, nunca
   * antes (un secreto generado pero no confirmado no debe contarse como
   * "2FA activo").
   */
  async login(dto: LoginStaffDto, res: Response) {
    const staff = await this.prisma.cursonubeStaff.findUnique({
      where: { email: dto.email },
    });
    if (!staff) {
      throw new UnauthorizedException('Email o contraseña incorrectos');
    }

    const passwordValida = await this.passwordService.verify(
      staff.passwordHash,
      dto.password,
    );
    if (!passwordValida) {
      throw new UnauthorizedException('Email o contraseña incorrectos');
    }

    let secret = staff.twoFactorSecret;
    if (!secret) {
      secret = generateSecret();
      await this.prisma.cursonubeStaff.update({
        where: { id: staff.id },
        data: { twoFactorSecret: secret },
      });
    }

    this.sessionService.issueStaff2faPendingCookie(res, {
      sub: staff.id,
      purpose: 'staff-2fa-pending',
    });

    if (staff.twoFactorHabilitado) {
      return { requiereEnrollment: false };
    }

    const otpauth = generateURI({
      issuer: 'Cursonube',
      label: staff.email,
      secret,
    });
    const qrCodeDataUrl = await QRCode.toDataURL(otpauth);
    return { requiereEnrollment: true, qrCodeDataUrl, claveManual: secret };
  }

  /**
   * Paso 2: código TOTP. Confirma el enrollment (si era la primera vez) y
   * recién acá emite la sesión real — un secreto generado en el paso 1 sin
   * un código válido nunca llega a autenticar a nadie.
   */
  async verificar2fa(dto: Verificar2faDto, req: Request, res: Response) {
    const pendingToken = req.cookies?.[STAFF_2FA_PENDING_TOKEN_COOKIE];
    if (!pendingToken) {
      throw new UnauthorizedException(
        'La sesión de login expiró — iniciá sesión de nuevo',
      );
    }
    const { sub: staffId } =
      this.sessionService.verifyStaff2faPendingToken(pendingToken);

    const staff = await this.prisma.cursonubeStaff.findUnique({
      where: { id: staffId },
    });
    if (!staff || !staff.twoFactorSecret) {
      throw new UnauthorizedException('Sesión inválida — iniciá sesión de nuevo');
    }

    const resultado = await verifyTotp({
      token: dto.codigo,
      secret: staff.twoFactorSecret,
    });
    if (!resultado.valid) {
      throw new UnauthorizedException('Código incorrecto');
    }

    if (!staff.twoFactorHabilitado) {
      await this.prisma.cursonubeStaff.update({
        where: { id: staff.id },
        data: { twoFactorHabilitado: true },
      });
    }

    this.sessionService.clearStaff2faPendingCookie(res);
    this.sessionService.issueSessionCookies(res, {
      sub: staff.id,
      aud: 'staff',
      rol: staff.rol,
    });

    return { id: staff.id, email: staff.email, rol: staff.rol };
  }

  logout(res: Response) {
    this.sessionService.clearSessionCookies(res);
  }

  async me(staffId: string) {
    const staff = await this.prisma.cursonubeStaff.findUniqueOrThrow({
      where: { id: staffId },
    });
    return { id: staff.id, email: staff.email, rol: staff.rol };
  }
}
