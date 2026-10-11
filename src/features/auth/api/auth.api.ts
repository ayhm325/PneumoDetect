import { apiPost } from "../../../lib/api";
import type { LoginInput } from "../validation/login.schema";

export type LoginResponse = {
  user: {
    id: string;
    role: "admin" | "doctor" | "patient";
    email?: string;
    fullName?: string;
  };
  tokenForDev?: string;
};

export function loginRequest(payload: LoginInput) {
  return apiPost<LoginResponse, LoginInput>("/api/login", payload, {
    cache: "no-store",
  });
}
