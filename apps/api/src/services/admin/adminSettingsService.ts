import { AppError } from "../../lib/errors/appError";
import type {
  AdminSettingsRecord,
  AdminSettingsRepository,
} from "../../repositories/admin/adminSettingsRepository";

const ALLOWED_KEYS = [
  "systemName",
  "defaultLanguage",
  "registrationEnabled",
  "allowPatientChangeDoctor",
  "maxDoctorChangeRequests",
  "appointmentInterval",
  "rolePermissions",
  "sessionDuration",
  "enableTwoFactor",
] as const;

export interface AdminSettingsService {
  getSettings(): Promise<{ settings: AdminSettingsRecord }>;
  updateSettings(input: {
    patch: Record<string, unknown>;
  }): Promise<{ success: true; settings: AdminSettingsRecord; updatedKeys: string[] }>;
}

export function createAdminSettingsService(deps: {
  adminSettingsRepository: AdminSettingsRepository;
}): AdminSettingsService {
  return {
    async getSettings() {
      const settings = await deps.adminSettingsRepository.readSettings();
      if (!settings) {
        throw new AppError({
          code: "not_found",
          message: "Settings not found",
          statusCode: 404,
        });
      }

      return { settings };
    },

    async updateSettings(input) {
      const patch = input.patch || {};
      const current = (await deps.adminSettingsRepository.readSettings()) || {};
      const updated: AdminSettingsRecord = { ...current };

      for (const key of ALLOWED_KEYS) {
        if (Object.prototype.hasOwnProperty.call(patch, key)) {
          updated[key] = patch[key];
        }
      }

      await deps.adminSettingsRepository.writeSettings(updated);

      return {
        success: true,
        settings: updated,
        updatedKeys: Object.keys(patch),
      };
    },
  };
}
