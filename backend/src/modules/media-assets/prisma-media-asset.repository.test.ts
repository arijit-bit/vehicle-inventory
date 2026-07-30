import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DatabaseClient } from '../../infrastructure/database/prisma.js';
import { PrismaMediaAssetRepository } from './prisma-media-asset.repository.js';

describe('PrismaMediaAssetRepository', () => {
  const database = {
    mediaAsset: {
      findMany: vi.fn(),
    },
  };
  const repository = new PrismaMediaAssetRepository(database as unknown as DatabaseClient);

  beforeEach(() => {
    vi.clearAllMocks();
    database.mediaAsset.findMany.mockResolvedValue([]);
  });

  it('returns assets in stable semantic-key order', async () => {
    await expect(repository.findAll()).resolves.toEqual([]);

    expect(database.mediaAsset.findMany).toHaveBeenCalledWith({
      orderBy: {
        key: 'asc',
      },
    });
  });
});
