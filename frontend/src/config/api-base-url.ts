const normalizeBaseUrl = (url: string | undefined) => url?.replace(/\/$/, '');

/**
 * Production requests must stay on the frontend origin so the httpOnly refresh
 * cookie is first-party. Vercel forwards /api/* to the backend via vercel.json.
 *
 * Development keeps honoring VITE_API_URL so existing direct localhost setups
 * continue to work; without an override, Vite's /api proxy is used.
 */
export const resolveApiBaseUrl = (
  configuredUrl: string | undefined,
  isProduction: boolean,
): string => {
  if (isProduction) {
    return '/api';
  }

  return normalizeBaseUrl(configuredUrl) ?? '/api';
};

export const API_BASE_URL = resolveApiBaseUrl(import.meta.env.VITE_API_URL, import.meta.env.PROD);
