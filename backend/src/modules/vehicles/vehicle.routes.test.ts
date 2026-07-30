import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../app.js';
import type { TokenVerifier } from '../auth/auth.types.js';
import {
  InsufficientStockError,
  InventoryBusyError,
  VehicleNotFoundError,
  type VehicleRecord,
} from './vehicle.types.js';

const vehicle: VehicleRecord = {
  id: 'a104ce48-e57f-4fb0-8793-57c8b9a2c913',
  make: 'Toyota',
  model: 'Camry',
  year: 2025,
  category: 'Sedan',
  imageKey: 'WHITE_RR',
  colorName: 'Frozen Silver',
  colorHex: '#C8C9C7',
  engine: '2.5L Hybrid',
  transmission: 'AUTOMATIC',
  fuelType: 'HYBRID',
  details: 'Executive hybrid sedan.',
  price: '32999.90',
  quantity: 4,
  createdAt: new Date('2026-07-29T00:00:00.000Z'),
  updatedAt: new Date('2026-07-29T00:00:00.000Z'),
};
const vehiclePage = {
  vehicles: [vehicle],
  pagination: {
    limit: 6,
    skip: 0,
    total: 10,
  },
  brands: ['Toyota'],
};

describe('vehicle HTTP API', () => {
  const vehicleService = {
    create: vi.fn(),
    list: vi.fn(),
    search: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    purchase: vi.fn(),
    restock: vi.fn(),
  };
  const tokenVerifier: TokenVerifier = {
    verify: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vehicleService.create.mockResolvedValue(vehicle);
    vehicleService.list.mockResolvedValue(vehiclePage);
    vehicleService.search.mockResolvedValue(vehiclePage);
    vehicleService.update.mockResolvedValue(vehicle);
    vehicleService.delete.mockResolvedValue(undefined);
    vehicleService.purchase.mockResolvedValue({
      vehicle: { ...vehicle, quantity: 3 },
      order: { id: '2e18dc0f-9dcf-4d1e-a915-a6c73cd29a30', status: 'RESERVED' },
    });
    vehicleService.restock.mockResolvedValue({ ...vehicle, quantity: 6 });
    vi.mocked(tokenVerifier.verify).mockReturnValue({
      sub: 'f9117522-a624-4e2e-a489-3b2ec2840292',
      email: 'admin@example.com',
      role: 'ADMIN',
    });
  });

  const app = () => createApp({ tokenVerifier, vehicleService });
  const authorized = () => ({ Authorization: 'Bearer signed.jwt.token' });
  const authenticateCustomer = () => {
    vi.mocked(tokenVerifier.verify).mockReturnValue({
      sub: 'f9117522-a624-4e2e-a489-3b2ec2840292',
      email: 'driver@example.com',
      role: 'CUSTOMER',
    });
  };

  it('allows a guest to list vehicles', async () => {
    const response = await request(app()).get('/api/vehicles');

    expect(response.status).toBe(200);
    expect(vehicleService.list).toHaveBeenCalledWith({ limit: 6, skip: 0 });
    expect(response.body).toEqual({
      ...vehiclePage,
      vehicles: [
        {
          ...vehicle,
          createdAt: '2026-07-29T00:00:00.000Z',
          updatedAt: '2026-07-29T00:00:00.000Z',
        },
      ],
    });
  });

  it('lists the second page for an authenticated user', async () => {
    vi.mocked(tokenVerifier.verify).mockReturnValue({
      sub: 'f9117522-a624-4e2e-a489-3b2ec2840292',
      email: 'driver@example.com',
      role: 'CUSTOMER',
    });

    const response = await request(app())
      .get('/api/vehicles')
      .query({ limit: 6, skip: 6 })
      .set(authorized());

    expect(response.status).toBe(200);
    expect(vehicleService.list).toHaveBeenCalledWith({ limit: 6, skip: 6 });
    expect(response.body).toEqual({
      vehicles: [
        {
          ...vehicle,
          createdAt: '2026-07-29T00:00:00.000Z',
          updatedAt: '2026-07-29T00:00:00.000Z',
        },
      ],
      pagination: {
        limit: 6,
        skip: 0,
        total: 10,
      },
      brands: ['Toyota'],
    });
  });

  it('searches with combined normalized filters', async () => {
    const response = await request(app()).get('/api/vehicles/search').query({
      make: ' toy ',
      model: ' cam ',
      category: ' sedan ',
      minPrice: '10000',
      maxPrice: '40000.5',
      availability: 'available',
      sort: 'price-desc',
      limit: '6',
      skip: '6',
    });
    expect(response.status).toBe(200);
    expect(vehicleService.search).toHaveBeenCalledWith(
      {
        make: 'toy',
        model: 'cam',
        category: 'sedan',
        minPrice: '10000.00',
        maxPrice: '40000.50',
        availability: 'available',
        sort: 'price-desc',
      },
      { limit: 6, skip: 6 },
    );
  });

  it('allows an administrator to create a normalized vehicle', async () => {
    const response = await request(app()).post('/api/vehicles').set(authorized()).send({
      make: ' Toyota ',
      model: ' Camry ',
      year: 2025,
      category: ' Sedan ',
      imageKey: 'WHITE_RR',
      colorName: ' Frozen Silver ',
      colorHex: '#C8C9C7',
      engine: ' 2.5L Hybrid ',
      transmission: 'AUTOMATIC',
      fuelType: 'HYBRID',
      details: ' Executive hybrid sedan. ',
      price: 32999.9,
      quantity: 4,
    });

    expect(response.status).toBe(201);
    expect(vehicleService.create).toHaveBeenCalledWith({
      make: 'Toyota',
      model: 'Camry',
      year: 2025,
      category: 'Sedan',
      imageKey: 'WHITE_RR',
      colorName: 'Frozen Silver',
      colorHex: '#C8C9C7',
      engine: '2.5L Hybrid',
      transmission: 'AUTOMATIC',
      fuelType: 'HYBRID',
      details: 'Executive hybrid sedan.',
      price: '32999.90',
      quantity: 4,
    });
  });

  it.each(['post', 'put'] as const)('allows an employee to %s vehicle records', async (method) => {
    vi.mocked(tokenVerifier.verify).mockReturnValue({
      sub: 'f9117522-a624-4e2e-a489-3b2ec2840292',
      email: 'sales@example.com',
      role: 'EMPLOYEE',
    });
    const path = method === 'post' ? '/api/vehicles' : `/api/vehicles/${vehicle.id}`;
    const response = await (
      method === 'post' ? request(app()).post(path) : request(app()).put(path)
    )
      .set(authorized())
      .send({
        make: 'Toyota',
        model: 'Camry',
        year: 2025,
        category: 'Sedan',
        imageKey: 'WHITE_RR',
        colorName: 'Frozen Silver',
        colorHex: '#C8C9C7',
        engine: '2.5L Hybrid',
        transmission: 'AUTOMATIC',
        fuelType: 'HYBRID',
        details: 'Executive hybrid sedan.',
        price: 32999.9,
        ...(method === 'post' ? { quantity: 4 } : {}),
      });

    expect(response.status).toBe(method === 'post' ? 201 : 200);
  });

  it.each([
    ['post', '/api/vehicles'],
    ['put', `/api/vehicles/${vehicle.id}`],
    ['delete', `/api/vehicles/${vehicle.id}`],
  ] as const)('denies a regular user from %s %s', async (method, path) => {
    vi.mocked(tokenVerifier.verify).mockReturnValue({
      sub: 'f9117522-a624-4e2e-a489-3b2ec2840292',
      email: 'driver@example.com',
      role: 'CUSTOMER',
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

  it('updates vehicle details as an administrator without replacing stock', async () => {
    const response = await request(app())
      .put(`/api/vehicles/${vehicle.id}`)
      .set(authorized())
      .send({ price: 31999 });

    expect(response.status).toBe(200);
    expect(vehicleService.update).toHaveBeenCalledWith(vehicle.id, {
      price: '31999.00',
    });
  });

  it('deletes a vehicle as an administrator', async () => {
    const response = await request(app()).delete(`/api/vehicles/${vehicle.id}`).set(authorized());

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
    expect(vehicleService.delete).toHaveBeenCalledWith(vehicle.id);
  });

  it('rejects an invalid vehicle identifier before calling the service', async () => {
    const response = await request(app())
      .put('/api/vehicles/not-a-uuid')
      .set(authorized())
      .send({ price: 31999 });

    expect(response.status).toBe(400);
    expect(vehicleService.update).not.toHaveBeenCalled();
  });

  it('returns a stable 404 error when a vehicle no longer exists', async () => {
    vehicleService.update.mockRejectedValue(new VehicleNotFoundError());

    const response = await request(app())
      .put(`/api/vehicles/${vehicle.id}`)
      .set(authorized())
      .send({ price: 31999 });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: 'VEHICLE_NOT_FOUND',
        message: 'Vehicle not found',
      },
    });
  });

  it('purchases a requested quantity as a customer', async () => {
    authenticateCustomer();

    const response = await request(app())
      .post(`/api/vehicles/${vehicle.id}/purchase`)
      .set(authorized())
      .send({ quantity: 1 });

    expect(response.status).toBe(200);
    expect(vehicleService.purchase).toHaveBeenCalledWith(
      vehicle.id,
      1,
      'f9117522-a624-4e2e-a489-3b2ec2840292',
    );
    expect(response.body.vehicle.quantity).toBe(3);
    expect(response.body.order.status).toBe('RESERVED');
  });

  it('purchases one vehicle when quantity is omitted', async () => {
    authenticateCustomer();

    const response = await request(app())
      .post(`/api/vehicles/${vehicle.id}/purchase`)
      .set(authorized());

    expect(response.status).toBe(200);
    expect(vehicleService.purchase).toHaveBeenCalledWith(
      vehicle.id,
      1,
      'f9117522-a624-4e2e-a489-3b2ec2840292',
    );
  });

  it('returns 409 when a purchase exceeds available stock', async () => {
    authenticateCustomer();
    vehicleService.purchase.mockRejectedValue(new InsufficientStockError());

    const response = await request(app())
      .post(`/api/vehicles/${vehicle.id}/purchase`)
      .set(authorized())
      .send({ quantity: 5 });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('INSUFFICIENT_STOCK');
  });

  it('returns a retryable 503 when a database lock times out', async () => {
    authenticateCustomer();
    vehicleService.purchase.mockRejectedValue(new InventoryBusyError());

    const response = await request(app())
      .post(`/api/vehicles/${vehicle.id}/purchase`)
      .set(authorized())
      .send({ quantity: 1 });

    expect(response.status).toBe(503);
    expect(response.header['retry-after']).toBe('1');
    expect(response.body).toEqual({
      error: {
        code: 'INVENTORY_BUSY',
        message: 'Inventory is busy; retry the request',
      },
    });
  });

  it.each(['EMPLOYEE', 'ADMIN'] as const)(
    'denies vehicle reservations to %s users',
    async (role) => {
      vi.mocked(tokenVerifier.verify).mockReturnValue({
        sub: 'f9117522-a624-4e2e-a489-3b2ec2840292',
        email: `${role.toLowerCase()}@example.com`,
        role,
      });

      const response = await request(app())
        .post(`/api/vehicles/${vehicle.id}/purchase`)
        .set(authorized())
        .send({ quantity: 1 });

      expect(response.status).toBe(403);
      expect(vehicleService.purchase).not.toHaveBeenCalled();
    },
  );

  it('allows an administrator to restock a vehicle', async () => {
    const response = await request(app())
      .post(`/api/vehicles/${vehicle.id}/restock`)
      .set(authorized())
      .send({ quantity: 2 });

    expect(response.status).toBe(200);
    expect(vehicleService.restock).toHaveBeenCalledWith(vehicle.id, 2);
    expect(response.body.vehicle.quantity).toBe(6);
  });

  it('restocks one vehicle when quantity is omitted', async () => {
    const response = await request(app())
      .post(`/api/vehicles/${vehicle.id}/restock`)
      .set(authorized());

    expect(response.status).toBe(200);
    expect(vehicleService.restock).toHaveBeenCalledWith(vehicle.id, 1);
  });

  it('denies a regular user from restocking a vehicle', async () => {
    vi.mocked(tokenVerifier.verify).mockReturnValue({
      sub: 'f9117522-a624-4e2e-a489-3b2ec2840292',
      email: 'driver@example.com',
      role: 'CUSTOMER',
    });

    const response = await request(app())
      .post(`/api/vehicles/${vehicle.id}/restock`)
      .set(authorized())
      .send({ quantity: 2 });

    expect(response.status).toBe(403);
    expect(vehicleService.restock).not.toHaveBeenCalled();
  });

  it.each([
    ['delete', `/api/vehicles/${vehicle.id}`],
    ['post', `/api/vehicles/${vehicle.id}/restock`],
  ] as const)('denies an employee from %s %s', async (method, path) => {
    vi.mocked(tokenVerifier.verify).mockReturnValue({
      sub: 'f9117522-a624-4e2e-a489-3b2ec2840292',
      email: 'sales@example.com',
      role: 'EMPLOYEE',
    });

    const response = await request(app())[method](path).set(authorized()).send({ quantity: 2 });

    expect(response.status).toBe(403);
  });
});
