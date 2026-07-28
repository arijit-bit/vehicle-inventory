import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { TokenVerifier, UserRole } from './auth.types.js';

const unauthorized = (response: Response) =>
  response.status(401).json({
    error: {
      code: 'UNAUTHENTICATED',
      message: 'Authentication is required',
    },
  });

export const authenticate =
  (tokens: TokenVerifier): RequestHandler =>
  (request: Request, response: Response, next: NextFunction) => {
    const authorization = request.header('Authorization');
    const [scheme, token, extra] = authorization?.split(' ') ?? [];

    if (scheme !== 'Bearer' || !token || extra) {
      unauthorized(response);
      return;
    }

    try {
      request.auth = tokens.verify(token);
      next();
    } catch {
      unauthorized(response);
    }
  };

export const authorize =
  (...allowedRoles: UserRole[]): RequestHandler =>
  (request: Request, response: Response, next: NextFunction) => {
    if (!request.auth || !allowedRoles.includes(request.auth.role)) {
      response.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to perform this action',
        },
      });
      return;
    }

    next();
  };
