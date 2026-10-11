import { createAdminUserRepository } from "../../repositories/admin/adminUserRepository";
import { createAdminDoctorRepository } from "../../repositories/admin/adminDoctorRepository";
import { createAdminPatientRepository } from "../../repositories/admin/adminPatientRepository";
import { createAdminMonitoringRepository } from "../../repositories/admin/adminMonitoringRepository";
import { createAdminDoctorChangeRequestRepository } from "../../repositories/admin/adminDoctorChangeRequestRepository";
import { createAdminSettingsRepository } from "../../repositories/admin/adminSettingsRepository";
import { createAuthNotificationRepository } from "../../repositories/auth/notificationRepository";
import { createAdminUserService } from "./adminUserService";
import { createAdminDoctorService } from "./adminDoctorService";
import { createAdminPatientService } from "./adminPatientService";
import { createAdminMonitoringService } from "./adminMonitoringService";
import { createAdminDoctorChangeRequestService } from "./adminDoctorChangeRequestService";
import { createAdminSettingsService } from "./adminSettingsService";

const adminUserRepository = createAdminUserRepository();
const adminDoctorRepository = createAdminDoctorRepository();
const adminPatientRepository = createAdminPatientRepository();
const adminMonitoringRepository = createAdminMonitoringRepository();
const adminDoctorChangeRequestRepository = createAdminDoctorChangeRequestRepository();
const adminSettingsRepository = createAdminSettingsRepository();
const notificationRepository = createAuthNotificationRepository();

export const adminUserService = createAdminUserService({
  adminUserRepository,
});

export const adminDoctorService = createAdminDoctorService({
  adminDoctorRepository,
  notificationRepository,
});

export const adminPatientService = createAdminPatientService({
  adminPatientRepository,
  notificationRepository,
});

export const adminMonitoringService = createAdminMonitoringService({
  adminMonitoringRepository,
});

export const adminDoctorChangeRequestService = createAdminDoctorChangeRequestService({
  adminDoctorChangeRequestRepository,
  notificationRepository,
});

export const adminSettingsService = createAdminSettingsService({
  adminSettingsRepository,
});
