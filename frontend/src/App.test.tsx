import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('shows the Milestone 1 project status', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /vehicle inventory/i })).toBeInTheDocument();
    expect(screen.getByText('Supabase PostgreSQL')).toBeInTheDocument();
  });
});
