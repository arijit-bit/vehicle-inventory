import type { Prisma } from '../../generated/prisma/client.js';
import type { DatabaseClient } from '../../infrastructure/database/prisma.js';
import type { VehiclePagination } from '../vehicles/vehicle.schemas.js';
import { InventoryBusyError, type VehicleRecord } from '../vehicles/vehicle.types.js';
import type {
  CancellationResult,
  OrderPage,
  OrderRecord,
  OrderRepository,
  OrderStatus,
  ReservationResult,
} from './order.types.js';

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

const orderSelection = {
  id: true,
  userId: true,
  vehicleId: true,
  quantity: true,
  unitPrice: true,
  vehicleMake: true,
  vehicleModel: true,
  vehicleYear: true,
  vehicleCategory: true,
  vehicleImageKey: true,
  vehicleColorName: true,
  vehicleColorHex: true,
  vehicleEngine: true,
  vehicleTransmission: true,
  vehicleFuelType: true,
  vehicleDetails: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  cancelledAt: true,
  user: {
    select: {
      id: true,
      email: true,
    },
  },
} as const;

type StoredVehicle = Prisma.VehicleGetPayload<{ select: typeof vehicleSelection }>;
type StoredOrder = Prisma.OrderGetPayload<{ select: typeof orderSelection }>;

const toVehicleRecord = (vehicle: StoredVehicle): VehicleRecord => ({
  ...vehicle,
  price: vehicle.price.toFixed(2),
});

const toOrderRecord = (order: StoredOrder): OrderRecord => ({
  id: order.id,
  customer: order.user,
  vehicle: {
    id: order.vehicleId,
    make: order.vehicleMake,
    model: order.vehicleModel,
    year: order.vehicleYear,
    category: order.vehicleCategory,
    imageKey: order.vehicleImageKey,
    colorName: order.vehicleColorName,
    colorHex: order.vehicleColorHex,
    engine: order.vehicleEngine,
    transmission: order.vehicleTransmission,
    fuelType: order.vehicleFuelType,
    details: order.vehicleDetails,
    price: order.unitPrice.toFixed(2),
  },
  quantity: order.quantity,
  status: order.status as OrderStatus,
  reservedAt: order.createdAt,
  updatedAt: order.updatedAt,
  cancelledAt: order.cancelledAt,
});

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

interface InventoryTimeouts {
  lockTimeoutMs: number;
  statementTimeoutMs: number;
}

const defaultInventoryTimeouts: InventoryTimeouts = {
  lockTimeoutMs: 2_000,
  statementTimeoutMs: 10_000,
};

export class PrismaOrderRepository implements OrderRepository {
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

  reserve(userId: string, vehicleId: string, quantity: number): Promise<ReservationResult> {
    return this.withInventoryTransaction(async (transaction) => {
      const [vehicle] = await transaction.vehicle.updateManyAndReturn({
        where: {
          id: vehicleId,
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

      if (!vehicle) {
        const existingVehicle = await transaction.vehicle.findUnique({
          where: { id: vehicleId },
          select: { id: true },
        });

        return existingVehicle ? { status: 'INSUFFICIENT_STOCK' } : { status: 'NOT_FOUND' };
      }

      const order = await transaction.order.create({
        data: {
          userId,
          vehicleId,
          quantity,
          unitPrice: vehicle.price,
          vehicleMake: vehicle.make,
          vehicleModel: vehicle.model,
          vehicleYear: vehicle.year,
          vehicleCategory: vehicle.category,
          vehicleImageKey: vehicle.imageKey,
          vehicleColorName: vehicle.colorName,
          vehicleColorHex: vehicle.colorHex,
          vehicleEngine: vehicle.engine,
          vehicleTransmission: vehicle.transmission,
          vehicleFuelType: vehicle.fuelType,
          vehicleDetails: vehicle.details,
        },
        select: orderSelection,
      });

      return {
        status: 'UPDATED',
        vehicle: toVehicleRecord(vehicle),
        order: toOrderRecord(order),
      };
    });
  }

  private async findPage(
    where: Prisma.OrderWhereInput,
    pagination: VehiclePagination,
  ): Promise<OrderPage> {
    const [orders, total] = await Promise.all([
      this.database.order.findMany({
        where,
        select: orderSelection,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        take: pagination.limit,
        skip: pagination.skip,
      }),
      this.database.order.count({ where }),
    ]);

    return {
      orders: orders.map(toOrderRecord),
      pagination: {
        ...pagination,
        total,
      },
    };
  }

  findForUser(userId: string, pagination: VehiclePagination): Promise<OrderPage> {
    return this.findPage({ userId }, pagination);
  }

  findAll(pagination: VehiclePagination): Promise<OrderPage> {
    return this.findPage({}, pagination);
  }

  cancel(orderId: string, userId: string): Promise<CancellationResult> {
    return this.withInventoryTransaction(async (transaction) => {
      const [cancelled] = await transaction.order.updateManyAndReturn({
        where: {
          id: orderId,
          userId,
          status: 'RESERVED',
        },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
        },
        select: {
          id: true,
          vehicleId: true,
          quantity: true,
        },
      });

      if (!cancelled) {
        const existingOrder = await transaction.order.findUnique({
          where: { id: orderId },
          select: {
            userId: true,
            status: true,
          },
        });

        if (!existingOrder || existingOrder.userId !== userId) {
          return { status: 'NOT_FOUND' };
        }

        return { status: 'ALREADY_CANCELLED' };
      }

      const vehicle = await transaction.vehicle.update({
        where: { id: cancelled.vehicleId },
        data: {
          quantity: {
            increment: cancelled.quantity,
          },
        },
        select: vehicleSelection,
      });
      const order = await transaction.order.findUnique({
        where: { id: cancelled.id },
        select: orderSelection,
      });

      if (!order) {
        throw new Error('Cancelled order could not be reloaded');
      }

      return {
        status: 'UPDATED',
        vehicle: toVehicleRecord(vehicle),
        order: toOrderRecord(order),
      };
    });
  }
}
