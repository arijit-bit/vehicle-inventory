import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { Vehicle, VehicleImageKey } from './vehicle-api';
import { VehicleCard } from './vehicle-card';

const vehicle: Vehicle = {
  id: '6f4648a9-1e9e-4e34-a875-72be9bc39a01',
  make: 'MotoVault',
  model: 'Artwork Test',
  year: 2024,
  category: 'Supercar',
  imageKey: 'WHITE_RR',
  colorName: 'Frozen Silver',
  colorHex: '#C8C9C7',
  engine: 'Test Engine',
  transmission: 'AUTOMATIC',
  fuelType: 'PETROL',
  details: 'Artwork mapping regression fixture.',
  price: '100000.00',
  quantity: 1,
  createdAt: '2026-07-30T00:00:00.000Z',
  updatedAt: '2026-07-30T00:00:00.000Z',
};

describe('VehicleCard artwork', () => {
  it.each([
    ['WHITE_RR', 'White-RR-centered.svg'],
    ['BLUE_BUGATTI', 'blue-bugatti-centered(1).svg'],
    ['BLACK_CAR', 'Middle-black-car-centered.svg'],
  ] as const)('maps %s to its centered collection SVG', (imageKey, filename) => {
    render(
      <MemoryRouter>
        <VehicleCard
          isBuying={false}
          onPurchase={vi.fn()}
          token={null}
          vehicle={{ ...vehicle, id: imageKey, imageKey: imageKey as VehicleImageKey }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('img', { name: 'MotoVault Artwork Test' })).toHaveAttribute(
      'src',
      expect.stringContaining(filename),
    );
  });
});
