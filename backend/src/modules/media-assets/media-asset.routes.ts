import { Router, type RequestHandler } from 'express';
import type { MediaAssetService } from './media-asset.service.js';

export type MediaAssetServicePort = Pick<MediaAssetService, 'list'>;

const asyncHandler =
  (handler: RequestHandler): RequestHandler =>
  (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };

export const createMediaAssetRouter = (service: MediaAssetServicePort) => {
  const router = Router();

  router.get(
    '/',
    asyncHandler(async (_request, response) => {
      const assets = await service.list();

      response.status(200).json({ assets });
    }),
  );

  return router;
};
