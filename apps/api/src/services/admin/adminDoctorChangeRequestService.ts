import { AppError } from "../../lib/errors/appError";
import type { AdminDoctorChangeRequestRepository } from "../../repositories/admin/adminDoctorChangeRequestRepository";
import type { AuthNotificationRepository } from "../../repositories/auth/notificationRepository";

type ChangeAction = "approve" | "reject";

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function getStringField(source: unknown, key: string): string | null {
  const object = asObject(source);
  const value = object[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

export interface AdminDoctorChangeRequestService {
  listRequests(input: { all: boolean }): Promise<{ success: true; requests: Array<Record<string, unknown>> }>;
  actOnRequest(input: {
    id?: string;
    action?: string;
  }): Promise<Record<string, unknown>>;
}

export function createAdminDoctorChangeRequestService(deps: {
  adminDoctorChangeRequestRepository: AdminDoctorChangeRequestRepository;
  notificationRepository: AuthNotificationRepository;
}): AdminDoctorChangeRequestService {
  return {
    async listRequests(input) {
      const requests = await deps.adminDoctorChangeRequestRepository.listDoctorChangeRequests(
        input.all,
      );

      const patientIds = Array.from(
        new Set(
          requests
            .map((request) => getStringField(request.details, "patientId"))
            .filter((value): value is string => Boolean(value)),
        ),
      );

      const requestedDoctorIds = Array.from(
        new Set(
          requests
            .map((request) => getStringField(request.details, "requestedDoctorId"))
            .filter((value): value is string => Boolean(value)),
        ),
      );

      const patients = await deps.adminDoctorChangeRequestRepository.findPatientsByIds(patientIds);
      const patientDoctorMap = new Map(patients.map((patient) => [patient.id, patient.doctorId]));

      const allDoctorIds = Array.from(
        new Set(
          [...requestedDoctorIds, ...patients.map((patient) => patient.doctorId)]
            .filter((value): value is string => typeof value === "string" && value.length > 0),
        ),
      );

      const doctors = await deps.adminDoctorChangeRequestRepository.findDoctorsByIds(allDoctorIds);
      const doctorNameById = new Map(
        doctors.map((doctor) => [
          doctor.userId,
          doctor.user?.fullName || doctor.user?.email || doctor.userId,
        ]),
      );

      const output = requests.map((request) => {
        const patientId = getStringField(request.details, "patientId");
        const currentDoctorId = patientId ? patientDoctorMap.get(patientId) || null : null;
        const requestedDoctorId = getStringField(request.details, "requestedDoctorId");

        return {
          id: request.id,
          userId: request.userId,
          patientName: request.user?.fullName || request.userId,
          status: request.status,
          details: {
            ...asObject(request.details),
            patientId,
            currentDoctorId,
            currentDoctorName: currentDoctorId
              ? doctorNameById.get(currentDoctorId) || currentDoctorId
              : null,
            requestedDoctorId,
            requestedDoctorName: requestedDoctorId
              ? doctorNameById.get(requestedDoctorId) || requestedDoctorId
              : null,
          },
          reason: getStringField(request.details, "reason") || "",
          requestedDoctorId,
          createdAt: request.createdAt,
        };
      });

      return {
        success: true,
        requests: output as Array<Record<string, unknown>>,
      };
    },

    async actOnRequest(input) {
      const id = String(input.id || "").trim();
      const action = String(input.action || "").trim() as ChangeAction;

      if (!id || !action) {
        throw new AppError({
          code: "validation_error",
          message: "Missing id or action",
          statusCode: 400,
        });
      }

      const request = await deps.adminDoctorChangeRequestRepository.findDoctorChangeRequestById(id);
      if (!request) {
        throw new AppError({
          code: "not_found",
          message: "Request not found",
          statusCode: 404,
        });
      }

      if (request.type !== "doctor_change") {
        throw new AppError({
          code: "validation_error",
          message: "Invalid request type",
          statusCode: 400,
        });
      }

      if (request.status !== "pending") {
        if (request.status === "approved" && action === "approve") {
          return {
            success: true,
            message: "Request already approved",
            request,
          };
        }

        if (request.status === "rejected" && action === "reject") {
          return {
            success: true,
            message: "Request already rejected",
            request,
          };
        }

        throw new AppError({
          code: "validation_error",
          message: `Request not pending (current: ${request.status})`,
          statusCode: 400,
          details: { currentStatus: request.status },
        });
      }

      if (action === "approve") {
        const patientId = getStringField(request.details, "patientId");
        const requestedDoctorId = getStringField(request.details, "requestedDoctorId");

        if (!patientId || !requestedDoctorId) {
          throw new AppError({
            code: "validation_error",
            message: "Request details incomplete",
            statusCode: 400,
          });
        }

        await deps.adminDoctorChangeRequestRepository.updatePatientDoctor(
          patientId,
          requestedDoctorId,
        );

        const updated = await deps.adminDoctorChangeRequestRepository.updateChangeRequestStatus(
          id,
          "approved",
        );

        const doctor = await deps.adminDoctorChangeRequestRepository.findDoctorByUserId(
          requestedDoctorId,
        );
        const doctorName =
          doctor?.user?.fullName || doctor?.user?.email || requestedDoctorId;

        await deps.notificationRepository.createSystemNotification({
          userId: updated.userId,
          type: "success",
          messageAr: `تمت الموافقة على طلب تغيير الطبيب. طبيبك الجديد: ${doctorName}.`,
          messageEn: `Your doctor change request was approved. Your new doctor is ${doctorName}.`,
        });

        const patientName =
          (await deps.adminDoctorChangeRequestRepository.findPatientNameById(patientId)) || "";

        await deps.notificationRepository.createSystemNotification({
          userId: requestedDoctorId,
          type: "info",
          messageAr: `تم تحويل مريض جديد إليك${patientName ? `: ${patientName}` : ""}.`,
          messageEn: `A new patient has been assigned to you${patientName ? `: ${patientName}` : ""}.`,
        });

        return {
          success: true,
          request: updated,
        };
      }

      if (action === "reject") {
        const updated = await deps.adminDoctorChangeRequestRepository.updateChangeRequestStatus(
          id,
          "rejected",
        );

        await deps.notificationRepository.createSystemNotification({
          userId: updated.userId,
          type: "warning",
          messageAr: "تم رفض طلب تغيير الطبيب.",
          messageEn: "Your doctor change request was rejected.",
        });

        return {
          success: true,
          request: updated,
        };
      }

      throw new AppError({
        code: "validation_error",
        message: "Unknown action",
        statusCode: 400,
      });
    },
  };
}
