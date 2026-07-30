export type MediaAssetKey =
  | 'HERO_CAR'
  | 'WHITE_RR'
  | 'BLUE_BUGATTI'
  | 'GREEN_LAMBO'
  | 'BLACK_CAR'
  | 'BLACK_BENTLEY'
  | 'GREEN_PORSCHE_911'
  | 'BROWN_MAYBACH'
  | 'ORANGE_AUDI_R8'
  | 'BLACK_RANGE_ROVER';

export interface MediaAsset {
  key: MediaAssetKey;
  bucket: string;
  objectPath: string;
  publicUrl: string;
  altText: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
  };
}

export class MediaAssetApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'MediaAssetApiError';
  }
}

export const createMediaAssetApi = (baseUrl: string, fetcher: typeof fetch = fetch) => ({
  list: async () => {
    const response = await fetcher(`${baseUrl}/assets`, {
      method: 'GET',
    });
    const body = (await response.json().catch(() => undefined)) as
      | ({ assets: MediaAsset[] } & ApiErrorBody)
      | undefined;

    if (!response.ok) {
      throw new MediaAssetApiError(
        body?.error?.message ?? 'Unable to load the media asset catalog',
        body?.error?.code ?? 'ASSET_CATALOG_UNAVAILABLE',
        response.status,
      );
    }

    return body as { assets: MediaAsset[] };
  },
});

export const mediaAssetApi = createMediaAssetApi(
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3000/api',
);
