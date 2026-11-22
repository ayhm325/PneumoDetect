import { AppError } from "../../lib/errors/appError";
import type { PatientDoctorChangeRequestRepository } from "../../repositories/patient/patientDoctorChangeRequestRepository";
import { createAdminSettingsRepository, type AdminSettingsRepository } from "../../repositories/admin/adminSettingsRepository";

export interface PatientDoctorChangeRequestService {
  listDoctorsForPatientChange(userId: string): Promise<{ success: true; doctors: Array<Record<string, unknown>> }>;
  createDoctorChangeRequest(input: {
    userId: string;
    requestedDoctorId?: unknown;
    newDoctorId?: unknown;
    newDoctor?: unknown;
    reason?: unknown;
  }): Promise<{ success: true; request: Record<string, unknown> }>;
}

export function createPatientDoctorChangeRequestService(deps: {
  patientDoctorChangeRequestRepository: PatientDoctorChangeRequestRepository;
  adminSettingsRepository?: AdminSettingsRepository;
}): PatientDoctorChangeRequestService {
  const settingsRepo = deps.adminSettingsRepository ?? createAdminSettingsRepository();
  return {
    async listDoctorsForPatientChange(userId) {
      const normalizedUserId = String(userId || "").trim();
      if (!normalizedUserId) {
        throw new AppError({ code: "unauthenticated", message: "unauthenticated", statusCode: 401 });
      }

      const doctors = await deps.patientDoctorChangeRequestRepository.listDoctorsForChange();
      return { success: true as const, doctors };
    },

    async createDoctorChangeRequest(input) {
      const userId = String(input.userId || "").trim();
      if (!userId) {
        throw new AppError({ code: "unauthenticated", message: "unauthenticated", statusCode: 401 });
      }

      const patient = await deps.patientDoctorChangeRequestRepository.findPatientByUserId(userId);
      if (!patient) {
        throw new AppError({ code: "not_found", message: "Patient not found", statusCode: 404 });
      }

      const settings = await settingsRepo.readSettings().catch(() => null);
      if (settings && settings.allowPatientChangeDoctor === false) {
        throw new AppError({
          code: "forbidden",
          message: "تغيير الطبيب المشرف غير متاح حالياً حسب إعدادات الإدارة",
          statusCode: 403,
        });
      }

      const maxRequestsRaw = settings?.maxDoctorChangeRequests;
      const maxRequests =
        typeof maxRequestsRaw === "number" && Number.isFinite(maxRequestsRaw)
          ? Math.max(0, Math.floor(maxRequestsRaw))
          : 3;

      if (typeof deps.patientDoctorChangeRequestRepository.countDoctorChangeRequestsByUserId === "function") {
        const existingCount = await deps.patientDoctorChangeRequestRepository.countDoctorChangeRequestsByUserId(userId);
        if (existingCount >= maxRequests) {
          throw new AppError({
            code: "validation_error",
            message: `تم تجاوز الحد الأقصى لطلبات تغيير الطبيب (${maxRequests})`,
            statusCode: 400,
          });
        }
      }

      const requestedDoctorRaw = input.requestedDoctorId || input.newDoctorId || input.newDoctor;
      const requestedDoctorId = String(requestedDoctorRaw || "").trim();
      if (!requestedDoctorId) {
        throw new AppError({ code: "validation_error", message: "Missing requestedDoctorId", statusCode: 400 });
      }

      const currentDoctorId = String((patient as { doctorId?: string | null }).doctorId || "").trim();
      if (currentDoctorId && requestedDoctorId === currentDoctorId) {
        throw new AppError({
          code: "validation_error",
          message: "Requested doctor is the same as current doctor",
          statusCode: 400,
        });
      }

      const requestedDoctor = await deps.patientDoctorChangeRequestRepository.findDoctorByUserId(requestedDoctorId);
      const requestedDoctorStatus = String((requestedDoctor as { status?: string } | null)?.status || "").trim();
      if (!requestedDoctor || !["active", "pending"].includes(requestedDoctorStatus)) {
        throw new AppError({ code: "not_found", message: "Requested doctor not found", statusCode: 404 });
      }

      const reason = String(input.reason || "").trim();
      const created = await deps.patientDoctorChangeRequestRepository.createDoctorChangeRequest({
        userId,
        patientId: String((patient as { id?: string }).id || ""),
        currentDoctorId: currentDoctorId || null,
        requestedDoctorId,
        reason,
      });

      return { success: true as const, request: created };
    },
  };
}
