import { describe, expect, it, vi } from 'vitest';
import { AdminSeeder } from './admin-seeder.js';
import type { PasswordHasher } from './auth.types.js';

describe('AdminSeeder', () => {
  it('upserts an environment administrator with a normalized email and password hash', async () => {
    const repository = {
      upsertAdmin: vi.fn().mockResolvedValue(undefined),
    };
    const passwords: PasswordHasher = {
      hash: vi.fn().mockResolvedValue('admin-password-hash'),
      compare: vi.fn(),
    };
    const seeder = new AdminSeeder(repository, passwords);

    await seeder.seed({
      email: ' Fleet.Admin@Example.COM ',
      password: 'AdminPass123!',
    });

    expect(passwords.hash).toHaveBeenCalledWith('AdminPass123!');
    expect(repository.upsertAdmin).toHaveBeenCalledWith({
      email: 'fleet.admin@example.com',
      passwordHash: 'admin-password-hash',
    });
    expect(repository.upsertAdmin).not.toHaveBeenCalledWith(
      expect.objectContaining({ password: 'AdminPass123!' }),
    );
  });

  it('does nothing when administrator credentials are not configured', async () => {
    const repository = {
      upsertAdmin: vi.fn(),
    };
    const passwords: PasswordHasher = {
      hash: vi.fn(),
      compare: vi.fn(),
    };
    const seeder = new AdminSeeder(repository, passwords);

    await expect(seeder.seed()).resolves.toBeUndefined();

    expect(passwords.hash).not.toHaveBeenCalled();
    expect(repository.upsertAdmin).not.toHaveBeenCalled();
  });
});
