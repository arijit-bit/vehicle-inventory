import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../app.js';
import type { TokenVerifier } from '../auth/auth.types.js';
import { OrderAlreadyCancelledError, OrderNotFoundError } from './order.types.js';

const customerId = 'f9117522-a624-4e2e-a489-3b2ec2840292';
const orderId = '2e18dc0f-9dcf-4d1e-a915-a6c73cd29a30';
const orderPage = {
  orders: [],
  pagination: { limit: 6, skip: 0, total: 0 },
};

describe('order HTTP API', () => {
  const orderService = {
    list: vi.fn(),
    cancel: vi.fn(),
  };
  const tokenVerifier: TokenVerifier = {
    verify: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    orderService.list.mockResolvedValue(orderPage);
    orderService.cancel.mockResolvedValue({
      order: { id: orderId, status: 'CANCELLED' },
      vehicle: { id: 'a104ce48-e57f-4fb0-8793-57c8b9a2c913', quantity: 4 },
    });
    vi.mocked(tokenVerifier.verify).mockReturnValue({
      sub: customerId,
      email: 'driver@example.com',
      role: 'CUSTOMER',
    });
  });

  const app = () => createApp({ tokenVerifier, orderService });
  const authorized = () => ({ Authorization: 'Bearer signed.jwt.token' });

  it('requires authentication to read orders', async () => {
    const response = await request(app()).get('/api/orders');

    expect(response.status).toBe(401);
    expect(orderService.list).not.toHaveBeenCalled();
  });

  it('lists the acting user order scope and requested page', async () => {
    const response = await request(app())
      .get('/api/orders')
      .query({ limit: 6, skip: 6 })
      .set(authorized());

    expect(response.status).toBe(200);
    expect(orderService.list).toHaveBeenCalledWith(
      {
        sub: customerId,
        email: 'driver@example.com',
        role: 'CUSTOMER',
      },
      { limit: 6, skip: 6 },
    );
    expect(response.body).toEqual(orderPage);
  });

  it('allows a customer to cancel their own order', async () => {
    const response = await request(app())
      .post(`/api/orders/${orderId}/cancel`)
      .set(authorized());

    expect(response.status).toBe(200);
    expect(orderService.cancel).toHaveBeenCalledWith(orderId, customerId);
    expect(response.body.order.status).toBe('CANCELLED');
    expect(response.body.vehicle.quantity).toBe(4);
  });

  it.each(['EMPLOYEE', 'ADMIN'] as const)('does not allow %s users to cancel orders', async (role) => {
    vi.mocked(tokenVerifier.verify).mockReturnValue({
      sub: customerId,
      email: `${role.toLowerCase()}@example.com`,
      role,
    });

    const response = await request(app())
      .post(`/api/orders/${orderId}/cancel`)
      .set(authorized());

    expect(response.status).toBe(403);
    expect(orderService.cancel).not.toHaveBeenCalled();
  });

  it('maps missing and repeated cancellation attempts to stable errors', async () => {
    orderService.cancel.mockRejectedValueOnce(new OrderNotFoundError());
    const missing = await request(app())
      .post(`/api/orders/${orderId}/cancel`)
      .set(authorized());

    orderService.cancel.mockRejectedValueOnce(new OrderAlreadyCancelledError());
    const repeated = await request(app())
      .post(`/api/orders/${orderId}/cancel`)
      .set(authorized());

    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('ORDER_NOT_FOUND');
    expect(repeated.status).toBe(409);
    expect(repeated.body.error.code).toBe('ORDER_ALREADY_CANCELLED');
  });
});
