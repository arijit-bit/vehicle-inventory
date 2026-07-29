export type UserRole = 'CUSTOMER' | 'EMPLOYEE' | 'ADMIN';
export type RegistrableRole = Exclude<UserRole, 'ADMIN'>;

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
}

export interface PublicUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthClaims {
  sub: string;
  email: string;
  role: UserRole;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegistrationCredentials extends AuthCredentials {
  role: RegistrableRole;
}

export interface AuthResult {
  user: PublicUser;
  token: string;
}

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  role: UserRole;
}

export interface UserRepository {
  findByEmail(email: string): Promise<UserRecord | null>;
  create(input: CreateUserInput): Promise<UserRecord>;
}

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  compare(password: string, passwordHash: string): Promise<boolean>;
}

export interface TokenIssuer {
  sign(user: PublicUser): string;
}

export interface TokenVerifier {
  verify(token: string): AuthClaims;
}

export class DuplicateEmailError extends Error {
  constructor() {
    super('An account with this email already exists');
    this.name = 'DuplicateEmailError';
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid email or password');
    this.name = 'InvalidCredentialsError';
  }
}
