import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App authentication routes', () => {
  it('renders the luxury landing hero at the root route', () => {
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
    expect(primaryNavigation.getByText(/^services$/i)).toHaveAttribute('aria-disabled', 'true');
    expect(primaryNavigation.getByText(/^contact$/i)).toHaveAttribute('aria-disabled', 'true');
    const heroVehicle = screen.getByRole('img', { name: /exotic performance car/i });

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
