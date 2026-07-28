import type {
  CreateVehicleInput,
  UpdateVehicleInput,
  VehicleSearchFilters,
} from './vehicle.schemas.js';
import {
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
}
