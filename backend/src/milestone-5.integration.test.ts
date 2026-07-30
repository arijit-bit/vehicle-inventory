import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from './app.js';
import { AuthService } from './modules/auth/auth.service.js';
import { BcryptPasswordHasher } from './modules/auth/bcrypt-password-hasher.js';
import { JwtTokenService } from './modules/auth/jwt-token.service.js';
import type { CreateUserInput, UserRecord, UserRepository } from './modules/auth/auth.types.js';

const userId = '6d81eeca-7b73-4be4-b164-32974cf57619';

class AuthFlowUserRepository implements UserRepository {
  private user: UserRecord | null = null;

  async findByEmail(email: string) {
    return this.user?.email === email ? this.user : null;
  }

  async create(input: CreateUserInput) {
    this.user = {
      id: userId,
      ...input,
    };

    return this.user;
  }
}

describe('Milestone 5 authentication to dashboard boundary', () => {
  it('uses a registered user token to restore identity and load protected inventory', async () => {
    const tokens = new JwtTokenService({
      secret: 'milestone-5-integration-secret-is-long-enough',
      expiresIn: '15m',
      issuer: 'vehicle-inventory-api',
      audience: 'vehicle-inventory-web',
    });
    const authService = new AuthService(
      new AuthFlowUserRepository(),
      new BcryptPasswordHasher(4),
      tokens,
    );
    const vehicleService = {
      create: vi.fn(),
      list: vi.fn().mockResolvedValue({
        vehicles: [],
        pagination: { limit: 6, skip: 0, total: 0 },
        brands: [],
      }),
      search: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      purchase: vi.fn(),
      restock: vi.fn(),
    };
    const app = createApp({
      authService,
      tokenVerifier: tokens,
      vehicleService,
    });

    const registration = await request(app).post('/api/auth/register').send({
      email: ' Driver@Example.COM ',
      password: 'SafePass123!',
    });

    expect(registration.status).toBe(201);
    expect(registration.body.user).toEqual({
      id: userId,
      email: 'driver@example.com',
      role: 'CUSTOMER',
    });

    const authorization = `Bearer ${registration.body.token as string}`;
    const [profile, inventory, adminAttempt] = await Promise.all([
      request(app).get('/api/auth/me').set('Authorization', authorization),
      request(app).get('/api/vehicles').set('Authorization', authorization),
      request(app).post('/api/vehicles').set('Authorization', authorization).send({
        make: 'Toyota',
        model: 'Camry',
        category: 'Sedan',
        price: 32999.9,
        quantity: 2,
      }),
    ]);

    expect(profile.status).toBe(200);
    expect(profile.body.user).toEqual(registration.body.user);
    expect(inventory.status).toBe(200);
    expect(inventory.body).toEqual({
      vehicles: [],
      pagination: { limit: 6, skip: 0, total: 0 },
      brands: [],
    });
    expect(vehicleService.list).toHaveBeenCalledWith({ limit: 6, skip: 0 });
    expect(adminAttempt.status).toBe(403);
    expect(adminAttempt.body.error.code).toBe('FORBIDDEN');
    expect(vehicleService.create).not.toHaveBeenCalled();
  });
});
