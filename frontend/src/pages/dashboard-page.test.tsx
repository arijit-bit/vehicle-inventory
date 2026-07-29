import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../features/auth/auth-context-value';
import { VehicleApiError, vehicleApi, type Vehicle } from '../features/vehicles/vehicle-api';
import { DashboardPage } from './dashboard-page';

vi.mock('../features/auth/auth-context-value', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../features/vehicles/vehicle-api', async (importOriginal) => {
  const original = await importOriginal<typeof import('../features/vehicles/vehicle-api')>();

  return {
    ...original,
    vehicleApi: {
      list: vi.fn(),
      search: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      purchase: vi.fn(),
      restock: vi.fn(),
    },
  };
});

const vehicles: Vehicle[] = [
  {
    id: 'a104ce48-e57f-4fb0-8793-57c8b9a2c913',
    make: 'Toyota',
    model: 'Camry',
    category: 'Sedan',
    price: '32999.90',
    quantity: 2,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '82e88523-f566-4bb2-b9b0-54c5ecf59db7',
    make: 'Ford',
    model: 'Mustang',
    category: 'Coupe',
    price: '58999.00',
    quantity: 0,
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  },
];

const mockAuth = (role: 'USER' | 'ADMIN') => {
  vi.mocked(useAuth).mockReturnValue({
    user: {
      id: 'user-1',
      email: `${role.toLowerCase()}@example.com`,
      role,
    },
    token: 'secure-token',
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  });
};

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(vehicleApi.list).mockResolvedValue({ vehicles });
    vi.mocked(vehicleApi.search).mockResolvedValue({ vehicles: [vehicles[0]!] });
  });

  it('lets a user purchase available stock and disables sold-out vehicles', async () => {
    const user = userEvent.setup();
    mockAuth('USER');
    vi.mocked(vehicleApi.purchase).mockResolvedValue({
      vehicle: { ...vehicles[0]!, quantity: 1 },
    });

    render(<DashboardPage />);

    const camry = await screen.findByRole('article', { name: 'Toyota Camry' });
    const mustang = screen.getByRole('article', { name: 'Ford Mustang' });
    expect(within(mustang).getByRole('button', { name: 'Out of stock' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: /add vehicle/i })).not.toBeInTheDocument();

    await user.click(within(camry).getByRole('button', { name: 'Purchase Toyota Camry' }));

    expect(vehicleApi.purchase).toHaveBeenCalledWith(
      'secure-token',
      'a104ce48-e57f-4fb0-8793-57c8b9a2c913',
      1,
    );
    expect(within(camry).getByText('1 in stock')).toBeInTheDocument();
  });

  it('shows the signed-in identity and filters the catalog by availability', async () => {
    const user = userEvent.setup();
    mockAuth('USER');

    render(<DashboardPage />);

    expect(await screen.findByText('user@example.com')).toBeInTheDocument();
    expect(screen.getByText('2 vehicles')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Available' }));

    expect(screen.getByRole('article', { name: 'Toyota Camry' })).toBeInTheDocument();
    expect(screen.queryByRole('article', { name: 'Ford Mustang' })).not.toBeInTheDocument();
    expect(screen.getByText('1 vehicle')).toBeInTheDocument();
  });

  it('keeps inventory management hidden from non-administrators', async () => {
    mockAuth('USER');

    render(<DashboardPage />);

    await screen.findByRole('article', { name: 'Toyota Camry' });
    expect(screen.queryByRole('button', { name: 'Manage inventory' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add vehicle/i })).not.toBeInTheDocument();
  });

  it('ends the local session when the API rejects an expired token', async () => {
    mockAuth('USER');
    const logout = vi.fn();
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        role: 'USER',
      },
      token: 'expired-token',
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout,
    });
    vi.mocked(vehicleApi.list).mockRejectedValue(
      new VehicleApiError('Authentication is required', 'UNAUTHENTICATED', 401),
    );

    render(<DashboardPage />);

    await waitFor(() => expect(logout).toHaveBeenCalledOnce());
  });

  it('searches by combined inventory filters', async () => {
    const user = userEvent.setup();
    mockAuth('USER');

    render(<DashboardPage />);
    await screen.findByRole('article', { name: 'Toyota Camry' });

    await user.type(screen.getByLabelText('Make'), ' Toyota ');
    await user.type(screen.getByLabelText('Category'), 'Sedan');
    await user.type(screen.getByLabelText('Minimum price'), '10000');
    await user.click(screen.getByRole('button', { name: 'Search inventory' }));

    expect(vehicleApi.search).toHaveBeenCalledWith('secure-token', {
      make: 'Toyota',
      category: 'Sedan',
      minPrice: '10000',
    });
  });

  it('explains retryable inventory contention to the buyer', async () => {
    const user = userEvent.setup();
    mockAuth('USER');
    vi.mocked(vehicleApi.purchase).mockRejectedValue(
      new VehicleApiError('Inventory is busy; retry the request', 'INVENTORY_BUSY', 503),
    );

    render(<DashboardPage />);
    const camry = await screen.findByRole('article', { name: 'Toyota Camry' });
    await user.click(within(camry).getByRole('button', { name: 'Purchase Toyota Camry' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Inventory is processing another update. Wait a moment, then retry.',
    );
  });

  it('gives administrators create, edit, restock, and delete workflows', async () => {
    const user = userEvent.setup();
    mockAuth('ADMIN');
    const created = {
      ...vehicles[0]!,
      id: 'b21ef75f-a0b0-449e-ac19-16d3fa46a548',
      make: 'Volvo',
      model: 'XC90',
      category: 'SUV',
      price: '72000.00',
      quantity: 3,
    };
    vi.mocked(vehicleApi.create).mockResolvedValue({ vehicle: created });
    vi.mocked(vehicleApi.update).mockResolvedValue({
      vehicle: { ...vehicles[0]!, price: '31999.00' },
    });
    vi.mocked(vehicleApi.restock).mockResolvedValue({
      vehicle: { ...vehicles[0]!, quantity: 7 },
    });
    vi.mocked(vehicleApi.delete).mockResolvedValue();

    render(<DashboardPage />);
    await screen.findByRole('article', { name: 'Toyota Camry' });
    await user.click(screen.getByRole('button', { name: 'Manage inventory' }));

    const management = screen.getByRole('region', { name: 'Inventory management' });
    expect(within(management).getByText('2 inventory records')).toBeInTheDocument();
    expect(
      within(management).getByRole('table', { name: 'Vehicle management' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add vehicle' }));
    await user.type(screen.getByLabelText('Make'), 'Volvo');
    await user.type(screen.getByLabelText('Model'), 'XC90');
    await user.type(screen.getByLabelText('Category'), 'SUV');
    await user.type(screen.getByLabelText('Price'), '72000');
    await user.type(screen.getByLabelText('Initial quantity'), '3');
    await user.click(screen.getByRole('button', { name: 'Create vehicle' }));

    expect(vehicleApi.create).toHaveBeenCalledWith('secure-token', {
      make: 'Volvo',
      model: 'XC90',
      category: 'SUV',
      price: 72000,
      quantity: 3,
    });
    expect(await within(management).findByRole('row', { name: /Volvo XC90/ })).toBeInTheDocument();

    await user.click(within(management).getByRole('button', { name: 'Edit Toyota Camry' }));
    await user.clear(screen.getByLabelText('Price'));
    await user.type(screen.getByLabelText('Price'), '31999');
    expect(screen.queryByLabelText('Initial quantity')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(vehicleApi.update).toHaveBeenCalledWith(
      'secure-token',
      'a104ce48-e57f-4fb0-8793-57c8b9a2c913',
      {
        make: 'Toyota',
        model: 'Camry',
        category: 'Sedan',
        price: 31999,
      },
    );

    await user.click(within(management).getByRole('button', { name: 'Restock Toyota Camry' }));
    await user.clear(screen.getByLabelText('Restock quantity'));
    await user.type(screen.getByLabelText('Restock quantity'), '5');
    await user.click(screen.getByRole('button', { name: 'Confirm restock' }));
    expect(vehicleApi.restock).toHaveBeenCalledWith(
      'secure-token',
      'a104ce48-e57f-4fb0-8793-57c8b9a2c913',
      5,
    );

    await user.click(within(management).getByRole('button', { name: 'Delete Ford Mustang' }));
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'This permanently removes Ford Mustang from the catalog',
    );
    await user.click(screen.getByRole('button', { name: 'Confirm delete' }));
    expect(vehicleApi.delete).toHaveBeenCalledWith(
      'secure-token',
      '82e88523-f566-4bb2-b9b0-54c5ecf59db7',
    );
    expect(within(management).queryByRole('row', { name: /Ford Mustang/ })).not.toBeInTheDocument();
  });

  it('dismisses administrator forms with Escape', async () => {
    const user = userEvent.setup();
    mockAuth('ADMIN');

    render(<DashboardPage />);
    await screen.findByRole('article', { name: 'Toyota Camry' });
    await user.click(screen.getByRole('button', { name: 'Manage inventory' }));
    await user.click(screen.getByRole('button', { name: 'Add vehicle' }));

    expect(screen.getByRole('dialog', { name: 'Add vehicle' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Add vehicle' })).not.toBeInTheDocument();
  });
});
