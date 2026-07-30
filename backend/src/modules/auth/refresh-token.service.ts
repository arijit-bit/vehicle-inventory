import { createHash, randomBytes } from 'crypto';
import type { DatabaseClient } from '../../infrastructure/database/prisma.js';
import type { PublicUser, TokenIssuer } from './auth.types.js';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/** Hash a raw token with SHA-256 (tokens are already high-entropy random bytes). */
const hashToken = (raw: string) => createHash('sha256').update(raw).digest('hex');

/** Generate a cryptographically random 256-bit token as a 64-char hex string. */
const generateRawToken = () => randomBytes(32).toString('hex');

export interface RefreshTokenRepository {
  createToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void>;
  findByHash(tokenHash: string): Promise<{ id: string; userId: string; expiresAt: Date } | null>;
  findUserById(userId: string): Promise<PublicUser | null>;
  deleteByHash(tokenHash: string): Promise<void>;
  deleteAllForUser(userId: string): Promise<void>;
}

export class RefreshTokenService {
  constructor(
    private readonly db: RefreshTokenRepository,
    private readonly tokens: TokenIssuer,
  ) {}

  /** Issue a new refresh token for the given user. Returns the raw (unhashed) token. */
  async issue(userId: string): Promise<string> {
    const raw = generateRawToken();
    const expiresAt = new Date(Date.now() + SEVEN_DAYS_MS);
    await this.db.createToken(userId, hashToken(raw), expiresAt);
    return raw;
  }

  /**
   * Rotate a refresh token: verify, delete old, issue new.
   * Returns a new access token + new raw refresh token.
   * Throws InvalidRefreshTokenError if invalid/expired.
   */
  async rotate(rawToken: string): Promise<{ accessToken: string; newRawToken: string }> {
    const record = await this.db.findByHash(hashToken(rawToken));

    if (!record) {
      throw new InvalidRefreshTokenError();
    }

    if (record.expiresAt < new Date()) {
      await this.db.deleteByHash(hashToken(rawToken));
      throw new InvalidRefreshTokenError();
    }

    const user = await this.db.findUserById(record.userId);
    if (!user) {
      await this.db.deleteByHash(hashToken(rawToken));
      throw new InvalidRefreshTokenError();
    }

    // Atomic rotation: delete old, create new
    await this.db.deleteByHash(hashToken(rawToken));
    const newRaw = generateRawToken();
    await this.db.createToken(
      record.userId,
      hashToken(newRaw),
      new Date(Date.now() + SEVEN_DAYS_MS),
    );

    return {
      accessToken: this.tokens.sign(user),
      newRawToken: newRaw,
    };
  }

  /** Revoke a single refresh token (logout). No-op if it does not exist. */
  async revoke(rawToken: string): Promise<void> {
    await this.db.deleteByHash(hashToken(rawToken));
  }

  /** Revoke all refresh tokens for a user (e.g. password change). */
  async revokeAll(userId: string): Promise<void> {
    await this.db.deleteAllForUser(userId);
  }
}

export class InvalidRefreshTokenError extends Error {
  constructor() {
    super('Refresh token is invalid or has expired');
    this.name = 'InvalidRefreshTokenError';
  }
}

/** Prisma-backed implementation of RefreshTokenRepository */
export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly database: DatabaseClient) {}

  async createToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.database.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });
  }

  async findByHash(tokenHash: string) {
    return this.database.refreshToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, expiresAt: true },
    });
  }

  async findUserById(userId: string): Promise<PublicUser | null> {
    return this.database.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });
  }

  async deleteByHash(tokenHash: string): Promise<void> {
    await this.database.refreshToken.deleteMany({ where: { tokenHash } });
  }

  async deleteAllForUser(userId: string): Promise<void> {
    await this.database.refreshToken.deleteMany({ where: { userId } });
  }
}
