import type {
  AuthCredentials,
  AuthResult,
  PublicUser,
  RegistrationCredentials,
} from './auth.types.js';
import {
  DuplicateEmailError,
  InvalidCredentialsError,
  type PasswordHasher,
  type TokenIssuer,
  type UserRecord,
  type UserRepository,
} from './auth.types.js';

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const toPublicUser = (user: UserRecord): PublicUser => ({
  id: user.id,
  email: user.email,
  role: user.role,
});

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly passwords: PasswordHasher,
    private readonly tokens: TokenIssuer,
  ) {}

  async register(credentials: RegistrationCredentials): Promise<AuthResult> {
    const email = normalizeEmail(credentials.email);
    const existingUser = await this.users.findByEmail(email);

    if (existingUser) {
      throw new DuplicateEmailError();
    }

    const passwordHash = await this.passwords.hash(credentials.password);
    const user = await this.users.create({
      email,
      passwordHash,
      role: credentials.role,
    });
    const publicUser = toPublicUser(user);

    return {
      user: publicUser,
      token: this.tokens.sign(publicUser),
    };
  }

  async login(credentials: AuthCredentials): Promise<AuthResult> {
    const email = normalizeEmail(credentials.email);
    const user = await this.users.findByEmail(email);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    const passwordMatches = await this.passwords.compare(credentials.password, user.passwordHash);

    if (!passwordMatches) {
      throw new InvalidCredentialsError();
    }

    const publicUser = toPublicUser(user);

    return {
      user: publicUser,
      token: this.tokens.sign(publicUser),
    };
  }
}
