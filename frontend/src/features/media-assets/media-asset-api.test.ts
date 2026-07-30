import { describe, expect, it, vi } from 'vitest';
import { createMediaAssetApi, MediaAssetApiError } from './media-asset-api';

describe('media asset API', () => {
  it('loads the public database-backed asset catalog', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        assets: [
          {
            key: 'HERO_CAR',
            bucket: 'Assets-SVG',
            objectPath: 'site/final-car-hero.svg',
            publicUrl: 'https://example.supabase.co/hero.svg',
            altText: 'Silver exotic performance car',
            createdAt: '2026-07-30T00:00:00.000Z',
            updatedAt: '2026-07-30T00:00:00.000Z',
          },
        ],
      }),
    });
    const api = createMediaAssetApi('https://api.example.test/api', fetcher);

    await expect(api.list()).resolves.toMatchObject({
      assets: [{ key: 'HERO_CAR', publicUrl: 'https://example.supabase.co/hero.svg' }],
    });
    expect(fetcher).toHaveBeenCalledWith('https://api.example.test/api/assets', {
      method: 'GET',
    });
  });

  it('returns a typed error when the catalog cannot be loaded', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: vi.fn().mockResolvedValue({
        error: {
          code: 'ASSET_CATALOG_UNAVAILABLE',
          message: 'Asset catalog unavailable',
        },
      }),
    });
    const api = createMediaAssetApi('https://api.example.test/api', fetcher);

    await expect(api.list()).rejects.toEqual(
      new MediaAssetApiError('Asset catalog unavailable', 'ASSET_CATALOG_UNAVAILABLE', 503),
    );
  });
});
