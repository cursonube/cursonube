import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';
import {
  ACCESS_TOKEN_COOKIE,
  JWT_ACCESS_EXPIRES_IN,
  JWT_ACCESS_SECRET,
  JWT_REFRESH_EXPIRES_IN,
  JWT_REFRESH_SECRET,
  REFRESH_TOKEN_COOKIE,
  SessionTokenPayload,
} from './jwt.config';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(private readonly jwtService: JwtService) {
    if (
      process.env.NODE_ENV === 'production' &&
      (JWT_ACCESS_SECRET.startsWith('dev-only') ||
        JWT_REFRESH_SECRET.startsWith('dev-only'))
    ) {
      this.logger.error(
        'JWT_ACCESS_SECRET/JWT_REFRESH_SECRET no configurados en producción — usando defaults de desarrollo. Ver Documento 16, sección 6.',
      );
    }
  }

  /**
   * Emite el par de cookies de sesión — Documento 7, sección 1: httpOnly,
   * scoped al hostname exacto de la request (nunca se setea `domain`, eso es
   * lo que las compartiría entre subdominios/dominios propios).
   */
  issueSessionCookies(res: Response, payload: SessionTokenPayload) {
    const accessToken = this.jwtService.sign(payload, {
      secret: JWT_ACCESS_SECRET,
      expiresIn: JWT_ACCESS_EXPIRES_IN,
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: JWT_REFRESH_SECRET,
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    });

    const baseCookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      // Sin `domain`: la cookie queda atada al hostname exacto de la request.
    };

    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      ...baseCookieOptions,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      ...baseCookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  clearSessionCookies(res: Response) {
    res.clearCookie(ACCESS_TOKEN_COOKIE);
    res.clearCookie(REFRESH_TOKEN_COOKIE);
  }

  verifyAccessToken(token: string): SessionTokenPayload {
    try {
      return this.jwtService.verify<SessionTokenPayload>(token, {
        secret: JWT_ACCESS_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Sesión inválida o expirada');
    }
  }
}
