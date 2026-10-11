import { addRevokedToken, isTokenRevoked } from "../../../lib/auth/revocation.server";

export interface AuthSessionRepository {
  isRevoked(token: string): Promise<boolean>;
  revoke(token: string, expMs: number | null): Promise<void>;
}

export function createAuthSessionRepository(): AuthSessionRepository {
  return {
    async isRevoked(token) {
      return isTokenRevoked(token);
    },

    async revoke(token, expMs) {
      await addRevokedToken(token, expMs);
    },
  };
}
