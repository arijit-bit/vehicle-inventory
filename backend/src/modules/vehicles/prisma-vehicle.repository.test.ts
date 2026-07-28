import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DatabaseClient } from '../../infrastructure/database/prisma.js';
import { PrismaVehicleRepository } from './prisma-vehicle.repository.js';

const storedVehicle = {
  id: 'a104ce48-e57f-4fb0-8793-57c8b9a2c913',
  make: 'Toyota',
  model: 'Camry',
  category: 'Sedan',
  price: {
    toString: () => '32999.90',
  },
  quantity: 4,
  createdAt: new Date('2026-07-29T00:00:00.000Z'),
  updatedAt: new Date('2026-07-29T00:00:00.000Z'),
};

describe('PrismaVehicleRepository', () => {
  const database = {
    vehicle: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };
  const repository = new PrismaVehicleRepository(database as unknown as DatabaseClient);

  beforeEach(() => {
    vi.clearAllMocks();
    database.vehicle.create.mockResolvedValue(storedVehicle);
    database.vehicle.findMany.mockResolvedValue([storedVehicle]);
    database.vehicle.update.mockResolvedValue(storedVehicle);
    database.vehicle.delete.mockResolvedValue({ id: storedVehicle.id });
  });

  it('persists a vehicle and serializes its decimal price exactly', async () => {
    const input = {
      make: 'Toyota',
      model: 'Camry',
      category: 'Sedan',
      price: '32999.90',
      quantity: 4,
    };

    await expect(repository.create(input)).resolves.toMatchObject({
      ...input,
      id: storedVehicle.id,
    });
    expect(database.vehicle.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: input,
      }),
    );
  });

  it('builds an AND search with case-insensitive text and inclusive price bounds', async () => {
    await repository.search({
      make: 'toy',
      model: 'cam',
      category: 'sedan',
      minPrice: '10000.00',
      maxPrice: '40000.00',
    });

    expect(database.vehicle.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          make: { contains: 'toy', mode: 'insensitive' },
          model: { contains: 'cam', mode: 'insensitive' },
          category: { contains: 'sedan', mode: 'insensitive' },
          price: { gte: '10000.00', lte: '40000.00' },
        },
      }),
    );
  });

  it('sends only supplied fields during a partial update', async () => {
    await repository.update(storedVehicle.id, {
      price: '31999.00',
      quantity: 3,
    });

    expect(database.vehicle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: storedVehicle.id },
        data: {
          price: '31999.00',
          quantity: 3,
        },
      }),
    );
  });

  it('returns null when Prisma reports a missing update target', async () => {
    database.vehicle.update.mockRejectedValue({ code: 'P2025' });

    await expect(repository.update(storedVehicle.id, { quantity: 3 })).resolves.toBeNull();
  });

  it('returns false when Prisma reports a missing delete target', async () => {
    database.vehicle.delete.mockRejectedValue({ code: 'P2025' });

    await expect(repository.delete(storedVehicle.id)).resolves.toBe(false);
  });
});
