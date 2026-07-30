import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VehicleService } from './vehicle.service.js';
import type { OrderRepository } from '../orders/order.types.js';
import {
  InsufficientStockError,
  VehicleNotFoundError,
  type VehicleRecord,
  type VehiclePage,
  type VehicleRepository,
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
const vehiclePage: VehiclePage = {
  vehicles: [vehicle],
  pagination: { limit: 6, skip: 0, total: 1 },
  brands: ['Toyota'],
};

describe('VehicleService', () => {
  const repository: VehicleRepository = {
    create: vi.fn(),
    findAll: vi.fn(),
    search: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    restock: vi.fn(),
  };
  const orders: OrderRepository = {
    reserve: vi.fn(),
    findForUser: vi.fn(),
    findAll: vi.fn(),
    cancel: vi.fn(),
  };
  const service = new VehicleService(repository, orders);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(repository.create).mockResolvedValue(vehicle);
    vi.mocked(repository.findAll).mockResolvedValue(vehiclePage);
    vi.mocked(repository.search).mockResolvedValue(vehiclePage);
    vi.mocked(repository.update).mockResolvedValue(vehicle);
    vi.mocked(repository.delete).mockResolvedValue(true);
    vi.mocked(orders.reserve).mockResolvedValue({
      status: 'UPDATED',
      vehicle: { ...vehicle, quantity: 2 },
      order: {} as never,
    });
    vi.mocked(repository.restock).mockResolvedValue({ ...vehicle, quantity: 6 });
  });

  it('creates a vehicle through the repository', async () => {
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

    await expect(service.create(input)).resolves.toEqual(vehicle);
    expect(repository.create).toHaveBeenCalledWith(input);
  });

  it('lists one inventory page', async () => {
    const pagination = { limit: 6, skip: 6 };

    await expect(service.list(pagination)).resolves.toEqual(vehiclePage);
    expect(repository.findAll).toHaveBeenCalledWith(pagination);
  });

  it('forwards combined search filters and pagination', async () => {
    const filters = {
      make: 'toy',
      model: 'cam',
      category: 'sedan',
      minPrice: '10000.00',
      maxPrice: '40000.00',
    };
    const pagination = { limit: 6, skip: 12 };

    await expect(service.search(filters, pagination)).resolves.toEqual(vehiclePage);
    expect(repository.search).toHaveBeenCalledWith(filters, pagination);
  });

  it('reports a missing vehicle during update', async () => {
    vi.mocked(repository.update).mockResolvedValue(null);

    await expect(service.update(vehicle.id, { price: '31999.00' })).rejects.toBeInstanceOf(
      VehicleNotFoundError,
    );
  });

  it('reports a missing vehicle during deletion', async () => {
    vi.mocked(repository.delete).mockResolvedValue(false);

    await expect(service.delete(vehicle.id)).rejects.toBeInstanceOf(VehicleNotFoundError);
  });

  it('purchases stock through an atomic repository operation', async () => {
    await expect(
      service.purchase(vehicle.id, 2, 'f9117522-a624-4e2e-a489-3b2ec2840292'),
    ).resolves.toMatchObject({
      vehicle: { quantity: 2 },
    });
    expect(orders.reserve).toHaveBeenCalledWith(
      'f9117522-a624-4e2e-a489-3b2ec2840292',
      vehicle.id,
      2,
    );
  });

  it('distinguishes insufficient stock from a missing vehicle', async () => {
    vi.mocked(orders.reserve).mockResolvedValue({ status: 'INSUFFICIENT_STOCK' });

    await expect(
      service.purchase(vehicle.id, 5, 'f9117522-a624-4e2e-a489-3b2ec2840292'),
    ).rejects.toBeInstanceOf(InsufficientStockError);

    vi.mocked(orders.reserve).mockResolvedValue({ status: 'NOT_FOUND' });

    await expect(
      service.purchase(vehicle.id, 1, 'f9117522-a624-4e2e-a489-3b2ec2840292'),
    ).rejects.toBeInstanceOf(VehicleNotFoundError);
  });

  it('restocks an existing vehicle', async () => {
    await expect(service.restock(vehicle.id, 2)).resolves.toMatchObject({ quantity: 6 });
    expect(repository.restock).toHaveBeenCalledWith(vehicle.id, 2);
  });

  it('reports a missing vehicle during restock', async () => {
    vi.mocked(repository.restock).mockResolvedValue(null);

    await expect(service.restock(vehicle.id, 2)).rejects.toBeInstanceOf(VehicleNotFoundError);
  });
});
