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

export interface VehicleRepository {
  create(input: CreateVehicleInput): Promise<VehicleRecord>;
  findAll(): Promise<VehicleRecord[]>;
  search(filters: VehicleSearchFilters): Promise<VehicleRecord[]>;
  update(id: string, input: UpdateVehicleInput): Promise<VehicleRecord | null>;
  delete(id: string): Promise<boolean>;
}

export class VehicleNotFoundError extends Error {
  constructor() {
    super('Vehicle not found');
    this.name = 'VehicleNotFoundError';
  }
}
