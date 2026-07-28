import { describe, expect, it } from 'vitest';
import { BcryptPasswordHasher } from './bcrypt-password-hasher.js';

describe('BcryptPasswordHasher', () => {
  it('stores a salted bcrypt hash and verifies only the correct password', async () => {
    const passwords = new BcryptPasswordHasher(4);
    const hash = await passwords.hash('SafePass123!');

    expect(hash).not.toContain('SafePass123!');
    expect(hash).toMatch(/^\$2[aby]\$04\$/);
    await expect(passwords.compare('SafePass123!', hash)).resolves.toBe(true);
    await expect(passwords.compare('WrongPass123!', hash)).resolves.toBe(false);
  });
});
