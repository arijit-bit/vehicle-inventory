import type { IncomingMessage, ServerResponse } from 'http';
import { createApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import { createPrismaClient } from '../src/infrastructure/database/prisma.js';
import { AdminSeeder } from '../src/modules/auth/admin-seeder.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import { BcryptPasswordHasher } from '../src/modules/auth/bcrypt-password-hasher.js';
import { JwtTokenService } from '../src/modules/auth/jwt-token.service.js';
import { PrismaUserRepository } from '../src/modules/auth/prisma-user.repository.js';
import { PrismaRefreshTokenRepository, RefreshTokenService } from '../src/modules/auth/refresh-token.service.js';
import { UserManagementService } from '../src/modules/auth/user-management.service.js';
import { MediaAssetService } from '../src/modules/media-assets/media-asset.service.js';
import { PrismaMediaAssetRepository } from '../src/modules/media-assets/prisma-media-asset.repository.js';
import { OrderService } from '../src/modules/orders/order.service.js';
import { PrismaOrderRepository } from '../src/modules/orders/prisma-order.repository.js';
import { PrismaVehicleRepository } from '../src/modules/vehicles/prisma-vehicle.repository.js';
import { VehicleService } from '../src/modules/vehicles/vehicle.service.js';
import type { Express } from 'express';

// Lazy singleton — built once on first cold start, reused on warm invocations
let appInstance: Express | null = null;

async function buildApp(): Promise<Express> {
  if (appInstance) return appInstance;

  const env = loadEnv();
  const database = createPrismaClient(env.DATABASE_URL);
  const users = new PrismaUserRepository(database);
  const passwords = new BcryptPasswordHasher(env.BCRYPT_ROUNDS);
  const tokens = new JwtTokenService({
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });
  const authService = new AuthService(users, passwords, tokens);
  const userManagementService = new UserManagementService(users, passwords);
  const refreshTokenRepo = new PrismaRefreshTokenRepository(database);
  const refreshTokenService = new RefreshTokenService(refreshTokenRepo, tokens);
  const vehicles = new PrismaVehicleRepository(database, {
    lockTimeoutMs: env.DATABASE_LOCK_TIMEOUT_MS,
    statementTimeoutMs: env.DATABASE_STATEMENT_TIMEOUT_MS,
  });
  const orders = new PrismaOrderRepository(database, {
    lockTimeoutMs: env.DATABASE_LOCK_TIMEOUT_MS,
    statementTimeoutMs: env.DATABASE_STATEMENT_TIMEOUT_MS,
  });
  const vehicleService = new VehicleService(vehicles, orders);
  const orderService = new OrderService(orders);
  const mediaAssets = new PrismaMediaAssetRepository(database);
  const mediaAssetService = new MediaAssetService(mediaAssets);

  const adminCredentials =
    env.ADMIN_EMAIL && env.ADMIN_PASSWORD
      ? { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD }
      : undefined;

  await new AdminSeeder(users, passwords).seed(adminCredentials);

  appInstance = createApp({
    authService,
    tokenVerifier: tokens,
    refreshTokenService,
    vehicleService,
    userManagementService,
    mediaAssetService,
    orderService,
  });

  return appInstance;
}

// Vercel serverless handler — receives each request, builds the app lazily
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Always set CORS headers so the browser can read error responses too
  const origin = (req.headers['origin'] as string) ?? '';
  const allowed =
    !origin ||
    /^https:\/\/.*\.vercel\.app$/.test(origin) ||
    origin === 'http://localhost:5173' ||
    origin === 'http://localhost:3000' ||
    (process.env.CORS_ORIGIN ?? '')
      .split(',')
      .map((o) => o.trim())
      .includes(origin);

  if (allowed && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }

  // Handle CORS pre-flight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    const app = await buildApp();
    app(req, res);
  } catch (err) {
    // Reset so the next warm invocation retries initialisation
    appInstance = null;
    console.error('[handler] Failed to initialise app:', err);
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Service failed to start' } }));
  }
}
