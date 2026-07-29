import 'dotenv/config';
import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { createPrismaClient } from './infrastructure/database/prisma.js';
import { AdminSeeder } from './modules/auth/admin-seeder.js';
import { AuthService } from './modules/auth/auth.service.js';
import { BcryptPasswordHasher } from './modules/auth/bcrypt-password-hasher.js';
import { JwtTokenService } from './modules/auth/jwt-token.service.js';
import { PrismaUserRepository } from './modules/auth/prisma-user.repository.js';
import { PrismaVehicleRepository } from './modules/vehicles/prisma-vehicle.repository.js';
import { VehicleService } from './modules/vehicles/vehicle.service.js';

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
const vehicles = new PrismaVehicleRepository(database, {
  lockTimeoutMs: env.DATABASE_LOCK_TIMEOUT_MS,
  statementTimeoutMs: env.DATABASE_STATEMENT_TIMEOUT_MS,
});
const vehicleService = new VehicleService(vehicles);
const adminCredentials =
  env.ADMIN_EMAIL && env.ADMIN_PASSWORD
    ? { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD }
    : undefined;

await new AdminSeeder(users, passwords).seed(adminCredentials);

const app = createApp({
  authService,
  tokenVerifier: tokens,
  vehicleService,
});

app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});
