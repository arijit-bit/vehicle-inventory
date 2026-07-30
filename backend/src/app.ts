import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { errorHandler } from './middleware/error-handler.js';
import { createAuthRouter, type AuthServicePort } from './modules/auth/auth.routes.js';
import type { TokenVerifier } from './modules/auth/auth.types.js';
import {
  createUserManagementRouter,
  type UserManagementServicePort,
} from './modules/auth/user-management.routes.js';
import type { RefreshTokenService } from './modules/auth/refresh-token.service.js';
import {
  createMediaAssetRouter,
  type MediaAssetServicePort,
} from './modules/media-assets/media-asset.routes.js';
import { createOrderRouter, type OrderServicePort } from './modules/orders/order.routes.js';
import { createVehicleRouter, type VehicleServicePort } from './modules/vehicles/vehicle.routes.js';

interface AppDependencies {
  authService?: AuthServicePort;
  tokenVerifier?: TokenVerifier;
  refreshTokenService?: RefreshTokenService;
  vehicleService?: VehicleServicePort;
  userManagementService?: UserManagementServicePort;
  mediaAssetService?: MediaAssetServicePort;
  orderService?: OrderServicePort;
}

export const createApp = ({
  authService,
  tokenVerifier,
  refreshTokenService,
  vehicleService,
  userManagementService,
  mediaAssetService,
  orderService,
}: AppDependencies = {}) => {
  const app = express();

  const allowedOrigins: (string | RegExp)[] = [
    // Allow all *.vercel.app preview/production deployments
    /^https:\/\/.*\.vercel\.app$/,
    // Allow local development (5173 is default, 5174+ is Vite's fallback when port is in use)
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:3000',
    // Allow any extra origins listed in CORS_ORIGIN (comma-separated)
    ...(process.env.CORS_ORIGIN?.split(',')
      .map((o) => o.trim())
      .filter(Boolean) ?? []),
  ];

  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. curl, Postman, server-to-server)
        if (!origin) return callback(null, true);
        const allowed = allowedOrigins.some((o) =>
          typeof o === 'string' ? o === origin : o.test(origin),
        );
        if (allowed) {
          callback(null, true);
        } else {
          callback(new Error(`CORS: origin '${origin}' not allowed`));
        }
      },
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_request, response) => {
    response.status(200).json({
      status: 'ok',
      service: 'vehicle-inventory-api',
    });
  });

  if (authService && tokenVerifier && refreshTokenService) {
    app.use('/api/auth', createAuthRouter(authService, tokenVerifier, refreshTokenService));
  }

  if (vehicleService && tokenVerifier) {
    app.use('/api/vehicles', createVehicleRouter(vehicleService, tokenVerifier));
  }

  if (userManagementService && tokenVerifier) {
    app.use('/api/users', createUserManagementRouter(userManagementService, tokenVerifier));
  }

  if (mediaAssetService) {
    app.use('/api/assets', createMediaAssetRouter(mediaAssetService));
  }

  if (orderService && tokenVerifier) {
    app.use('/api/orders', createOrderRouter(orderService, tokenVerifier));
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
