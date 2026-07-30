import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DatabaseClient } from '../../infrastructure/database/prisma.js';
import { PrismaOrderRepository } from './prisma-order.repository.js';

const customerId = 'f9117522-a624-4e2e-a489-3b2ec2840292';
const vehicleId = 'a104ce48-e57f-4fb0-8793-57c8b9a2c913';
const orderId = '2e18dc0f-9dcf-4d1e-a915-a6c73cd29a30';
const decimal = (value: string) => ({
  toFixed: () => value,
});
const storedVehicle = {
  id: vehicleId,
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
  price: decimal('32999.90'),
  quantity: 3,
  createdAt: new Date('2026-07-29T00:00:00.000Z'),
  updatedAt: new Date('2026-07-30T00:00:00.000Z'),
};
const storedOrder = {
  id: orderId,
  userId: customerId,
  vehicleId,
  quantity: 1,
  unitPrice: decimal('32999.90'),
  vehicleMake: 'Toyota',
  vehicleModel: 'Camry',
  vehicleYear: 2025,
  vehicleCategory: 'Sedan',
  vehicleImageKey: 'WHITE_RR' as const,
  vehicleColorName: 'Frozen Silver',
  vehicleColorHex: '#C8C9C7',
  vehicleEngine: '2.5L Hybrid',
  vehicleTransmission: 'AUTOMATIC' as const,
  vehicleFuelType: 'HYBRID' as const,
  vehicleDetails: 'Executive hybrid sedan.',
  status: 'RESERVED' as const,
  createdAt: new Date('2026-07-30T00:00:00.000Z'),
  updatedAt: new Date('2026-07-30T00:00:00.000Z'),
  cancelledAt: null,
  user: {
    id: customerId,
    email: 'driver@example.com',
  },
};

describe('PrismaOrderRepository', () => {
  const database = {
    $queryRawUnsafe: vi.fn(),
    $transaction: vi.fn(),
    vehicle: {
      updateManyAndReturn: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    order: {
      create: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      updateManyAndReturn: vi.fn(),
    },
  };
  const repository = new PrismaOrderRepository(database as unknown as DatabaseClient);

  beforeEach(() => {
    vi.clearAllMocks();
    database.$queryRawUnsafe.mockResolvedValue([{ set_config: '10000ms' }]);
    database.$transaction.mockImplementation(
      async (operation: (transaction: typeof database) => Promise<unknown>) => operation(database),
    );
    database.vehicle.updateManyAndReturn.mockResolvedValue([storedVehicle]);
    database.vehicle.findUnique.mockResolvedValue({ id: vehicleId });
    database.vehicle.update.mockResolvedValue({ ...storedVehicle, quantity: 4 });
    database.order.create.mockResolvedValue(storedOrder);
    database.order.count.mockResolvedValue(7);
    database.order.findMany.mockResolvedValue([storedOrder]);
    database.order.findUnique.mockResolvedValue(storedOrder);
    database.order.updateManyAndReturn.mockResolvedValue([
      { ...storedOrder, status: 'CANCELLED', cancelledAt: new Date('2026-07-30T01:00:00.000Z') },
    ]);
  });

  it('decrements stock and stores an immutable order snapshot in one transaction', async () => {
    await expect(repository.reserve(customerId, vehicleId, 1)).resolves.toMatchObject({
      status: 'UPDATED',
      vehicle: { id: vehicleId, quantity: 3 },
      order: {
        id: orderId,
        customer: { id: customerId, email: 'driver@example.com' },
        vehicle: { make: 'Toyota', model: 'Camry', price: '32999.90' },
      },
    });
    expect(database.vehicle.updateManyAndReturn).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: vehicleId, quantity: { gte: 1 } },
        data: { quantity: { decrement: 1 } },
      }),
    );
    expect(database.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: customerId,
          vehicleId,
          quantity: 1,
          unitPrice: storedVehicle.price,
          vehicleMake: 'Toyota',
          vehicleModel: 'Camry',
          vehicleImageKey: 'WHITE_RR',
        }),
      }),
    );
    expect(database.$transaction).toHaveBeenCalledOnce();
  });

  it('does not create an order when stock is insufficient or the vehicle is missing', async () => {
    database.vehicle.updateManyAndReturn.mockResolvedValue([]);

    await expect(repository.reserve(customerId, vehicleId, 4)).resolves.toEqual({
      status: 'INSUFFICIENT_STOCK',
    });
    expect(database.order.create).not.toHaveBeenCalled();

    database.vehicle.findUnique.mockResolvedValue(null);

    await expect(repository.reserve(customerId, vehicleId, 1)).resolves.toEqual({
      status: 'NOT_FOUND',
    });
  });

  it('paginates a customer own orders without exposing another user', async () => {
    await expect(repository.findForUser(customerId, { limit: 6, skip: 6 })).resolves.toMatchObject({
      orders: [{ id: orderId }],
      pagination: { limit: 6, skip: 6, total: 7 },
    });
    expect(database.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: customerId },
        take: 6,
        skip: 6,
      }),
    );
    expect(database.order.count).toHaveBeenCalledWith({ where: { userId: customerId } });
  });

  it('paginates all customer orders for staff', async () => {
    await repository.findAll({ limit: 6, skip: 0 });

    expect(database.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        take: 6,
        skip: 0,
      }),
    );
    expect(database.order.count).toHaveBeenCalledWith({ where: {} });
  });

  it('marks an owned reservation cancelled and restores stock in one transaction', async () => {
    database.order.findUnique.mockResolvedValue({
      ...storedOrder,
      status: 'CANCELLED',
      cancelledAt: new Date('2026-07-30T12:00:00.000Z'),
    });

    await expect(repository.cancel(orderId, customerId)).resolves.toMatchObject({
      status: 'UPDATED',
      order: { id: orderId, status: 'CANCELLED' },
      vehicle: { id: vehicleId, quantity: 4 },
    });
    expect(database.order.updateManyAndReturn).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: orderId, userId: customerId, status: 'RESERVED' },
        data: {
          status: 'CANCELLED',
          cancelledAt: expect.any(Date),
        },
      }),
    );
    expect(database.vehicle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: vehicleId },
        data: { quantity: { increment: 1 } },
      }),
    );
  });

  it('never restores stock for another user or an already-cancelled order', async () => {
    database.order.updateManyAndReturn.mockResolvedValue([]);
    database.order.findUnique.mockResolvedValueOnce({ ...storedOrder, userId: 'other-user-id' });

    await expect(repository.cancel(orderId, customerId)).resolves.toEqual({
      status: 'NOT_FOUND',
    });
    expect(database.vehicle.update).not.toHaveBeenCalled();

    database.order.findUnique.mockResolvedValueOnce({ ...storedOrder, status: 'CANCELLED' });

    await expect(repository.cancel(orderId, customerId)).resolves.toEqual({
      status: 'ALREADY_CANCELLED',
    });
    expect(database.vehicle.update).not.toHaveBeenCalled();
  });
});
