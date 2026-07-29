import { Router, type RequestHandler } from 'express';
import { authenticate, authorize } from './auth.middleware.js';
import type { TokenVerifier } from './auth.types.js';
import { createUserSchema, updateUserSchema, userIdSchema } from './user-management.schemas.js';
import type { UserManagementService } from './user-management.service.js';

export type UserManagementServicePort = Pick<
  UserManagementService,
  'list' | 'get' | 'create' | 'update' | 'delete'
>;

const asyncHandler =
  (handler: RequestHandler): RequestHandler =>
  (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };

export const createUserManagementRouter = (
  service: UserManagementServicePort,
  tokens: TokenVerifier,
) => {
  const router = Router();

  router.use(authenticate(tokens), authorize('ADMIN'));

  router.get(
    '/',
    asyncHandler(async (_request, response) => {
      response.status(200).json({ users: await service.list() });
    }),
  );

  router.post(
    '/',
    asyncHandler(async (request, response) => {
      const input = createUserSchema.parse(request.body);
      response.status(201).json({ user: await service.create(input) });
    }),
  );

  router.get(
    '/:id',
    asyncHandler(async (request, response) => {
      const id = userIdSchema.parse(request.params.id);
      response.status(200).json({ user: await service.get(id) });
    }),
  );

  router.put(
    '/:id',
    asyncHandler(async (request, response) => {
      const id = userIdSchema.parse(request.params.id);
      const input = updateUserSchema.parse(request.body);
      response.status(200).json({
        user: await service.update(id, input, request.auth!.sub),
      });
    }),
  );

  router.delete(
    '/:id',
    asyncHandler(async (request, response) => {
      const id = userIdSchema.parse(request.params.id);
      await service.delete(id, request.auth!.sub);
      response.status(204).send();
    }),
  );

  return router;
};
