import { addRevokedToken, isTokenRevoked } from "../../legacy-lib/auth/revocation.server";

export interface AuthSessionRepository {
  isRevoked(token: string): Promise<boolean>;
  revoke(token: string, expSeconds: number | null): Promise<void>;
}

export function createAuthSessionRepository(): AuthSessionRepository {
  return {
    async isRevoked(token) {
      return isTokenRevoked(token);
    },

    async revoke(token, expSeconds) {
      await addRevokedToken(token, expSeconds as unknown as undefined);
    },
  };
}
