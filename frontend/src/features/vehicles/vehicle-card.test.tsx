import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { MediaAssetProvider } from '../media-assets/media-asset-context';
import type { MediaAssetKey } from '../media-assets/media-asset-api';
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
    ['WHITE_RR', 'vehicles/white-rr-centered.svg'],
    ['BLUE_BUGATTI', 'vehicles/blue-bugatti-centered.svg'],
    ['BLACK_CAR', 'vehicles/middle-black-car-centered.svg'],
    ['BLACK_BENTLEY', 'vehicles/bentley-continental-gt-speed-black.svg.svg'],
    ['GREEN_PORSCHE_911', 'vehicles/porsche-911-turbo-s-2024-bright-green.svg.svg'],
    ['BROWN_MAYBACH', 'vehicles/mercedes-maybach-s680-2024-brown.svg.svg'],
    ['ORANGE_AUDI_R8', 'vehicles/audi-r8-v10-performance-2024-orange.svg.svg'],
    ['BLACK_RANGE_ROVER', 'vehicles/range-rover-sv-autobiography-2024-black.svg.svg'],
  ] as const)('maps %s to its Supabase Storage object', async (imageKey, objectPath) => {
    const publicUrl = `https://lzgmwzmyfilgwawjqejm.supabase.co/storage/v1/object/public/Assets-SVG/${objectPath}`;
    const api = {
      list: vi.fn().mockResolvedValue({
        assets: [
          {
            key: imageKey as MediaAssetKey,
            bucket: 'Assets-SVG',
            objectPath,
            publicUrl,
            altText: 'Vehicle artwork',
            createdAt: '2026-07-30T00:00:00.000Z',
            updatedAt: '2026-07-30T00:00:00.000Z',
          },
        ],
      }),
    };

    render(
      <MemoryRouter>
        <MediaAssetProvider api={api}>
          <VehicleCard
            canPurchase={false}
            isBuying={false}
            onPurchase={vi.fn()}
            token={null}
            vehicle={{ ...vehicle, id: imageKey, imageKey: imageKey as VehicleImageKey }}
          />
        </MediaAssetProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('img', { name: 'MotoVault Artwork Test' })).toHaveAttribute(
      'src',
      publicUrl,
    );
  });
});
