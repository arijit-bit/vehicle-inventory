import type { DatabaseClient } from '../../infrastructure/database/prisma.js';
import type { MediaAssetRecord, MediaAssetRepository } from './media-asset.types.js';

export class PrismaMediaAssetRepository implements MediaAssetRepository {
  constructor(private readonly database: DatabaseClient) {}

  findAll(): Promise<MediaAssetRecord[]> {
    return this.database.mediaAsset.findMany({
      orderBy: {
        key: 'asc',
      },
    });
  }
}
