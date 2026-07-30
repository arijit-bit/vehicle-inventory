import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DatabaseClient } from '../../infrastructure/database/prisma.js';
import { PrismaVehicleRepository } from './prisma-vehicle.repository.js';
import { InventoryBusyError } from './vehicle.types.js';

const storedVehicle = {
  id: 'a104ce48-e57f-4fb0-8793-57c8b9a2c913',
  make: 'Toyota',
  model: 'Camry',
  year: 2025,
  category: 'Sedan',
  imageKey: 'WHITE_RR' as const,
  colorName: 'Frozen Silver',
  colorHex: '#C8C9C7',
  engine: '2.5L Hybrid',
  transmission: 'AUTOMATIC' as const,
  fuelType: 'HYBRID' as const,
  details: 'Executive hybrid sedan.',
  price: {
    toString: () => '32999.9',
    toFixed: () => '32999.90',
  },
  quantity: 4,
  createdAt: new Date('2026-07-29T00:00:00.000Z'),
  updatedAt: new Date('2026-07-29T00:00:00.000Z'),
};

describe('PrismaVehicleRepository', () => {
  const database = {
    $queryRawUnsafe: vi.fn(),
    $transaction: vi.fn(),
    vehicle: {
      create: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };
  const repository = new PrismaVehicleRepository(database as unknown as DatabaseClient);

  beforeEach(() => {
    vi.clearAllMocks();
    database.$queryRawUnsafe.mockResolvedValue([{ set_config: '10000ms' }]);
    database.$transaction.mockImplementation(
      async (operation: (transaction: typeof database) => Promise<unknown>) => operation(database),
    );
    database.vehicle.create.mockResolvedValue(storedVehicle);
    database.vehicle.findMany.mockResolvedValue([storedVehicle]);
    database.vehicle.count.mockResolvedValue(14);
    database.vehicle.update.mockResolvedValue(storedVehicle);
    database.vehicle.delete.mockResolvedValue({ id: storedVehicle.id });
  });

  it('persists a vehicle and serializes its decimal price exactly', async () => {
    const input = {
      make: 'Toyota',
      model: 'Camry',
      year: 2025,
      category: 'Sedan',
      imageKey: 'WHITE_RR' as const,
      colorName: 'Frozen Silver',
      colorHex: '#C8C9C7',
      engine: '2.5L Hybrid',
      transmission: 'AUTOMATIC' as const,
      fuelType: 'HYBRID' as const,
      details: 'Executive hybrid sedan.',
      price: '32999.90',
      quantity: 4,
    };

    await expect(repository.create(input)).resolves.toMatchObject({
      ...input,
      id: storedVehicle.id,
      price: '32999.90',
    });
    expect(database.vehicle.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: input,
      }),
    );
  });

  it('loads exactly six vehicles after the requested offset', async () => {
    await expect(repository.findAll({ limit: 6, skip: 6 })).resolves.toMatchObject({
      vehicles: [{ id: storedVehicle.id }],
      pagination: { limit: 6, skip: 6, total: 14 },
      brands: ['Toyota'],
    });

    expect(database.vehicle.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        take: 6,
        skip: 6,
      }),
    );
    expect(database.vehicle.count).toHaveBeenCalledWith({ where: {} });
  });

  it('applies conditions and ordering before paginating search results', async () => {
    await repository.search(
      {
        make: 'toy',
        model: 'cam',
        category: 'sedan',
        minPrice: '10000.00',
        maxPrice: '40000.00',
        availability: 'available',
        sort: 'price-desc',
      },
      { limit: 6, skip: 12 },
    );

    expect(database.vehicle.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: {
          make: { contains: 'toy', mode: 'insensitive' },
          model: { contains: 'cam', mode: 'insensitive' },
          category: { contains: 'sedan', mode: 'insensitive' },
          price: { gte: '10000.00', lte: '40000.00' },
          quantity: { gt: 0 },
        },
        orderBy: [{ price: 'desc' }, { id: 'asc' }],
        take: 6,
        skip: 12,
      }),
    );
    expect(database.vehicle.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        make: { contains: 'toy', mode: 'insensitive' },
        quantity: { gt: 0 },
      }),
    });
  });

  it('sends only supplied fields during a partial update', async () => {
    await repository.update(storedVehicle.id, {
      price: '31999.00',
      engine: '2.5L Plug-in Hybrid',
    });

    expect(database.vehicle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: storedVehicle.id },
        data: {
          price: '31999.00',
          engine: '2.5L Plug-in Hybrid',
        },
      }),
    );
  });

  it('returns null when Prisma reports a missing update target', async () => {
    database.vehicle.update.mockRejectedValue({ code: 'P2025' });

    await expect(repository.update(storedVehicle.id, { price: '31999.00' })).resolves.toBeNull();
  });

  it('returns false when Prisma reports a missing delete target', async () => {
    database.vehicle.delete.mockRejectedValue({ code: 'P2025' });

    await expect(repository.delete(storedVehicle.id)).resolves.toBe(false);
  });

  it('atomically increments stock during restock', async () => {
    database.vehicle.update.mockResolvedValue({ ...storedVehicle, quantity: 6 });

    await expect(repository.restock(storedVehicle.id, 2)).resolves.toMatchObject({
      quantity: 6,
    });
    expect(database.vehicle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: storedVehicle.id },
        data: {
          quantity: { increment: 2 },
        },
      }),
    );
  });

  it('returns null when Prisma reports a missing restock target', async () => {
    database.vehicle.update.mockRejectedValue({ code: 'P2025' });

    await expect(repository.restock(storedVehicle.id, 2)).resolves.toBeNull();
  });

  it('applies transaction-local timeouts around inventory mutations', async () => {
    await repository.restock(storedVehicle.id, 1);

    expect(database.$transaction).toHaveBeenCalledOnce();
    expect(database.$queryRawUnsafe).toHaveBeenCalledWith(
      "SELECT set_config('lock_timeout', $1, true), set_config('statement_timeout', $2, true)",
      '2000ms',
      '10000ms',
    );
  });

  it.each([
    { code: 'P2010', meta: { code: '55P03' } },
    { code: 'P2010', meta: { code: '57014' } },
    {
      code: 'P2028',
      message: 'Transaction API error: Unable to start a transaction in the given time.',
    },
  ])('maps retryable database timeout errors to inventory busy', async (databaseError) => {
    database.vehicle.update.mockRejectedValue(databaseError);

    await expect(repository.restock(storedVehicle.id, 1)).rejects.toBeInstanceOf(
      InventoryBusyError,
    );
  });
});
