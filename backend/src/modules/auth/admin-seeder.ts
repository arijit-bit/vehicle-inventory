import { registrationSchema } from './auth.schemas.js';
import type { AuthCredentials, PasswordHasher } from './auth.types.js';

export interface AdminRepository {
  upsertAdmin(input: { email: string; passwordHash: string }): Promise<void>;
}

export class AdminSeeder {
  constructor(
    private readonly users: AdminRepository,
    private readonly passwords: PasswordHasher,
  ) {}

  async seed(credentials?: AuthCredentials): Promise<void> {
    if (!credentials) {
      return;
    }

    const admin = registrationSchema.parse(credentials);
    const passwordHash = await this.passwords.hash(admin.password);

    await this.users.upsertAdmin({
      email: admin.email,
      passwordHash,
    });
  }
}
