import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VehicleApiError, createVehicleApi } from './vehicle-api';

const response = (body: unknown, init?: ResponseInit) =>
  new Response(body === undefined ? undefined : JSON.stringify(body), {
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    ...init,
  });

describe('vehicle API', () => {
  const fetchMock = vi.fn<typeof fetch>();
  const api = createVehicleApi('https://inventory.example/api', fetchMock);

  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('authenticates list requests', async () => {
    fetchMock.mockResolvedValue(response({ vehicles: [] }));

    await api.list('secure-token');

    expect(fetchMock).toHaveBeenCalledWith('https://inventory.example/api/vehicles', {
      headers: { Authorization: 'Bearer secure-token' },
      method: 'GET',
    });
  });

  it('allows guest list requests without an authorization header', async () => {
    fetchMock.mockResolvedValue(response({ vehicles: [] }));

    await api.list();

    expect(fetchMock).toHaveBeenCalledWith('https://inventory.example/api/vehicles', {
      headers: {},
      method: 'GET',
    });
  });

  it('encodes combined search filters', async () => {
    fetchMock.mockResolvedValue(response({ vehicles: [] }));

    await api.search('secure-token', {
      make: ' Land Rover ',
      category: 'SUV',
      minPrice: '10000',
      maxPrice: '90000',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://inventory.example/api/vehicles/search?make=Land+Rover&category=SUV&minPrice=10000&maxPrice=90000',
      {
        headers: { Authorization: 'Bearer secure-token' },
        method: 'GET',
      },
    );
  });

  it('posts an atomic purchase quantity', async () => {
    fetchMock.mockResolvedValue(
      response({
        vehicle: {
          id: 'vehicle-1',
          make: 'Toyota',
          model: 'Camry',
          category: 'Sedan',
          price: '32000.00',
          quantity: 1,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      }),
    );

    await api.purchase('secure-token', 'vehicle-1', 2);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://inventory.example/api/vehicles/vehicle-1/purchase',
      {
        body: JSON.stringify({ quantity: 2 }),
        headers: {
          Authorization: 'Bearer secure-token',
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
    );
  });

  it('accepts an empty successful delete response', async () => {
    fetchMock.mockResolvedValue(response(undefined, { status: 204 }));

    await expect(api.delete('secure-token', 'vehicle-1')).resolves.toBeUndefined();
  });

  it('preserves retryable API error details', async () => {
    fetchMock.mockResolvedValue(
      response(
        {
          error: {
            code: 'INVENTORY_BUSY',
            message: 'Inventory is busy; retry the request',
          },
        },
        { status: 503 },
      ),
    );

    await expect(api.restock('secure-token', 'vehicle-1', 4)).rejects.toEqual(
      new VehicleApiError('Inventory is busy; retry the request', 'INVENTORY_BUSY', 503),
    );
  });
});
