import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from './app.js';
import { JwtTokenService } from './modules/auth/jwt-token.service.js';

const vehicleId = 'a104ce48-e57f-4fb0-8793-57c8b9a2c913';

describe('Milestone 6 administrator boundary', () => {
  it('allows only a verified administrator to delete a vehicle', async () => {
    const tokens = new JwtTokenService({
      secret: 'milestone-6-integration-secret-is-long-enough',
      expiresIn: '15m',
      issuer: 'vehicle-inventory-api',
      audience: 'vehicle-inventory-web',
    });
    const vehicleService = {
      create: vi.fn(),
      list: vi.fn(),
      search: vi.fn(),
      update: vi.fn(),
      delete: vi.fn().mockResolvedValue(undefined),
      purchase: vi.fn(),
      restock: vi.fn(),
    };
    const app = createApp({
      tokenVerifier: tokens,
      vehicleService,
    });
    const userToken = tokens.sign({
      id: '6d81eeca-7b73-4be4-b164-32974cf57619',
      email: 'driver@example.com',
      role: 'USER',
    });
    const adminToken = tokens.sign({
      id: 'bb374a4a-a335-4d08-9385-608a84fb80f9',
      email: 'admin@example.com',
      role: 'ADMIN',
    });

    const userAttempt = await request(app)
      .delete(`/api/vehicles/${vehicleId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(userAttempt.status).toBe(403);
    expect(userAttempt.body.error.code).toBe('FORBIDDEN');
    expect(vehicleService.delete).not.toHaveBeenCalled();

    const adminAttempt = await request(app)
      .delete(`/api/vehicles/${vehicleId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(adminAttempt.status).toBe(204);
    expect(vehicleService.delete).toHaveBeenCalledOnce();
    expect(vehicleService.delete).toHaveBeenCalledWith(vehicleId);
  });
});
