import type { UserRole } from './auth.types.js';

export interface ManagedUser {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateManagedUserInput {
  email: string;
  passwordHash: string;
  role: UserRole;
}

export interface UpdateManagedUserInput {
  email?: string;
  passwordHash?: string;
  role?: UserRole;
}

export interface UserManagementRepository {
  listAccounts(): Promise<ManagedUser[]>;
  findAccountById(id: string): Promise<ManagedUser | null>;
  createAccount(input: CreateManagedUserInput): Promise<ManagedUser>;
  updateAccount(id: string, input: UpdateManagedUserInput): Promise<ManagedUser | null>;
  deleteAccount(id: string): Promise<boolean>;
}

export class UserNotFoundError extends Error {
  constructor() {
    super('User not found');
    this.name = 'UserNotFoundError';
  }
}

export class CannotDeleteSelfError extends Error {
  constructor() {
    super('Administrators cannot delete their own active account');
    this.name = 'CannotDeleteSelfError';
  }
}

export class CannotChangeOwnRoleError extends Error {
  constructor() {
    super('Administrators cannot change their own role');
    this.name = 'CannotChangeOwnRoleError';
  }
}
