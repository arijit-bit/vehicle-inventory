import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../app.js';
import type { MediaAssetRecord } from './media-asset.types.js';

const assets: MediaAssetRecord[] = [
  {
    key: 'HERO_CAR',
    bucket: 'Assets-SVG',
    objectPath: 'site/final-car-hero.svg',
    publicUrl:
      'https://lzgmwzmyfilgwawjqejm.supabase.co/storage/v1/object/public/Assets-SVG/site/final-car-hero.svg',
    altText: 'Silver exotic performance car',
    createdAt: new Date('2026-07-30T00:00:00.000Z'),
    updatedAt: new Date('2026-07-30T00:00:00.000Z'),
  },
];

describe('media asset HTTP API', () => {
  const mediaAssetService = {
    list: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mediaAssetService.list.mockResolvedValue(assets);
  });

  it('publishes the database-backed asset catalog without authentication', async () => {
    const response = await request(createApp({ mediaAssetService })).get('/api/assets');

    expect(response.status).toBe(200);
    expect(mediaAssetService.list).toHaveBeenCalledOnce();
    expect(response.body).toEqual({
      assets: [
        {
          ...assets[0],
          createdAt: '2026-07-30T00:00:00.000Z',
          updatedAt: '2026-07-30T00:00:00.000Z',
        },
      ],
    });
  });
});
