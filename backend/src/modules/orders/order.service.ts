import type { VehiclePagination } from '../vehicles/vehicle.schemas.js';
import {
  OrderAlreadyCancelledError,
  OrderNotFoundError,
  type OrderActor,
  type OrderPage,
  type OrderRecord,
  type OrderRepository,
} from './order.types.js';
import type { VehicleRecord } from '../vehicles/vehicle.types.js';

export class OrderService {
  constructor(private readonly orders: OrderRepository) {}

  list(actor: OrderActor, pagination: VehiclePagination): Promise<OrderPage> {
    return actor.role === 'CUSTOMER'
      ? this.orders.findForUser(actor.sub, pagination)
      : this.orders.findAll(pagination);
  }

  async cancel(
    orderId: string,
    userId: string,
  ): Promise<{ order: OrderRecord; vehicle: VehicleRecord }> {
    const result = await this.orders.cancel(orderId, userId);

    if (result.status === 'NOT_FOUND') {
      throw new OrderNotFoundError();
    }

    if (result.status === 'ALREADY_CANCELLED') {
      throw new OrderAlreadyCancelledError();
    }

    return {
      order: result.order,
      vehicle: result.vehicle,
    };
  }
}
