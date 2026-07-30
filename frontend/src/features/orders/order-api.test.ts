import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createOrderApi } from './order-api';

const response = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

describe('order API', () => {
  const fetchMock = vi.fn<typeof fetch>();
  const api = createOrderApi('https://inventory.example/api', fetchMock);

  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('loads six role-scoped orders at the requested offset', async () => {
    fetchMock.mockResolvedValue(
      response({
        orders: [],
        pagination: { limit: 6, skip: 6, total: 7 },
      }),
    );

    await api.list('secure-token', { limit: 6, skip: 6 });

    expect(fetchMock).toHaveBeenCalledWith('https://inventory.example/api/orders?limit=6&skip=6', {
      headers: { Authorization: 'Bearer secure-token' },
      method: 'GET',
    });
  });

  it('cancels an owned order with the authenticated endpoint', async () => {
    fetchMock.mockResolvedValue(
      response({
        order: { id: 'b4d31d35-bd4c-41b2-9319-a7eaa7a9fcf7', status: 'CANCELLED' },
        vehicle: { id: '74a977a0-6e04-45ee-9252-9342367f8b34', quantity: 2 },
      }),
    );

    await api.cancel('secure-token', 'b4d31d35-bd4c-41b2-9319-a7eaa7a9fcf7');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://inventory.example/api/orders/b4d31d35-bd4c-41b2-9319-a7eaa7a9fcf7/cancel',
      {
        headers: { Authorization: 'Bearer secure-token' },
        method: 'POST',
      },
    );
  });
});
