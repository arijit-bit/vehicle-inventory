import bcrypt from 'bcrypt';
import type { PasswordHasher } from './auth.types.js';

export class BcryptPasswordHasher implements PasswordHasher {
  constructor(private readonly rounds = 12) {}

  hash(password: string) {
    return bcrypt.hash(password, this.rounds);
  }

  compare(password: string, passwordHash: string) {
    return bcrypt.compare(password, passwordHash);
  }
}
