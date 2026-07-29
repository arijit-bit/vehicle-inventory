import type { DatabaseClient } from '../../infrastructure/database/prisma.js';
import type { AdminRepository } from './admin-seeder.js';
import {
  DuplicateEmailError,
  type CreateUserInput,
  type UserRecord,
  type UserRepository,
} from './auth.types.js';
import type {
  CreateManagedUserInput,
  UpdateManagedUserInput,
  UserManagementRepository,
} from './user-management.types.js';

const isUniqueConstraintError = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code: unknown }).code === 'P2002';

const isRecordNotFoundError = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code: unknown }).code === 'P2025';

const managedUserSelect = {
  id: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class PrismaUserRepository
  implements UserRepository, AdminRepository, UserManagementRepository
{
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

  async upsertAdmin(input: { email: string; passwordHash: string }): Promise<void> {
    await this.database.user.upsert({
      where: { email: input.email },
      update: {
        passwordHash: input.passwordHash,
        role: 'ADMIN',
      },
      create: {
        email: input.email,
        passwordHash: input.passwordHash,
        role: 'ADMIN',
      },
    });
  }

  async listAccounts() {
    return this.database.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: managedUserSelect,
    });
  }

  async findAccountById(id: string) {
    return this.database.user.findUnique({
      where: { id },
      select: managedUserSelect,
    });
  }

  async createAccount(input: CreateManagedUserInput) {
    try {
      return await this.database.user.create({
        data: input,
        select: managedUserSelect,
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new DuplicateEmailError();
      }

      throw error;
    }
  }

  async updateAccount(id: string, input: UpdateManagedUserInput) {
    try {
      return await this.database.user.update({
        where: { id },
        data: input,
        select: managedUserSelect,
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new DuplicateEmailError();
      }

      if (isRecordNotFoundError(error)) {
        return null;
      }

      throw error;
    }
  }

  async deleteAccount(id: string) {
    try {
      await this.database.user.delete({ where: { id } });
      return true;
    } catch (error) {
      if (isRecordNotFoundError(error)) {
        return false;
      }

      throw error;
    }
  }
}
