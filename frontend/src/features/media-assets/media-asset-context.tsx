import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { mediaAssetApi, type MediaAsset } from './media-asset-api';
import { MediaAssetContext, type MediaAssetContextValue } from './media-asset-context-value';

type MediaAssetApi = Pick<typeof mediaAssetApi, 'list'>;

interface MediaAssetProviderProps {
  api?: MediaAssetApi;
  children: ReactNode;
}

export const MediaAssetProvider = ({ api = mediaAssetApi, children }: MediaAssetProviderProps) => {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    api
      .list()
      .then(({ assets: catalog }) => {
        if (active) {
          setAssets(catalog);
          setError(null);
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(loadError instanceof Error ? loadError : new Error('Unable to load assets'));
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [api]);

  const value = useMemo<MediaAssetContextValue>(
    () => ({
      assets: new Map(assets.map((asset) => [asset.key, asset])),
      error,
      isLoading,
    }),
    [assets, error, isLoading],
  );

  return <MediaAssetContext.Provider value={value}>{children}</MediaAssetContext.Provider>;
};
