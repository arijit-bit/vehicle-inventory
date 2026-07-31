import { Router, type CookieOptions, type RequestHandler } from 'express';
import { authenticate } from './auth.middleware.js';
import { loginSchema, registrationSchema } from './auth.schemas.js';
import { InvalidRefreshTokenError, type RefreshTokenService } from './refresh-token.service.js';
import type { TokenVerifier } from './auth.types.js';
import type { AuthService } from './auth.service.js';

export type AuthServicePort = Pick<AuthService, 'register' | 'login'>;

const asyncHandler =
  (handler: RequestHandler): RequestHandler =>
  (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };

const REFRESH_COOKIE = 'refresh_token';

const refreshCookieOptions = (isProduction: boolean): CookieOptions => ({
  httpOnly: true,
  secure: isProduction,
  // SameSite=None is required for cross-domain requests (frontend and backend on different subdomains).
  // SameSite=None MUST be paired with Secure=true (enforced above in production).
  // In development we use 'lax' since both origins are localhost.
  sameSite: isProduction ? 'none' : 'lax',
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
});

export const createAuthRouter = (
  service: AuthServicePort,
  tokens: TokenVerifier,
  refreshTokenService?: RefreshTokenService,
) => {
  const router = Router();
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOpts = refreshCookieOptions(isProduction);

  // Log once on cold-start so the effective cookie policy is visible in server logs.
  // Check Vercel function logs to confirm: secure=true, sameSite='none' in production.
  console.log('[auth] NODE_ENV=%s | refresh cookie opts: %o', process.env.NODE_ENV, cookieOpts);

  const setRefreshCookie = (response: Parameters<RequestHandler>[1], rawToken: string) => {
    response.cookie(REFRESH_COOKIE, rawToken, cookieOpts);
  };

  router.post(
    '/register',
    asyncHandler(async (request, response) => {
      const credentials = registrationSchema.parse(request.body);
      const { rememberMe } = request.body as { rememberMe?: boolean };
      const result = await service.register(credentials);

      if (rememberMe && refreshTokenService) {
        const rawToken = await refreshTokenService.issue(result.user.id);
        setRefreshCookie(response, rawToken);
      }

      response.status(201).json({ user: result.user, token: result.token });
    }),
  );

  router.post(
    '/login',
    asyncHandler(async (request, response) => {
      const credentials = loginSchema.parse(request.body);
      const { rememberMe } = request.body as { rememberMe?: boolean };
      const result = await service.login(credentials);

      if (rememberMe && refreshTokenService) {
        const rawToken = await refreshTokenService.issue(result.user.id);
        setRefreshCookie(response, rawToken);
      }

      response.status(200).json({ user: result.user, token: result.token });
    }),
  );

  router.get('/me', authenticate(tokens), (request, response) => {
    const auth = request.auth!;

    response.status(200).json({
      user: {
        id: auth.sub,
        email: auth.email,
        role: auth.role,
      },
    });
  });

  /**
   * POST /api/auth/refresh and POST /api/auth/logout are only registered when
   * a RefreshTokenService is available (not required in unit-test environments).
   */
  if (refreshTokenService) {
    router.post(
      '/refresh',
      asyncHandler(async (request, response) => {
        const rawToken = request.cookies?.[REFRESH_COOKIE] as string | undefined;

        if (!rawToken) {
          response
            .status(401)
            .json({ error: { code: 'NO_REFRESH_TOKEN', message: 'No refresh token provided' } });
          return;
        }

        try {
          const { accessToken, newRawToken } = await refreshTokenService.rotate(rawToken);
          setRefreshCookie(response, newRawToken);
          response.status(200).json({ token: accessToken });
        } catch (error) {
          if (error instanceof InvalidRefreshTokenError) {
            response.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
            response
              .status(401)
              .json({ error: { code: 'INVALID_REFRESH_TOKEN', message: error.message } });
            return;
          }
          throw error;
        }
      }),
    );

    router.post(
      '/logout',
      asyncHandler(async (request, response) => {
        const rawToken = request.cookies?.[REFRESH_COOKIE] as string | undefined;

        if (rawToken) {
          await refreshTokenService.revoke(rawToken);
        }

        response.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
        response.status(204).send();
      }),
    );
  }

  return router;
};
