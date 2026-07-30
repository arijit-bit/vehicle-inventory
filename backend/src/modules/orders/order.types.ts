import type { AuthClaims } from '../auth/auth.types.js';
import type {
  FuelType,
  Transmission,
  VehicleImageKey,
  VehiclePagination,
} from '../vehicles/vehicle.schemas.js';
import type { VehicleRecord } from '../vehicles/vehicle.types.js';

export type OrderStatus = 'RESERVED' | 'CANCELLED';

export interface OrderRecord {
  id: string;
  customer: {
    id: string;
    email: string;
  };
  vehicle: {
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
    price: string;
  };
  quantity: number;
  status: OrderStatus;
  reservedAt: Date;
  updatedAt: Date;
  cancelledAt: Date | null;
}

export interface OrderPage {
  orders: OrderRecord[];
  pagination: VehiclePagination & {
    total: number;
  };
}

export type ReservationResult =
  | {
      status: 'UPDATED';
      vehicle: VehicleRecord;
      order: OrderRecord;
    }
  | {
      status: 'NOT_FOUND';
    }
  | {
      status: 'INSUFFICIENT_STOCK';
    };

export type CancellationResult =
  | {
      status: 'UPDATED';
      vehicle: VehicleRecord;
      order: OrderRecord;
    }
  | {
      status: 'NOT_FOUND';
    }
  | {
      status: 'ALREADY_CANCELLED';
    };

export interface OrderRepository {
  reserve(userId: string, vehicleId: string, quantity: number): Promise<ReservationResult>;
  findForUser(userId: string, pagination: VehiclePagination): Promise<OrderPage>;
  findAll(pagination: VehiclePagination): Promise<OrderPage>;
  cancel(orderId: string, userId: string): Promise<CancellationResult>;
}

export type OrderActor = AuthClaims;

export class OrderNotFoundError extends Error {
  constructor() {
    super('Order not found');
    this.name = 'OrderNotFoundError';
  }
}

export class OrderAlreadyCancelledError extends Error {
  constructor() {
    super('Order has already been cancelled');
    this.name = 'OrderAlreadyCancelledError';
  }
}
