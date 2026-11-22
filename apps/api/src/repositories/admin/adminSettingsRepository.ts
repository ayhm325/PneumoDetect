import fs from "fs/promises";
import path from "path";
import { AppError } from "../../lib/errors/appError";

export const DEFAULT_ADMIN_SETTINGS = {
  systemName: "PneumoDetect",
  defaultLanguage: "ar",
  registrationEnabled: true,
  allowPatientChangeDoctor: true,
  maxDoctorChangeRequests: 3,
  appointmentInterval: 15,
  rolePermissions: {
    doctor: true,
    patient: true,
  },
  sessionDuration: 120,
  enableTwoFactor: false,
} as const;

function resolveSettingsFile(): string {
  const cwd = process.cwd();
  // When running from apps/api workspace, resolve to repo root data/settings.json if it exists
  const rootCandidate = path.resolve(cwd, "..", "..", "data", "settings.json");
  const localCandidate = path.resolve(cwd, "data", "settings.json");
  if (cwd.replace(/\\/g, "/").endsWith("/apps/api")) {
    return rootCandidate;
  }
  return localCandidate;
}

export type AdminSettingsRecord = Record<string, unknown>;

export interface AdminSettingsRepository {
  readSettings(): Promise<AdminSettingsRecord | null>;
  writeSettings(settings: AdminSettingsRecord): Promise<void>;
}

export function createAdminSettingsRepository(): AdminSettingsRepository {
  return {
    async readSettings() {
      const settingsFile = resolveSettingsFile();
      try {
        const raw = await fs.readFile(settingsFile, "utf-8");
        const parsed = JSON.parse(raw) as AdminSettingsRecord;
        return { ...DEFAULT_ADMIN_SETTINGS, ...parsed };
      } catch (error) {
        const code = (error as { code?: string } | null)?.code;
        if (code === "ENOENT") return { ...DEFAULT_ADMIN_SETTINGS };

        throw new AppError({
          code: "repository_error",
          message: "Failed to read settings",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async writeSettings(settings) {
      const settingsFile = resolveSettingsFile();
      try {
        await fs.mkdir(path.dirname(settingsFile), { recursive: true });
        await fs.writeFile(
          settingsFile,
          JSON.stringify({ ...DEFAULT_ADMIN_SETTINGS, ...settings }, null, 2),
          "utf-8",
        );
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to write settings",
          statusCode: 500,
          cause: error,
        });
      }
    },
  };
}
