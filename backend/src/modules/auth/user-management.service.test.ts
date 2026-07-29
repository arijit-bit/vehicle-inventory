import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PasswordHasher } from './auth.types.js';
import { UserManagementService } from './user-management.service.js';
import {
  CannotChangeOwnRoleError,
  CannotDeleteSelfError,
  type UserManagementRepository,
} from './user-management.types.js';

const adminId = 'bb374a4a-a335-4d08-9385-608a84fb80f9';
const customerId = '6d81eeca-7b73-4be4-b164-32974cf57619';

describe('UserManagementService', () => {
  let users: UserManagementRepository;
  let passwords: PasswordHasher;
  let service: UserManagementService;

  beforeEach(() => {
    users = {
      listAccounts: vi.fn().mockResolvedValue([]),
      findAccountById: vi.fn(),
      createAccount: vi.fn().mockImplementation(async (input) => ({
        id: customerId,
        email: input.email,
        role: input.role,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      updateAccount: vi.fn(),
      deleteAccount: vi.fn().mockResolvedValue(true),
    };
    passwords = {
      hash: vi.fn().mockResolvedValue('secure-hash'),
      compare: vi.fn(),
    };
    service = new UserManagementService(users, passwords);
  });

  it('hashes passwords when an administrator creates a user', async () => {
    await service.create({
      email: 'sales@example.com',
      password: 'SafePass123!',
      role: 'EMPLOYEE',
    });

    expect(users.createAccount).toHaveBeenCalledWith({
      email: 'sales@example.com',
      passwordHash: 'secure-hash',
      role: 'EMPLOYEE',
    });
  });

  it('prevents an administrator from deleting their active account', async () => {
    await expect(service.delete(adminId, adminId)).rejects.toBeInstanceOf(CannotDeleteSelfError);
    expect(users.deleteAccount).not.toHaveBeenCalled();
  });

  it('prevents an administrator from removing their own administrator role', async () => {
    await expect(service.update(adminId, { role: 'EMPLOYEE' }, adminId)).rejects.toBeInstanceOf(
      CannotChangeOwnRoleError,
    );
    expect(users.updateAccount).not.toHaveBeenCalled();
  });
});
