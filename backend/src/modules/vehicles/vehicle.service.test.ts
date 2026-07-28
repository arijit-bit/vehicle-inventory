import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VehicleService } from './vehicle.service.js';
import {
  InsufficientStockError,
  VehicleNotFoundError,
  type VehicleRecord,
  type VehicleRepository,
} from './vehicle.types.js';

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

describe('VehicleService', () => {
  const repository: VehicleRepository = {
    create: vi.fn(),
    findAll: vi.fn(),
    search: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    purchase: vi.fn(),
    restock: vi.fn(),
  };
  const service = new VehicleService(repository);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(repository.create).mockResolvedValue(vehicle);
    vi.mocked(repository.findAll).mockResolvedValue([vehicle]);
    vi.mocked(repository.search).mockResolvedValue([vehicle]);
    vi.mocked(repository.update).mockResolvedValue(vehicle);
    vi.mocked(repository.delete).mockResolvedValue(true);
    vi.mocked(repository.purchase).mockResolvedValue({
      status: 'UPDATED',
      vehicle: { ...vehicle, quantity: 2 },
    });
    vi.mocked(repository.restock).mockResolvedValue({ ...vehicle, quantity: 6 });
  });

  it('creates a vehicle through the repository', async () => {
    const input = {
      make: 'Toyota',
      model: 'Camry',
      category: 'Sedan',
      price: '32999.90',
      quantity: 4,
    };

    await expect(service.create(input)).resolves.toEqual(vehicle);
    expect(repository.create).toHaveBeenCalledWith(input);
  });

  it('lists all inventory records', async () => {
    await expect(service.list()).resolves.toEqual([vehicle]);
    expect(repository.findAll).toHaveBeenCalledOnce();
  });

  it('forwards combined search filters', async () => {
    const filters = {
      make: 'toy',
      model: 'cam',
      category: 'sedan',
      minPrice: '10000.00',
      maxPrice: '40000.00',
    };

    await expect(service.search(filters)).resolves.toEqual([vehicle]);
    expect(repository.search).toHaveBeenCalledWith(filters);
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
    await expect(service.purchase(vehicle.id, 2)).resolves.toMatchObject({ quantity: 2 });
    expect(repository.purchase).toHaveBeenCalledWith(vehicle.id, 2);
  });

  it('distinguishes insufficient stock from a missing vehicle', async () => {
    vi.mocked(repository.purchase).mockResolvedValue({ status: 'INSUFFICIENT_STOCK' });

    await expect(service.purchase(vehicle.id, 5)).rejects.toBeInstanceOf(InsufficientStockError);

    vi.mocked(repository.purchase).mockResolvedValue({ status: 'NOT_FOUND' });

    await expect(service.purchase(vehicle.id, 1)).rejects.toBeInstanceOf(VehicleNotFoundError);
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
