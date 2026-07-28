import type { Prisma } from '../../generated/prisma/client.js';
import type { DatabaseClient } from '../../infrastructure/database/prisma.js';
import type {
  CreateVehicleInput,
  UpdateVehicleInput,
  VehicleSearchFilters,
} from './vehicle.schemas.js';
import type { VehicleRecord, VehicleRepository } from './vehicle.types.js';

const vehicleSelection = {
  id: true,
  make: true,
  model: true,
  category: true,
  price: true,
  quantity: true,
  createdAt: true,
  updatedAt: true,
} as const;

interface StoredVehicle {
  id: string;
  make: string;
  model: string;
  category: string;
  price: { toString(): string };
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

const toVehicleRecord = (vehicle: StoredVehicle): VehicleRecord => ({
  ...vehicle,
  price: vehicle.price.toString(),
});

const isMissingRecordError = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code: unknown }).code === 'P2025';

export class PrismaVehicleRepository implements VehicleRepository {
  constructor(private readonly database: DatabaseClient) {}

  async create(input: CreateVehicleInput): Promise<VehicleRecord> {
    const vehicle = await this.database.vehicle.create({
      data: input,
      select: vehicleSelection,
    });

    return toVehicleRecord(vehicle);
  }

  async findAll(): Promise<VehicleRecord[]> {
    const vehicles = await this.database.vehicle.findMany({
      select: vehicleSelection,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    });

    return vehicles.map(toVehicleRecord);
  }

  async search(filters: VehicleSearchFilters): Promise<VehicleRecord[]> {
    const where: Prisma.VehicleWhereInput = {
      ...(filters.make && {
        make: {
          contains: filters.make,
          mode: 'insensitive',
        },
      }),
      ...(filters.model && {
        model: {
          contains: filters.model,
          mode: 'insensitive',
        },
      }),
      ...(filters.category && {
        category: {
          contains: filters.category,
          mode: 'insensitive',
        },
      }),
      ...((filters.minPrice || filters.maxPrice) && {
        price: {
          ...(filters.minPrice && { gte: filters.minPrice }),
          ...(filters.maxPrice && { lte: filters.maxPrice }),
        },
      }),
    };
    const vehicles = await this.database.vehicle.findMany({
      where,
      select: vehicleSelection,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    });

    return vehicles.map(toVehicleRecord);
  }

  async update(id: string, input: UpdateVehicleInput): Promise<VehicleRecord | null> {
    const data: Prisma.VehicleUpdateInput = {
      ...(input.make !== undefined && { make: input.make }),
      ...(input.model !== undefined && { model: input.model }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.price !== undefined && { price: input.price }),
      ...(input.quantity !== undefined && { quantity: input.quantity }),
    };

    try {
      const vehicle = await this.database.vehicle.update({
        where: { id },
        data,
        select: vehicleSelection,
      });

      return toVehicleRecord(vehicle);
    } catch (error) {
      if (isMissingRecordError(error)) {
        return null;
      }

      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.database.vehicle.delete({
        where: { id },
        select: { id: true },
      });

      return true;
    } catch (error) {
      if (isMissingRecordError(error)) {
        return false;
      }

      throw error;
    }
  }
}
