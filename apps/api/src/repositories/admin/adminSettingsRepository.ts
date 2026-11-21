import fs from "fs/promises";
import path from "path";
import { AppError } from "../../lib/errors/appError";

const SETTINGS_FILE = path.resolve(process.cwd(), "data", "settings.json");

export type AdminSettingsRecord = Record<string, unknown>;

export interface AdminSettingsRepository {
  readSettings(): Promise<AdminSettingsRecord | null>;
  writeSettings(settings: AdminSettingsRecord): Promise<void>;
}

export function createAdminSettingsRepository(): AdminSettingsRepository {
  return {
    async readSettings() {
      try {
        const raw = await fs.readFile(SETTINGS_FILE, "utf-8");
        return JSON.parse(raw) as AdminSettingsRecord;
      } catch (error) {
        const code = (error as { code?: string } | null)?.code;
        if (code === "ENOENT") return null;

        throw new AppError({
          code: "repository_error",
          message: "Failed to read settings",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async writeSettings(settings) {
      try {
        await fs.mkdir(path.dirname(SETTINGS_FILE), { recursive: true });
        await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
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
