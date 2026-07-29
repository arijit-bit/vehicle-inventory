import type { Prisma } from '../../generated/prisma/client.js';
import type { DatabaseClient } from '../../infrastructure/database/prisma.js';
import type {
  CreateVehicleInput,
  UpdateVehicleInput,
  VehicleSearchFilters,
} from './vehicle.schemas.js';
import {
  InventoryBusyError,
  type PurchaseResult,
  type VehicleRecord,
  type VehicleRepository,
} from './vehicle.types.js';

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

  async purchase(id: string, quantity: number): Promise<PurchaseResult> {
    return this.withInventoryTransaction(async (transaction) => {
      const [vehicle] = await transaction.vehicle.updateManyAndReturn({
        where: {
          id,
          quantity: {
            gte: quantity,
          },
        },
        data: {
          quantity: {
            decrement: quantity,
          },
        },
        select: vehicleSelection,
      });

      if (vehicle) {
        return {
          status: 'UPDATED',
          vehicle: toVehicleRecord(vehicle),
        };
      }

      const existingVehicle = await transaction.vehicle.findUnique({
        where: { id },
        select: { id: true },
      });

      return existingVehicle ? { status: 'INSUFFICIENT_STOCK' } : { status: 'NOT_FOUND' };
    });
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
