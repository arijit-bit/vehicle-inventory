import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthClaims } from '../auth/auth.types.js';
import { OrderService } from './order.service.js';
import {
  OrderAlreadyCancelledError,
  OrderNotFoundError,
  type OrderPage,
  type OrderRepository,
} from './order.types.js';

const customer: AuthClaims = {
  sub: 'f9117522-a624-4e2e-a489-3b2ec2840292',
  email: 'driver@example.com',
  role: 'CUSTOMER',
};
const orderPage: OrderPage = {
  orders: [],
  pagination: { limit: 6, skip: 0, total: 0 },
};

describe('OrderService', () => {
  const repository: OrderRepository = {
    reserve: vi.fn(),
    findForUser: vi.fn(),
    findAll: vi.fn(),
    cancel: vi.fn(),
  };
  const service = new OrderService(repository);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(repository.findForUser).mockResolvedValue(orderPage);
    vi.mocked(repository.findAll).mockResolvedValue(orderPage);
    vi.mocked(repository.cancel).mockResolvedValue({
      status: 'UPDATED',
      order: {} as never,
      vehicle: {} as never,
    });
  });

  it('shows customers only their own paginated order history', async () => {
    const pagination = { limit: 6, skip: 6 };

    await expect(service.list(customer, pagination)).resolves.toEqual(orderPage);
    expect(repository.findForUser).toHaveBeenCalledWith(customer.sub, pagination);
    expect(repository.findAll).not.toHaveBeenCalled();
  });

  it.each(['EMPLOYEE', 'ADMIN'] as const)('shows %s users all customer orders', async (role) => {
    const actor = { ...customer, role };

    await expect(service.list(actor, { limit: 6, skip: 0 })).resolves.toEqual(orderPage);
    expect(repository.findAll).toHaveBeenCalledWith({ limit: 6, skip: 0 });
    expect(repository.findForUser).not.toHaveBeenCalled();
  });

  it('cancels only an order owned by the acting customer', async () => {
    await service.cancel('2e18dc0f-9dcf-4d1e-a915-a6c73cd29a30', customer.sub);

    expect(repository.cancel).toHaveBeenCalledWith(
      '2e18dc0f-9dcf-4d1e-a915-a6c73cd29a30',
      customer.sub,
    );
  });

  it('reports missing and already-cancelled orders without changing stock again', async () => {
    vi.mocked(repository.cancel).mockResolvedValueOnce({ status: 'NOT_FOUND' });

    await expect(
      service.cancel('2e18dc0f-9dcf-4d1e-a915-a6c73cd29a30', customer.sub),
    ).rejects.toBeInstanceOf(OrderNotFoundError);

    vi.mocked(repository.cancel).mockResolvedValueOnce({ status: 'ALREADY_CANCELLED' });

    await expect(
      service.cancel('2e18dc0f-9dcf-4d1e-a915-a6c73cd29a30', customer.sub),
    ).rejects.toBeInstanceOf(OrderAlreadyCancelledError);
  });
});
