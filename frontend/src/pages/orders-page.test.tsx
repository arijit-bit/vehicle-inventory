import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../features/auth/auth-context-value';
import { orderApi, type Order } from '../features/orders/order-api';
import { OrdersPage } from './orders-page';

vi.mock('../features/auth/auth-context-value', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../features/media-assets/media-asset-context-value', () => ({
  useMediaAsset: vi.fn((key: string) => ({
    asset: {
      key,
      publicUrl: `https://example.com/${key}.svg`,
      altText: 'Reserved vehicle',
    },
    error: null,
    isLoading: false,
  })),
}));

vi.mock('../features/orders/order-api', async (importOriginal) => {
  const original = await importOriginal<typeof import('../features/orders/order-api')>();

  return {
    ...original,
    orderApi: {
      list: vi.fn(),
      cancel: vi.fn(),
    },
  };
});

const order: Order = {
  id: 'b4d31d35-bd4c-41b2-9319-a7eaa7a9fcf7',
  customer: {
    id: 'customer-1',
    email: 'client@example.com',
  },
  vehicle: {
    id: '74a977a0-6e04-45ee-9252-9342367f8b34',
    make: 'Porsche',
    model: '911',
    year: 2025,
    category: 'Coupe',
    imageKey: 'GREEN_PORSCHE_911',
    colorName: 'Oak Green',
    colorHex: '#38533A',
    engine: '3.0L Flat-Six',
    transmission: 'AUTOMATIC',
    fuelType: 'PETROL',
    details: 'Performance coupe.',
    price: '128000.00',
  },
  quantity: 1,
  status: 'RESERVED',
  reservedAt: '2026-07-30T10:00:00.000Z',
  updatedAt: '2026-07-30T10:00:00.000Z',
  cancelledAt: null,
};

const mockAuth = (role: 'CUSTOMER' | 'EMPLOYEE' | 'ADMIN') => {
  vi.mocked(useAuth).mockReturnValue({
    user: {
      id: role === 'CUSTOMER' ? 'customer-1' : 'staff-1',
      email: `${role.toLowerCase()}@example.com`,
      role,
    },
    token: 'secure-token',
    isLoading: false,
    sessionExpired: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  });
};

describe('OrdersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(orderApi.list).mockResolvedValue({
      orders: [order],
      pagination: { limit: 6, skip: 0, total: 1 },
    });
  });

  it('lets a customer view and cancel an active reservation', async () => {
    const user = userEvent.setup();
    mockAuth('CUSTOMER');
    vi.mocked(orderApi.cancel).mockResolvedValue({
      order: {
        ...order,
        status: 'CANCELLED',
        cancelledAt: '2026-07-30T12:00:00.000Z',
      },
      vehicle: {
        id: order.vehicle.id,
        quantity: 2,
      },
    });

    render(
      <MemoryRouter>
        <OrdersPage />
      </MemoryRouter>,
    );

    const card = await screen.findByRole('article', { name: 'Porsche 911 order' });
    expect(within(card).getByText('Reserved')).toBeInTheDocument();

    await user.click(within(card).getByRole('button', { name: 'Cancel Porsche 911 order' }));

    expect(orderApi.cancel).toHaveBeenCalledWith('secure-token', order.id);
    expect(await within(card).findByText('Cancelled')).toBeInTheDocument();
    expect(within(card).queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
  });

  it.each(['EMPLOYEE', 'ADMIN'] as const)(
    'shows customer details without cancellation controls to %s users',
    async (role) => {
      mockAuth(role);

      render(
        <MemoryRouter>
          <OrdersPage />
        </MemoryRouter>,
      );

      const card = await screen.findByRole('article', { name: 'Porsche 911 order' });
      expect(within(card).getByText('client@example.com')).toBeInTheDocument();
      expect(within(card).queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
      expect(screen.getByText('1 customer')).toBeInTheDocument();
    },
  );

  it('requests the next six orders from the server', async () => {
    const user = userEvent.setup();
    mockAuth('CUSTOMER');
    vi.mocked(orderApi.list).mockResolvedValue({
      orders: [order],
      pagination: { limit: 6, skip: 0, total: 7 },
    });

    render(
      <MemoryRouter>
        <OrdersPage />
      </MemoryRouter>,
    );

    await screen.findByRole('article', { name: 'Porsche 911 order' });
    await user.click(screen.getByRole('button', { name: 'Go to next page' }));

    await waitFor(() =>
      expect(orderApi.list).toHaveBeenLastCalledWith('secure-token', {
        limit: 6,
        skip: 6,
      }),
    );
  });
});
