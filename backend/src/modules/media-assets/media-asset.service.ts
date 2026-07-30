import type { MediaAssetRecord, MediaAssetRepository } from './media-asset.types.js';

export class MediaAssetService {
  constructor(private readonly assets: MediaAssetRepository) {}

  list(): Promise<MediaAssetRecord[]> {
    return this.assets.findAll();
  }
}
