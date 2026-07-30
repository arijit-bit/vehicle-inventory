import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { App } from './App';

vi.mock('./features/media-assets/media-asset-api', async () => {
  const actual = await vi.importActual<typeof import('./features/media-assets/media-asset-api')>(
    './features/media-assets/media-asset-api',
  );

  return {
    ...actual,
    mediaAssetApi: {
      list: vi.fn().mockResolvedValue({
        assets: [
          {
            key: 'HERO_CAR',
            bucket: 'Assets-SVG',
            objectPath: 'site/final-car-hero.svg',
            publicUrl:
              'https://lzgmwzmyfilgwawjqejm.supabase.co/storage/v1/object/public/Assets-SVG/site/final-car-hero.svg',
            altText: 'Silver exotic performance car',
            createdAt: '2026-07-30T00:00:00.000Z',
            updatedAt: '2026-07-30T00:00:00.000Z',
          },
        ],
      }),
    },
  };
});

describe('App authentication routes', () => {
  it('renders the luxury landing hero at the root route from the bundled SVG', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /engineered perfection/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /explore the collection/i })).toHaveAttribute(
      'href',
      '/dashboard',
    );
    const primaryNavigation = within(screen.getByRole('navigation', { name: /primary/i }));

    expect(primaryNavigation.getByRole('link', { name: /^home$/i })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(primaryNavigation.getByRole('link', { name: /^inventory$/i })).toHaveAttribute(
      'href',
      '/dashboard',
    );
    expect(primaryNavigation.getByText(/^about$/i)).toHaveAttribute('aria-disabled', 'true');
    expect(primaryNavigation.getByRole('link', { name: /^orders$/i })).toHaveAttribute(
      'href',
      '/orders',
    );
    expect(primaryNavigation.queryByText(/^services$/i)).not.toBeInTheDocument();
    expect(primaryNavigation.getByText(/^contact$/i)).toHaveAttribute('aria-disabled', 'true');
    const heroVehicle = await screen.findByRole('img', { name: /exotic performance car/i });

    expect(heroVehicle).toHaveAttribute('src', expect.stringContaining('Final-CarHero'));
    expect(heroVehicle).toHaveClass('lg:left-[43%]', 'lg:bottom-[15%]');
  });

  it('renders the login experience at /login', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create account/i })).toHaveAttribute(
      'href',
      '/register',
    );
    expect(screen.queryByRole('button', { name: /continue with google/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /continue with apple/i })).not.toBeInTheDocument();
    expect(screen.getByTestId('auth-vehicle-art')).toHaveClass('max-w-7xl', 'bottom-[-4%]');
    expect(screen.getByTestId('auth-vehicle-art').querySelector('img')).toHaveAttribute(
      'src',
      expect.stringContaining('Final-CarHero'),
    );
    expect(
      within(screen.getByRole('navigation', { name: /primary/i })).getByRole('link', {
        name: /^home$/i,
      }),
    ).toHaveAttribute('href', '/');
  });

  it('renders the registration experience at /register', () => {
    render(
      <MemoryRouter initialEntries={['/register']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /account type/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /continue with google/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /continue with apple/i })).not.toBeInTheDocument();
  });
});
