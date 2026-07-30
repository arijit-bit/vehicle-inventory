import 'dotenv/config';
import { createApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import { createPrismaClient } from '../src/infrastructure/database/prisma.js';
import { AdminSeeder } from '../src/modules/auth/admin-seeder.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import { BcryptPasswordHasher } from '../src/modules/auth/bcrypt-password-hasher.js';
import { JwtTokenService } from '../src/modules/auth/jwt-token.service.js';
import { PrismaUserRepository } from '../src/modules/auth/prisma-user.repository.js';
import { UserManagementService } from '../src/modules/auth/user-management.service.js';
import { MediaAssetService } from '../src/modules/media-assets/media-asset.service.js';
import { PrismaMediaAssetRepository } from '../src/modules/media-assets/prisma-media-asset.repository.js';
import { OrderService } from '../src/modules/orders/order.service.js';
import { PrismaOrderRepository } from '../src/modules/orders/prisma-order.repository.js';
import { PrismaVehicleRepository } from '../src/modules/vehicles/prisma-vehicle.repository.js';
import { VehicleService } from '../src/modules/vehicles/vehicle.service.js';

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

const app = createApp({
  authService,
  tokenVerifier: tokens,
  vehicleService,
  userManagementService,
  mediaAssetService,
  orderService,
});

export default app;
