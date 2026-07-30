import { createContext, useContext } from 'react';
import type { MediaAsset, MediaAssetKey } from './media-asset-api';

export interface MediaAssetContextValue {
  assets: ReadonlyMap<MediaAssetKey, MediaAsset>;
  error: Error | null;
  isLoading: boolean;
}

export const MediaAssetContext = createContext<MediaAssetContextValue | null>(null);

export const useMediaAsset = (key: MediaAssetKey) => {
  const context = useContext(MediaAssetContext);

  if (!context) {
    throw new Error('useMediaAsset must be used within MediaAssetProvider');
  }

  return {
    asset: context.assets.get(key),
    error: context.error,
    isLoading: context.isLoading,
  };
};
