import { Router, type RequestHandler } from 'express';
import type { AuthService } from './auth.service.js';
import { authenticate } from './auth.middleware.js';
import { loginSchema, registrationSchema } from './auth.schemas.js';
import type { TokenVerifier } from './auth.types.js';

export type AuthServicePort = Pick<AuthService, 'register' | 'login'>;

const asyncHandler =
  (handler: RequestHandler): RequestHandler =>
  (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };

export const createAuthRouter = (service: AuthServicePort, tokens: TokenVerifier) => {
  const router = Router();

  router.post(
    '/register',
    asyncHandler(async (request, response) => {
      const credentials = registrationSchema.parse(request.body);
      const result = await service.register(credentials);

      response.status(201).json(result);
    }),
  );

  router.post(
    '/login',
    asyncHandler(async (request, response) => {
      const credentials = loginSchema.parse(request.body);
      const result = await service.login(credentials);

      response.status(200).json(result);
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

  return router;
};
