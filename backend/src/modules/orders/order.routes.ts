import { Router, type RequestHandler } from 'express';
import { authenticate, authorize } from '../auth/auth.middleware.js';
import type { TokenVerifier } from '../auth/auth.types.js';
import { orderIdSchema, orderPaginationSchema } from './order.schemas.js';
import type { OrderService } from './order.service.js';

export type OrderServicePort = Pick<OrderService, 'list' | 'cancel'>;

const asyncHandler =
  (handler: RequestHandler): RequestHandler =>
  (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };

export const createOrderRouter = (service: OrderServicePort, tokens: TokenVerifier) => {
  const router = Router();

  router.get(
    '/',
    authenticate(tokens),
    asyncHandler(async (request, response) => {
      const pagination = orderPaginationSchema.parse(request.query);
      const result = await service.list(request.auth!, pagination);

      response.status(200).json(result);
    }),
  );

  router.post(
    '/:id/cancel',
    authenticate(tokens),
    authorize('CUSTOMER'),
    asyncHandler(async (request, response) => {
      const orderId = orderIdSchema.parse(request.params.id);
      const result = await service.cancel(orderId, request.auth!.sub);

      response.status(200).json(result);
    }),
  );

  return router;
};
