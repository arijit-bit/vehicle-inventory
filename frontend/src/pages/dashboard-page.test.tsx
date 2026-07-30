import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../features/auth/auth-context-value';
import { VehicleApiError, vehicleApi, type Vehicle } from '../features/vehicles/vehicle-api';
import { DashboardPage } from './dashboard-page';

vi.mock('../features/auth/auth-context-value', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../features/media-assets/media-asset-context-value', () => ({
  useMediaAsset: vi.fn((key: string) => ({
    asset: {
      key,
      bucket: 'Assets-SVG',
      objectPath: `vehicles/${key.toLowerCase()}.svg`,
      publicUrl: `https://lzgmwzmyfilgwawjqejm.supabase.co/storage/v1/object/public/Assets-SVG/vehicles/${key.toLowerCase()}.svg`,
      altText: 'Vehicle artwork',
      createdAt: '2026-07-30T00:00:00.000Z',
      updatedAt: '2026-07-30T00:00:00.000Z',
    },
    error: null,
    isLoading: false,
  })),
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
    year: 2025,
    category: 'Sedan',
    imageKey: 'WHITE_RR',
    colorName: 'Frozen Silver',
    colorHex: '#C8C9C7',
    engine: '2.5L Hybrid',
    transmission: 'AUTOMATIC',
    fuelType: 'HYBRID',
    details: 'Executive hybrid sedan.',
    price: '32999.90',
    quantity: 2,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '82e88523-f566-4bb2-b9b0-54c5ecf59db7',
    make: 'Ford',
    model: 'Mustang',
    year: 2024,
    category: 'Coupe',
    imageKey: 'BLACK_CAR',
    colorName: 'Obsidian Black',
    colorHex: '#333336',
    engine: '5.0L V8',
    transmission: 'MANUAL',
    fuelType: 'PETROL',
    details: 'Naturally aspirated performance coupe.',
    price: '58999.00',
    quantity: 0,
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  },
];
const pageResponse = (
  pageVehicles = vehicles,
  pagination = { limit: 6, skip: 0, total: pageVehicles.length },
) => ({
  vehicles: pageVehicles,
  pagination,
  brands: ['Ford', 'Toyota'],
});

const mockAuth = (role: 'CUSTOMER' | 'EMPLOYEE' | 'ADMIN') => {
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
    vi.mocked(vehicleApi.list).mockResolvedValue(pageResponse());
    vi.mocked(vehicleApi.search).mockResolvedValue(pageResponse([vehicles[0]!]));
  });

  it('lets a user purchase available stock and disables sold-out vehicles', async () => {
    const user = userEvent.setup();
    mockAuth('CUSTOMER');
    vi.mocked(vehicleApi.purchase).mockResolvedValue({
      vehicle: { ...vehicles[0]!, quantity: 1 },
      order: {
        id: 'b4d31d35-bd4c-41b2-9319-a7eaa7a9fcf7',
        status: 'RESERVED',
      },
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

  it('lets guests browse and search while requiring sign-in for purchase', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      token: null,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    const camry = await screen.findByRole('article', { name: 'Toyota Camry' });
    expect(vehicleApi.list).toHaveBeenCalledWith(null, { limit: 6, skip: 0 });
    expect(
      within(camry).getByRole('link', { name: /sign in to purchase toyota camry/i }),
    ).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Request access' })).toHaveAttribute(
      'href',
      '/register',
    );
  });

  it('gives employees create and edit access without restock or delete controls', async () => {
    const user = userEvent.setup();
    mockAuth('EMPLOYEE');

    render(<DashboardPage />);
    const camry = await screen.findByRole('article', { name: 'Toyota Camry' });
    expect(within(camry).getByText('Customer reservations only')).toBeInTheDocument();
    expect(within(camry).queryByRole('button', { name: /purchase/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Manage inventory' }));

    const management = screen.getByRole('region', { name: 'Inventory management' });
    expect(within(management).getByRole('button', { name: 'Add vehicle' })).toBeInTheDocument();
    expect(
      within(management).getByRole('button', { name: 'Edit Toyota Camry' }),
    ).toBeInTheDocument();
    expect(
      within(management).queryByRole('button', { name: 'Restock Toyota Camry' }),
    ).not.toBeInTheDocument();
    expect(
      within(management).queryByRole('button', { name: 'Delete Toyota Camry' }),
    ).not.toBeInTheDocument();
  });

  it('shows the signed-in identity and filters the catalog by availability', async () => {
    const user = userEvent.setup();
    mockAuth('CUSTOMER');

    render(<DashboardPage />);

    expect(await screen.findByText('customer@example.com')).toBeInTheDocument();
    expect(screen.getByText('Showing 1–2 of 2 vehicles')).toBeInTheDocument();

    await user.click(screen.getByRole('combobox', { name: 'Filter By Availability' }));
    await user.click(screen.getByRole('option', { name: 'Available' }));

    await waitFor(() =>
      expect(vehicleApi.search).toHaveBeenCalledWith(
        'secure-token',
        { availability: 'available' },
        { limit: 6, skip: 0 },
      ),
    );
    expect(await screen.findByRole('article', { name: 'Toyota Camry' })).toBeInTheDocument();
    expect(screen.queryByRole('article', { name: 'Ford Mustang' })).not.toBeInTheDocument();
    expect(screen.getByText('Showing 1 of 1 vehicle')).toBeInTheDocument();
  });

  it('renders the premium collection chrome and vehicle metadata', async () => {
    const user = userEvent.setup();
    mockAuth('CUSTOMER');

    render(<DashboardPage />);

    expect(await screen.findByRole('heading', { name: 'Our Collection' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^home$/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /^inventory$/i })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('combobox', { name: 'Filter By Brand' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Filter By Availability' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Sort By Price' })).toBeInTheDocument();
    expect(
      screen.queryByRole('group', { name: 'Filter inventory by availability' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Automatic')).toBeInTheDocument();
    expect(screen.getByText('Manual')).toBeInTheDocument();
    expect(screen.getByText('Frozen Silver')).toHaveClass('rounded-full', 'border');
    expect(screen.getByText('Automatic')).toHaveClass('rounded-full', 'border');
    expect(screen.getAllByLabelText(/view .* details/i)).toHaveLength(2);
    expect(screen.getByRole('img', { name: 'Toyota Camry' })).not.toHaveAttribute(
      'src',
      expect.stringContaining('Final-CarHero'),
    );

    await user.click(screen.getByRole('button', { name: 'View Toyota Camry details' }));
    expect(screen.getByText('2.5L Hybrid')).toBeInTheDocument();
    expect(screen.getByText('Hybrid')).toBeInTheDocument();
  });

  it('filters by brand and sorts the collection by price', async () => {
    const user = userEvent.setup();
    mockAuth('CUSTOMER');

    render(<DashboardPage />);
    await screen.findByRole('article', { name: 'Toyota Camry' });

    await user.click(screen.getByRole('combobox', { name: 'Filter By Brand' }));
    await user.click(screen.getByRole('option', { name: 'Toyota' }));

    await waitFor(() =>
      expect(vehicleApi.search).toHaveBeenCalledWith(
        'secure-token',
        { make: 'Toyota' },
        { limit: 6, skip: 0 },
      ),
    );
    expect(await screen.findByRole('article', { name: 'Toyota Camry' })).toBeInTheDocument();
    expect(screen.queryByRole('article', { name: 'Ford Mustang' })).not.toBeInTheDocument();

    vi.mocked(vehicleApi.search).mockResolvedValueOnce(pageResponse([vehicles[1]!, vehicles[0]!]));
    await user.click(screen.getByRole('combobox', { name: 'Filter By Brand' }));
    await user.click(screen.getByRole('option', { name: 'All brands' }));
    await user.click(screen.getByRole('combobox', { name: 'Sort By Price' }));
    await user.click(screen.getByRole('option', { name: 'Price: high to low' }));

    await waitFor(() =>
      expect(vehicleApi.search).toHaveBeenCalledWith(
        'secure-token',
        { sort: 'price-desc' },
        { limit: 6, skip: 0 },
      ),
    );
    const cards = screen.getAllByRole('article');
    expect(cards[0]).toHaveAccessibleName('Ford Mustang');
    expect(cards[1]).toHaveAccessibleName('Toyota Camry');
  });

  it('keeps inventory management hidden from non-administrators', async () => {
    mockAuth('CUSTOMER');

    render(<DashboardPage />);

    await screen.findByRole('article', { name: 'Toyota Camry' });
    expect(screen.queryByRole('button', { name: 'Manage inventory' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add vehicle/i })).not.toBeInTheDocument();
  });

  it('ends the local session when the API rejects an expired token', async () => {
    mockAuth('CUSTOMER');
    const logout = vi.fn();
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        role: 'CUSTOMER',
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
    mockAuth('CUSTOMER');

    render(<DashboardPage />);
    await screen.findByRole('article', { name: 'Toyota Camry' });

    await user.click(screen.getByRole('button', { name: 'Open search' }));
    await user.type(screen.getByLabelText('Make'), ' Toyota ');
    await user.type(screen.getByLabelText('Category'), 'Sedan');
    await user.type(screen.getByLabelText('Minimum price'), '10000');
    await user.click(screen.getByRole('button', { name: 'Search inventory' }));

    await waitFor(() =>
      expect(vehicleApi.search).toHaveBeenCalledWith(
        'secure-token',
        {
          make: 'Toyota',
          category: 'Sedan',
          minPrice: '10000',
        },
        { limit: 6, skip: 0 },
      ),
    );
  });

  it('shows six cards per page and requests the next offset', async () => {
    const user = userEvent.setup();
    mockAuth('CUSTOMER');
    const firstPage = Array.from({ length: 6 }, (_, index) => ({
      ...vehicles[0]!,
      id: `page-one-${index}`,
      model: `Page One ${index + 1}`,
    }));
    const secondPage = [{ ...vehicles[1]!, id: 'page-two-1', model: 'Page Two' }];
    vi.mocked(vehicleApi.list)
      .mockResolvedValueOnce(pageResponse(firstPage, { limit: 6, skip: 0, total: 7 }))
      .mockResolvedValueOnce(pageResponse(secondPage, { limit: 6, skip: 6, total: 7 }));

    render(<DashboardPage />);

    expect(await screen.findAllByRole('article')).toHaveLength(6);
    expect(screen.getByRole('navigation', { name: 'Collection pagination' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Go to page 2' }));

    await waitFor(() =>
      expect(vehicleApi.list).toHaveBeenLastCalledWith('secure-token', {
        limit: 6,
        skip: 6,
      }),
    );
    expect(await screen.findByRole('article', { name: 'Ford Page Two' })).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Go to previous page' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Go to next page' })).toBeDisabled();
  });

  it('explains retryable inventory contention to the buyer', async () => {
    const user = userEvent.setup();
    mockAuth('CUSTOMER');
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
    await user.type(screen.getByLabelText('Engine'), '2.0L Turbo Hybrid');
    await user.type(
      screen.getByLabelText('Vehicle details'),
      'A refined seven-seat luxury utility vehicle.',
    );
    await user.type(screen.getByLabelText('Price'), '72000');
    await user.type(screen.getByLabelText('Initial quantity'), '3');
    await user.click(screen.getByRole('button', { name: 'Create vehicle' }));

    expect(vehicleApi.create).toHaveBeenCalledWith('secure-token', {
      make: 'Volvo',
      model: 'XC90',
      year: new Date().getUTCFullYear(),
      category: 'SUV',
      imageKey: 'WHITE_RR',
      colorName: 'Frozen Silver',
      colorHex: '#C8C9C7',
      engine: '2.0L Turbo Hybrid',
      transmission: 'AUTOMATIC',
      fuelType: 'PETROL',
      details: 'A refined seven-seat luxury utility vehicle.',
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
        year: 2025,
        category: 'Sedan',
        imageKey: 'WHITE_RR',
        colorName: 'Frozen Silver',
        colorHex: '#C8C9C7',
        engine: '2.5L Hybrid',
        transmission: 'AUTOMATIC',
        fuelType: 'HYBRID',
        details: 'Executive hybrid sedan.',
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
  }, 15_000);

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
