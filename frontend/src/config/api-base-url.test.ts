import { describe, expect, it } from 'vitest';
import { resolveApiBaseUrl } from './api-base-url';

describe('API base URL resolution', () => {
  it('always uses the same-origin proxy in production', () => {
    expect(resolveApiBaseUrl('https://vehicle-inventory-backend.vercel.app/api/', true)).toBe(
      '/api',
    );
  });

  it('keeps a configured development backend URL', () => {
    expect(resolveApiBaseUrl('http://localhost:3000/api/', false)).toBe(
      'http://localhost:3000/api',
    );
  });

  it('uses the Vite development proxy when no URL is configured', () => {
    expect(resolveApiBaseUrl(undefined, false)).toBe('/api');
  });
});
