import type {
  CreateVehicleInput,
  UpdateVehicleInput,
  VehicleSearchFilters,
} from './vehicle.schemas.js';

export interface VehicleRecord {
  id: string;
  make: string;
  model: string;
  category: string;
  price: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export type PurchaseResult =
  | {
      status: 'UPDATED';
      vehicle: VehicleRecord;
    }
  | {
      status: 'NOT_FOUND';
    }
  | {
      status: 'INSUFFICIENT_STOCK';
    };

export interface VehicleRepository {
  create(input: CreateVehicleInput): Promise<VehicleRecord>;
  findAll(): Promise<VehicleRecord[]>;
  search(filters: VehicleSearchFilters): Promise<VehicleRecord[]>;
  update(id: string, input: UpdateVehicleInput): Promise<VehicleRecord | null>;
  delete(id: string): Promise<boolean>;
  purchase(id: string, quantity: number): Promise<PurchaseResult>;
  restock(id: string, quantity: number): Promise<VehicleRecord | null>;
}

export class VehicleNotFoundError extends Error {
  constructor() {
    super('Vehicle not found');
    this.name = 'VehicleNotFoundError';
  }
}

export class InsufficientStockError extends Error {
  constructor() {
    super('Insufficient vehicle stock');
    this.name = 'InsufficientStockError';
  }
}

export class InventoryBusyError extends Error {
  constructor() {
    super('Inventory is busy; retry the request');
    this.name = 'InventoryBusyError';
  }
}
