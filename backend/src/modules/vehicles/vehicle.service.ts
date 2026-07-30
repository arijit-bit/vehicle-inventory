import type {
  CreateVehicleInput,
  UpdateVehicleInput,
  VehiclePagination,
  VehicleSearchFilters,
} from './vehicle.schemas.js';
import {
  InsufficientStockError,
  VehicleNotFoundError,
  type VehiclePage,
  type VehicleRecord,
  type VehicleRepository,
} from './vehicle.types.js';
import type { OrderRecord, OrderRepository } from '../orders/order.types.js';

export class VehicleService {
  constructor(
    private readonly vehicles: VehicleRepository,
    private readonly orders: OrderRepository,
  ) {}

  create(input: CreateVehicleInput): Promise<VehicleRecord> {
    return this.vehicles.create(input);
  }

  list(pagination: VehiclePagination): Promise<VehiclePage> {
    return this.vehicles.findAll(pagination);
  }

  search(filters: VehicleSearchFilters, pagination: VehiclePagination): Promise<VehiclePage> {
    return this.vehicles.search(filters, pagination);
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

  async purchase(
    id: string,
    quantity: number,
    userId: string,
  ): Promise<{ vehicle: VehicleRecord; order: OrderRecord }> {
    const result = await this.orders.reserve(userId, id, quantity);

    if (result.status === 'NOT_FOUND') {
      throw new VehicleNotFoundError();
    }

    if (result.status === 'INSUFFICIENT_STOCK') {
      throw new InsufficientStockError();
    }

    return {
      vehicle: result.vehicle,
      order: result.order,
    };
  }

  async restock(id: string, quantity: number): Promise<VehicleRecord> {
    const vehicle = await this.vehicles.restock(id, quantity);

    if (!vehicle) {
      throw new VehicleNotFoundError();
    }

    return vehicle;
  }
}
