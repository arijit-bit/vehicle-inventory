import type { AuthClaims } from '../modules/auth/auth.types.js';

declare global {
  namespace Express {
    interface Request {
      auth?: AuthClaims;
    }
  }
}

export {};
