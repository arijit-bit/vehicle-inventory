import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AuthForm } from './auth-form';

describe('AuthForm', () => {
  it('converts email input to lowercase while the user types', async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="login" onSubmit={vi.fn()} />);

    const email = screen.getByLabelText(/email address/i);
    await user.type(email, 'DRIVER@EXAMPLE.COM');

    expect(email).toHaveValue('driver@example.com');
  });

  it('rejects an email without @ and a qualified dotted domain', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<AuthForm mode="login" onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/email address/i), 'driver@example');
    await user.type(screen.getByLabelText(/^password$/i), 'SafePass123!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    const error = await screen.findByText(/valid email.*@.*domain/i);
    expect(error).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText(/email address/i)).toHaveAttribute(
      'aria-describedby',
      error.id,
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('requires matching passwords during registration', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<AuthForm mode="register" onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/email address/i), 'driver@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'SafePass123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'Different123!');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits normalized valid registration credentials without confirmation', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<AuthForm mode="register" onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/email address/i), 'OWNER@GARAGE.IO');
    await user.type(screen.getByLabelText(/^password$/i), 'SafePass123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'SafePass123!');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'owner@garage.io',
      password: 'SafePass123!',
    });
  });

  it('can reveal and hide the password accessibly', async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="login" onSubmit={vi.fn()} />);

    const password = screen.getByLabelText(/^password$/i);
    expect(password).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: /show password/i }));
    expect(password).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: /hide password/i }));
    expect(password).toHaveAttribute('type', 'password');
  });
});
