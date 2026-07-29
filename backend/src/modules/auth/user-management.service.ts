import type { PasswordHasher } from './auth.types.js';
import {
  CannotChangeOwnRoleError,
  CannotDeleteSelfError,
  type ManagedUser,
  UserNotFoundError,
  type UserManagementRepository,
} from './user-management.types.js';
import type { CreateUserRequest, UpdateUserRequest } from './user-management.schemas.js';

export class UserManagementService {
  constructor(
    private readonly users: UserManagementRepository,
    private readonly passwords: PasswordHasher,
  ) {}

  list(): Promise<ManagedUser[]> {
    return this.users.listAccounts();
  }

  async get(id: string): Promise<ManagedUser> {
    const user = await this.users.findAccountById(id);

    if (!user) {
      throw new UserNotFoundError();
    }

    return user;
  }

  async create(input: CreateUserRequest): Promise<ManagedUser> {
    return this.users.createAccount({
      email: input.email,
      passwordHash: await this.passwords.hash(input.password),
      role: input.role,
    });
  }

  async update(
    id: string,
    input: UpdateUserRequest,
    actingAdministratorId: string,
  ): Promise<ManagedUser> {
    if (id === actingAdministratorId && input.role && input.role !== 'ADMIN') {
      throw new CannotChangeOwnRoleError();
    }

    const passwordHash = input.password ? await this.passwords.hash(input.password) : undefined;
    const user = await this.users.updateAccount(id, {
      ...(input.email ? { email: input.email } : {}),
      ...(passwordHash ? { passwordHash } : {}),
      ...(input.role ? { role: input.role } : {}),
    });

    if (!user) {
      throw new UserNotFoundError();
    }

    return user;
  }

  async delete(id: string, actingAdministratorId: string): Promise<void> {
    if (id === actingAdministratorId) {
      throw new CannotDeleteSelfError();
    }

    if (!(await this.users.deleteAccount(id))) {
      throw new UserNotFoundError();
    }
  }
}
