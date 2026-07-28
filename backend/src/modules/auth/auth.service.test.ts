import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service.js';
import {
  DuplicateEmailError,
  InvalidCredentialsError,
  type PasswordHasher,
  type TokenIssuer,
  type UserRecord,
  type UserRepository,
} from './auth.types.js';

describe('AuthService', () => {
  const existingUser: UserRecord = {
    id: '9d2e9700-ddff-4957-965c-30bf44484461',
    email: 'driver@example.com',
    passwordHash: 'stored-password-hash',
    role: 'USER',
  };

  let repository: UserRepository;
  let passwordHasher: PasswordHasher;
  let tokenIssuer: TokenIssuer;
  let service: AuthService;

  beforeEach(() => {
    repository = {
      findByEmail: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation(async (input) => ({
        id: '8e80ca50-184d-421c-9bac-e3964385c40c',
        ...input,
      })),
    };
    passwordHasher = {
      hash: vi.fn().mockResolvedValue('new-password-hash'),
      compare: vi.fn().mockResolvedValue(true),
    };
    tokenIssuer = {
      sign: vi.fn().mockReturnValue('signed.jwt.token'),
    };
    service = new AuthService(repository, passwordHasher, tokenIssuer);
  });

  it('registers a lowercase user and stores only a password hash', async () => {
    const result = await service.register({
      email: ' Driver@Example.COM ',
      password: 'SafePass123!',
    });

    expect(repository.findByEmail).toHaveBeenCalledWith('driver@example.com');
    expect(passwordHasher.hash).toHaveBeenCalledWith('SafePass123!');
    expect(repository.create).toHaveBeenCalledWith({
      email: 'driver@example.com',
      passwordHash: 'new-password-hash',
      role: 'USER',
    });
    expect(tokenIssuer.sign).toHaveBeenCalledWith({
      id: result.user.id,
      email: 'driver@example.com',
      role: 'USER',
    });
    expect(result).toEqual({
      user: {
        id: '8e80ca50-184d-421c-9bac-e3964385c40c',
        email: 'driver@example.com',
        role: 'USER',
      },
      token: 'signed.jwt.token',
    });
    expect(JSON.stringify(result)).not.toContain('SafePass123!');
    expect(JSON.stringify(result)).not.toContain('new-password-hash');
  });

  it('rejects duplicate email addresses before hashing', async () => {
    vi.mocked(repository.findByEmail).mockResolvedValue(existingUser);

    await expect(
      service.register({
        email: 'DRIVER@example.com',
        password: 'SafePass123!',
      }),
    ).rejects.toBeInstanceOf(DuplicateEmailError);

    expect(passwordHasher.hash).not.toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('logs in with a normalized email and returns a signed token', async () => {
    vi.mocked(repository.findByEmail).mockResolvedValue(existingUser);

    const result = await service.login({
      email: ' DRIVER@EXAMPLE.COM ',
      password: 'SafePass123!',
    });

    expect(repository.findByEmail).toHaveBeenCalledWith('driver@example.com');
    expect(passwordHasher.compare).toHaveBeenCalledWith(
      'SafePass123!',
      'stored-password-hash',
    );
    expect(result.user.email).toBe('driver@example.com');
    expect(result.token).toBe('signed.jwt.token');
  });

  it('uses the same generic error for unknown users and wrong passwords', async () => {
    await expect(
      service.login({
        email: 'missing@example.com',
        password: 'SafePass123!',
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);

    vi.mocked(repository.findByEmail).mockResolvedValue(existingUser);
    vi.mocked(passwordHasher.compare).mockResolvedValue(false);

    await expect(
      service.login({
        email: 'driver@example.com',
        password: 'WrongPass123!',
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });
});
