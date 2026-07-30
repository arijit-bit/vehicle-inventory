export interface MediaAssetRecord {
  key: string;
  bucket: string;
  objectPath: string;
  publicUrl: string;
  altText: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaAssetRepository {
  findAll(): Promise<MediaAssetRecord[]>;
}
