import type { Prisma } from '../../generated/prisma/client.js';
import type { DatabaseClient } from '../../infrastructure/database/prisma.js';
import type {
  CreateVehicleInput,
  FuelType,
  Transmission,
  UpdateVehicleInput,
  VehicleImageKey,
  VehiclePagination,
  VehicleSearchFilters,
} from './vehicle.schemas.js';
import {
  InventoryBusyError,
  type VehiclePage,
  type VehicleRecord,
  type VehicleRepository,
} from './vehicle.types.js';

const vehicleSelection = {
  id: true,
  make: true,
  model: true,
  year: true,
  category: true,
  imageKey: true,
  colorName: true,
  colorHex: true,
  engine: true,
  transmission: true,
  fuelType: true,
  details: true,
  price: true,
  quantity: true,
  createdAt: true,
  updatedAt: true,
} as const;

interface StoredVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  category: string;
  imageKey: VehicleImageKey;
  colorName: string;
  colorHex: string;
  engine: string;
  transmission: Transmission;
  fuelType: FuelType;
  details: string;
  price: { toFixed(decimalPlaces: number): string };
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

const toVehicleRecord = (vehicle: StoredVehicle): VehicleRecord => ({
  ...vehicle,
  price: vehicle.price.toFixed(2),
});

const isMissingRecordError = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code: unknown }).code === 'P2025';

const retryableDatabaseCodes = new Set(['55P03', '57014']);

const isRetryableDatabaseTimeout = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const candidate = error as {
    code?: unknown;
    message?: unknown;
    meta?: unknown;
    cause?: unknown;
  };

  if (typeof candidate.code === 'string' && retryableDatabaseCodes.has(candidate.code)) {
    return true;
  }

  if (
    typeof candidate.message === 'string' &&
    /(lock timeout|statement timeout|transaction.*timed out|unable to start a transaction in the given time)/i.test(
      candidate.message,
    )
  ) {
    return true;
  }

  return isRetryableDatabaseTimeout(candidate.meta) || isRetryableDatabaseTimeout(candidate.cause);
};

export interface InventoryTimeouts {
  lockTimeoutMs: number;
  statementTimeoutMs: number;
}

const defaultInventoryTimeouts: InventoryTimeouts = {
  lockTimeoutMs: 2_000,
  statementTimeoutMs: 10_000,
};

export class PrismaVehicleRepository implements VehicleRepository {
  constructor(
    private readonly database: DatabaseClient,
    private readonly timeouts: InventoryTimeouts = defaultInventoryTimeouts,
  ) {}

  private async withInventoryTransaction<T>(
    operation: (transaction: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    try {
      return await this.database.$transaction(
        async (transaction) => {
          await transaction.$queryRawUnsafe(
            "SELECT set_config('lock_timeout', $1, true), set_config('statement_timeout', $2, true)",
            `${this.timeouts.lockTimeoutMs}ms`,
            `${this.timeouts.statementTimeoutMs}ms`,
          );

          return operation(transaction);
        },
        {
          maxWait: this.timeouts.statementTimeoutMs,
          timeout: this.timeouts.statementTimeoutMs + 1_000,
        },
      );
    } catch (error) {
      if (isRetryableDatabaseTimeout(error)) {
        throw new InventoryBusyError();
      }

      throw error;
    }
  }

  async create(input: CreateVehicleInput): Promise<VehicleRecord> {
    const vehicle = await this.database.vehicle.create({
      data: input,
      select: vehicleSelection,
    });

    return toVehicleRecord(vehicle);
  }

  private async findPage(
    where: Prisma.VehicleWhereInput,
    pagination: VehiclePagination,
    orderBy: Prisma.VehicleOrderByWithRelationInput[],
  ): Promise<VehiclePage> {
    const [vehicles, total, brandRows] = await Promise.all([
      this.database.vehicle.findMany({
        where,
        select: vehicleSelection,
        orderBy,
        take: pagination.limit,
        skip: pagination.skip,
      }),
      this.database.vehicle.count({ where }),
      this.database.vehicle.findMany({
        distinct: ['make'],
        select: { make: true },
        orderBy: { make: 'asc' },
      }),
    ]);

    return {
      vehicles: vehicles.map(toVehicleRecord),
      pagination: {
        ...pagination,
        total,
      },
      brands: brandRows.map(({ make }) => make),
    };
  }

  findAll(pagination: VehiclePagination): Promise<VehiclePage> {
    return this.findPage({}, pagination, [{ createdAt: 'desc' }, { id: 'asc' }]);
  }

  search(filters: VehicleSearchFilters, pagination: VehiclePagination): Promise<VehiclePage> {
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
      ...(filters.availability === 'available' && {
        quantity: { gt: 0 },
      }),
      ...(filters.availability === 'sold-out' && {
        quantity: 0,
      }),
    };
    const orderBy: Prisma.VehicleOrderByWithRelationInput[] =
      filters.sort === 'price-asc'
        ? [{ price: 'asc' }, { id: 'asc' }]
        : filters.sort === 'price-desc'
          ? [{ price: 'desc' }, { id: 'asc' }]
          : [{ createdAt: 'desc' }, { id: 'asc' }];

    return this.findPage(where, pagination, orderBy);
  }

  async update(id: string, input: UpdateVehicleInput): Promise<VehicleRecord | null> {
    const data: Prisma.VehicleUpdateInput = {
      ...(input.make !== undefined && { make: input.make }),
      ...(input.model !== undefined && { model: input.model }),
      ...(input.year !== undefined && { year: input.year }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.imageKey !== undefined && { imageKey: input.imageKey }),
      ...(input.colorName !== undefined && { colorName: input.colorName }),
      ...(input.colorHex !== undefined && { colorHex: input.colorHex }),
      ...(input.engine !== undefined && { engine: input.engine }),
      ...(input.transmission !== undefined && { transmission: input.transmission }),
      ...(input.fuelType !== undefined && { fuelType: input.fuelType }),
      ...(input.details !== undefined && { details: input.details }),
      ...(input.price !== undefined && { price: input.price }),
    };

    try {
      const vehicle = await this.withInventoryTransaction((transaction) =>
        transaction.vehicle.update({
          where: { id },
          data,
          select: vehicleSelection,
        }),
      );

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
      await this.withInventoryTransaction((transaction) =>
        transaction.vehicle.delete({
          where: { id },
          select: { id: true },
        }),
      );

      return true;
    } catch (error) {
      if (isMissingRecordError(error)) {
        return false;
      }

      throw error;
    }
  }

  async restock(id: string, quantity: number): Promise<VehicleRecord | null> {
    try {
      const vehicle = await this.withInventoryTransaction((transaction) =>
        transaction.vehicle.update({
          where: { id },
          data: {
            quantity: {
              increment: quantity,
            },
          },
          select: vehicleSelection,
        }),
      );

      return toVehicleRecord(vehicle);
    } catch (error) {
      if (isMissingRecordError(error)) {
        return null;
      }

      throw error;
    }
  }
}
