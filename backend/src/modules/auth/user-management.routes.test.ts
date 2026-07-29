import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../app.js';
import type { TokenVerifier } from './auth.types.js';

const adminId = 'bb374a4a-a335-4d08-9385-608a84fb80f9';
const customerId = '6d81eeca-7b73-4be4-b164-32974cf57619';
const user = {
  id: customerId,
  email: 'buyer@example.com',
  role: 'CUSTOMER' as const,
  createdAt: new Date('2026-07-29T00:00:00.000Z'),
  updatedAt: new Date('2026-07-29T00:00:00.000Z'),
};

describe('administrator user management HTTP API', () => {
  const service = {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const tokens: TokenVerifier = { verify: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    service.list.mockResolvedValue([user]);
    service.get.mockResolvedValue(user);
    service.create.mockResolvedValue(user);
    service.update.mockResolvedValue({ ...user, role: 'EMPLOYEE' });
    service.delete.mockResolvedValue(undefined);
    vi.mocked(tokens.verify).mockReturnValue({
      sub: adminId,
      email: 'admin@example.com',
      role: 'ADMIN',
    });
  });

  const app = () =>
    createApp({
      tokenVerifier: tokens,
      userManagementService: service,
    });
  const authorized = () => ({ Authorization: 'Bearer signed.jwt.token' });

  it('allows administrators to list users without password hashes', async () => {
    const response = await request(app()).get('/api/users').set(authorized());

    expect(response.status).toBe(200);
    expect(response.body.users[0]).toMatchObject({
      id: customerId,
      email: 'buyer@example.com',
      role: 'CUSTOMER',
    });
    expect(JSON.stringify(response.body)).not.toContain('password');
  });

  it('allows administrators to create an employee', async () => {
    const response = await request(app()).post('/api/users').set(authorized()).send({
      email: 'sales@example.com',
      password: 'SafePass123!',
      role: 'EMPLOYEE',
    });

    expect(response.status).toBe(201);
    expect(service.create).toHaveBeenCalledWith({
      email: 'sales@example.com',
      password: 'SafePass123!',
      role: 'EMPLOYEE',
    });
  });

  it('allows administrators to assign a role', async () => {
    const response = await request(app())
      .put(`/api/users/${customerId}`)
      .set(authorized())
      .send({ role: 'EMPLOYEE' });

    expect(response.status).toBe(200);
    expect(service.update).toHaveBeenCalledWith(customerId, { role: 'EMPLOYEE' }, adminId);
  });

  it('allows administrators to delete another user', async () => {
    const response = await request(app()).delete(`/api/users/${customerId}`).set(authorized());

    expect(response.status).toBe(204);
    expect(service.delete).toHaveBeenCalledWith(customerId, adminId);
  });

  it.each(['CUSTOMER', 'EMPLOYEE'] as const)('denies the %s role', async (role) => {
    vi.mocked(tokens.verify).mockReturnValue({
      sub: customerId,
      email: 'non-admin@example.com',
      role,
    });

    const response = await request(app()).get('/api/users').set(authorized());

    expect(response.status).toBe(403);
    expect(service.list).not.toHaveBeenCalled();
  });
});
