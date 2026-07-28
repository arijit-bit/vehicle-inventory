import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../app.js';
import type { TokenVerifier } from '../auth/auth.types.js';
import type { VehicleRecord } from './vehicle.types.js';

const vehicle: VehicleRecord = {
  id: 'a104ce48-e57f-4fb0-8793-57c8b9a2c913',
  make: 'Toyota',
  model: 'Camry',
  category: 'Sedan',
  price: '32999.90',
  quantity: 4,
  createdAt: new Date('2026-07-29T00:00:00.000Z'),
  updatedAt: new Date('2026-07-29T00:00:00.000Z'),
};

describe('vehicle HTTP API', () => {
  const vehicleService = {
    create: vi.fn(),
    list: vi.fn(),
    search: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const tokenVerifier: TokenVerifier = {
    verify: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vehicleService.create.mockResolvedValue(vehicle);
    vehicleService.list.mockResolvedValue([vehicle]);
    vehicleService.search.mockResolvedValue([vehicle]);
    vehicleService.update.mockResolvedValue(vehicle);
    vehicleService.delete.mockResolvedValue(undefined);
    vi.mocked(tokenVerifier.verify).mockReturnValue({
      sub: 'f9117522-a624-4e2e-a489-3b2ec2840292',
      email: 'admin@example.com',
      role: 'ADMIN',
    });
  });

  const app = () => createApp({ tokenVerifier, vehicleService });
  const authorized = () => ({ Authorization: 'Bearer signed.jwt.token' });

  it('requires authentication to list vehicles', async () => {
    const response = await request(app()).get('/api/vehicles');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
    expect(vehicleService.list).not.toHaveBeenCalled();
  });

  it('lists vehicles for an authenticated user', async () => {
    vi.mocked(tokenVerifier.verify).mockReturnValue({
      sub: 'f9117522-a624-4e2e-a489-3b2ec2840292',
      email: 'driver@example.com',
      role: 'USER',
    });

    const response = await request(app()).get('/api/vehicles').set(authorized());

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      vehicles: [
        {
          ...vehicle,
          createdAt: '2026-07-29T00:00:00.000Z',
          updatedAt: '2026-07-29T00:00:00.000Z',
        },
      ],
    });
  });

  it('searches with combined normalized filters', async () => {
    const response = await request(app())
      .get('/api/vehicles/search')
      .query({
        make: ' toy ',
        model: ' cam ',
        category: ' sedan ',
        minPrice: '10000',
        maxPrice: '40000.5',
      })
      .set(authorized());

    expect(response.status).toBe(200);
    expect(vehicleService.search).toHaveBeenCalledWith({
      make: 'toy',
      model: 'cam',
      category: 'sedan',
      minPrice: '10000.00',
      maxPrice: '40000.50',
    });
  });

  it('allows an administrator to create a normalized vehicle', async () => {
    const response = await request(app()).post('/api/vehicles').set(authorized()).send({
      make: ' Toyota ',
      model: ' Camry ',
      category: ' Sedan ',
      price: 32999.9,
      quantity: 4,
    });

    expect(response.status).toBe(201);
    expect(vehicleService.create).toHaveBeenCalledWith({
      make: 'Toyota',
      model: 'Camry',
      category: 'Sedan',
      price: '32999.90',
      quantity: 4,
    });
  });

  it.each([
    ['post', '/api/vehicles'],
    ['put', `/api/vehicles/${vehicle.id}`],
    ['delete', `/api/vehicles/${vehicle.id}`],
  ] as const)('denies a regular user from %s %s', async (method, path) => {
    vi.mocked(tokenVerifier.verify).mockReturnValue({
      sub: 'f9117522-a624-4e2e-a489-3b2ec2840292',
      email: 'driver@example.com',
      role: 'USER',
    });

    const response = await request(app())[method](path).set(authorized()).send({
      make: 'Toyota',
      model: 'Camry',
      category: 'Sedan',
      price: 32999.9,
      quantity: 4,
    });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });

  it('updates a vehicle as an administrator', async () => {
    const response = await request(app())
      .put(`/api/vehicles/${vehicle.id}`)
      .set(authorized())
      .send({ price: 31999, quantity: 3 });

    expect(response.status).toBe(200);
    expect(vehicleService.update).toHaveBeenCalledWith(vehicle.id, {
      price: '31999.00',
      quantity: 3,
    });
  });

  it('deletes a vehicle as an administrator', async () => {
    const response = await request(app())
      .delete(`/api/vehicles/${vehicle.id}`)
      .set(authorized());

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
    expect(vehicleService.delete).toHaveBeenCalledWith(vehicle.id);
  });

  it('rejects an invalid vehicle identifier before calling the service', async () => {
    const response = await request(app())
      .put('/api/vehicles/not-a-uuid')
      .set(authorized())
      .send({ quantity: 3 });

    expect(response.status).toBe(400);
    expect(vehicleService.update).not.toHaveBeenCalled();
  });
});
