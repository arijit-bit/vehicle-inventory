import { Router, type RequestHandler } from 'express';
import { authenticate, authorize } from '../auth/auth.middleware.js';
import type { TokenVerifier } from '../auth/auth.types.js';
import {
  createVehicleSchema,
  inventoryMutationSchema,
  paginatedSearchVehiclesSchema,
  updateVehicleSchema,
  vehicleIdSchema,
  vehiclePaginationSchema,
} from './vehicle.schemas.js';
import type { VehicleService } from './vehicle.service.js';

export type VehicleServicePort = Pick<
  VehicleService,
  'create' | 'list' | 'search' | 'update' | 'delete' | 'purchase' | 'restock'
>;

const asyncHandler =
  (handler: RequestHandler): RequestHandler =>
  (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };

export const createVehicleRouter = (service: VehicleServicePort, tokens: TokenVerifier) => {
  const router = Router();

  router.get(
    '/search',
    asyncHandler(async (request, response) => {
      const { limit, skip, ...filters } = paginatedSearchVehiclesSchema.parse(request.query);
      const result = await service.search(filters, { limit, skip });

      response.status(200).json(result);
    }),
  );

  router.get(
    '/',
    asyncHandler(async (request, response) => {
      const pagination = vehiclePaginationSchema.parse(request.query);
      const result = await service.list(pagination);

      response.status(200).json(result);
    }),
  );

  router.post(
    '/',
    authenticate(tokens),
    authorize('EMPLOYEE', 'ADMIN'),
    asyncHandler(async (request, response) => {
      const input = createVehicleSchema.parse(request.body);
      const vehicle = await service.create(input);

      response.status(201).json({ vehicle });
    }),
  );

  router.put(
    '/:id',
    authenticate(tokens),
    authorize('EMPLOYEE', 'ADMIN'),
    asyncHandler(async (request, response) => {
      const id = vehicleIdSchema.parse(request.params.id);
      const input = updateVehicleSchema.parse(request.body);
      const vehicle = await service.update(id, input);

      response.status(200).json({ vehicle });
    }),
  );

  router.post(
    '/:id/purchase',
    authenticate(tokens),
    authorize('CUSTOMER'),
    asyncHandler(async (request, response) => {
      const id = vehicleIdSchema.parse(request.params.id);
      const { quantity } = inventoryMutationSchema.parse(request.body ?? {});
      const result = await service.purchase(id, quantity, request.auth!.sub);

      response.status(200).json(result);
    }),
  );

  router.post(
    '/:id/restock',
    authenticate(tokens),
    authorize('ADMIN'),
    asyncHandler(async (request, response) => {
      const id = vehicleIdSchema.parse(request.params.id);
      const { quantity } = inventoryMutationSchema.parse(request.body ?? {});
      const vehicle = await service.restock(id, quantity);

      response.status(200).json({ vehicle });
    }),
  );

  router.delete(
    '/:id',
    authenticate(tokens),
    authorize('ADMIN'),
    asyncHandler(async (request, response) => {
      const id = vehicleIdSchema.parse(request.params.id);
      await service.delete(id);

      response.status(204).send();
    }),
  );

  return router;
};
