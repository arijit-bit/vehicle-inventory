import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { errorHandler } from './middleware/error-handler.js';
import { createAuthRouter, type AuthServicePort } from './modules/auth/auth.routes.js';
import type { TokenVerifier } from './modules/auth/auth.types.js';
import {
  createVehicleRouter,
  type VehicleServicePort,
} from './modules/vehicles/vehicle.routes.js';

interface AppDependencies {
  authService?: AuthServicePort;
  tokenVerifier?: TokenVerifier;
  vehicleService?: VehicleServicePort;
}

export const createApp = ({ authService, tokenVerifier, vehicleService }: AppDependencies = {}) => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_request, response) => {
    response.status(200).json({
      status: 'ok',
      service: 'vehicle-inventory-api',
    });
  });

  if (authService && tokenVerifier) {
    app.use('/api/auth', createAuthRouter(authService, tokenVerifier));
  }

  if (vehicleService && tokenVerifier) {
    app.use('/api/vehicles', createVehicleRouter(vehicleService, tokenVerifier));
  }

  app.use((_request, response) => {
    response.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found',
      },
    });
  });

  app.use(errorHandler);

  return app;
};
