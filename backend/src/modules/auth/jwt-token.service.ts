import jwt, { type SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import { normalizedEmailSchema } from './auth.schemas.js';
import type {
  AuthClaims,
  PublicUser,
  TokenIssuer,
  TokenVerifier,
} from './auth.types.js';

const authClaimsSchema = z.object({
  sub: z.string().uuid(),
  email: normalizedEmailSchema,
  role: z.enum(['USER', 'ADMIN']),
});

interface JwtTokenOptions {
  secret: string;
  expiresIn: string;
  issuer: string;
  audience: string;
}

export class JwtTokenService implements TokenIssuer, TokenVerifier {
  constructor(private readonly options: JwtTokenOptions) {}

  sign(user: PublicUser) {
    return jwt.sign(
      {
        email: user.email,
        role: user.role,
      },
      this.options.secret,
      {
        algorithm: 'HS256',
        subject: user.id,
        expiresIn: this.options.expiresIn as NonNullable<SignOptions['expiresIn']>,
        issuer: this.options.issuer,
        audience: this.options.audience,
      },
    );
  }

  verify(token: string): AuthClaims {
    const decoded = jwt.verify(token, this.options.secret, {
      algorithms: ['HS256'],
      issuer: this.options.issuer,
      audience: this.options.audience,
    });

    return authClaimsSchema.parse(decoded);
  }
}
