import type {
  CreateVehicleInput,
  UpdateVehicleInput,
  VehicleSearchFilters,
} from './vehicle.schemas.js';
import {
  InsufficientStockError,
  VehicleNotFoundError,
  type VehicleRecord,
  type VehicleRepository,
} from './vehicle.types.js';

export class VehicleService {
  constructor(private readonly vehicles: VehicleRepository) {}

  create(input: CreateVehicleInput): Promise<VehicleRecord> {
    return this.vehicles.create(input);
  }

  list(): Promise<VehicleRecord[]> {
    return this.vehicles.findAll();
  }

  search(filters: VehicleSearchFilters): Promise<VehicleRecord[]> {
    return this.vehicles.search(filters);
  }

  async update(id: string, input: UpdateVehicleInput): Promise<VehicleRecord> {
    const vehicle = await this.vehicles.update(id, input);

    if (!vehicle) {
      throw new VehicleNotFoundError();
    }

    return vehicle;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.vehicles.delete(id);

    if (!deleted) {
      throw new VehicleNotFoundError();
    }
  }

  async purchase(id: string, quantity: number): Promise<VehicleRecord> {
    const result = await this.vehicles.purchase(id, quantity);

    if (result.status === 'NOT_FOUND') {
      throw new VehicleNotFoundError();
    }

    if (result.status === 'INSUFFICIENT_STOCK') {
      throw new InsufficientStockError();
    }

    return result.vehicle;
  }

  async restock(id: string, quantity: number): Promise<VehicleRecord> {
    const vehicle = await this.vehicles.restock(id, quantity);

    if (!vehicle) {
      throw new VehicleNotFoundError();
    }

    return vehicle;
  }
}
