import type { DatabaseClient } from '../../infrastructure/database/prisma.js';
import {
  DuplicateEmailError,
  type CreateUserInput,
  type UserRecord,
  type UserRepository,
} from './auth.types.js';

const isUniqueConstraintError = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code: unknown }).code === 'P2002';

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly database: DatabaseClient) {}

  async findByEmail(email: string): Promise<UserRecord | null> {
    return this.database.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
      },
    });
  }

  async create(input: CreateUserInput): Promise<UserRecord> {
    try {
      return await this.database.user.create({
        data: input,
        select: {
          id: true,
          email: true,
          passwordHash: true,
          role: true,
        },
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new DuplicateEmailError();
      }

      throw error;
    }
  }
}
