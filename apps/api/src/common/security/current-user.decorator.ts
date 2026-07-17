import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { SessionTokenPayload } from './jwt.config';

/** Requiere haber pasado por un guard de auth que ya seteó `req.user`. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SessionTokenPayload => {
    const req = ctx
      .switchToHttp()
      .getRequest<Request & { user: SessionTokenPayload }>();
    return req.user;
  },
);
