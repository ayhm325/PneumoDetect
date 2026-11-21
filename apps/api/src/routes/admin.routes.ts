import { Router } from "express";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middleware/auth.js";
import { withRateLimit } from "../middleware/rateLimit.js";
import {
  adminDoctorChangeRequestService,
  adminDoctorService,
  adminMonitoringService,
  adminPatientService,
  adminSettingsService,
  adminUserService,
} from "../services/admin/index.js";

export const adminRouter = Router();

adminRouter.use("/admin", requireAuth, requireRole("admin"));

adminRouter.get("/admin/dashboard-stats", withRateLimit("GET /api/admin/dashboard-stats"), async (_req, res, next) => {
  try {
    const result = await adminMonitoringService.getDashboardStats();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/admin/system-status", withRateLimit("GET /api/admin/system-status"), async (_req, res, next) => {
  try {
    const result = await adminMonitoringService.getSystemStatus();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/admin/recent-activities", withRateLimit("GET /api/admin/recent-activities"), async (_req, res, next) => {
  try {
    const result = await adminMonitoringService.listRecentActivities();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

adminRouter.post("/admin/recent-activities", withRateLimit("POST /api/admin/recent-activities"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await adminMonitoringService.createRecentActivity({
      userId: req.auth!.user.id,
      type: req.body?.type,
      description: req.body?.description,
      meta: req.body?.meta,
    });
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

adminRouter.post("/admin/announcements", withRateLimit("POST /api/admin/announcements"), async (req, res, next) => {
  try {
    const result = await adminMonitoringService.broadcastAnnouncement({
      roles: req.body?.roles,
      type: req.body?.type,
      message: req.body?.message ?? "",
    });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/admin/notifications", withRateLimit("GET /api/admin/notifications"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await adminMonitoringService.listNotifications({
      userId: req.auth!.user.id,
    });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

adminRouter.patch("/admin/notifications", withRateLimit("PATCH /api/admin/notifications"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await adminMonitoringService.updateNotifications({
      userId: req.auth!.user.id,
      notificationId: req.body?.notificationId ?? req.body?.id ?? null,
      isRead: req.body?.isRead,
    });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/admin/notifications-unread", withRateLimit("GET /api/admin/notifications-unread"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await adminMonitoringService.getNotificationsUnread({
      userId: req.auth!.user.id,
    });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/admin/users", withRateLimit("GET /api/admin/users"), async (_req, res, next) => {
  try {
    const result = await adminUserService.listUsers();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

adminRouter.post("/admin/users", withRateLimit("POST /api/admin/users"), async (req, res, next) => {
  try {
    const result = await adminUserService.createAdminUser(req.body || {});
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

adminRouter.patch("/admin/users/:id", withRateLimit("PATCH /api/admin/users/:id"), async (req, res, next) => {
  try {
    const result = await adminUserService.toggleUserState({
      id: String(req.params.id),
      isActive: req.body?.isActive,
      status: req.body?.status,
    });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/admin/doctors", withRateLimit("GET /api/admin/doctors"), async (_req, res, next) => {
  try {
    const result = await adminDoctorService.listDoctors();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

adminRouter.post("/admin/doctors", withRateLimit("POST /api/admin/doctors"), async (req, res, next) => {
  try {
    const result = await adminDoctorService.createDoctor(req.body || {});
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

adminRouter.patch("/admin/doctors", withRateLimit("PATCH /api/admin/doctors"), async (req, res, next) => {
  try {
    const result = await adminDoctorService.updateDoctorStatus(req.body || {});
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

adminRouter.patch("/admin/doctors/:id", withRateLimit("PATCH /api/admin/doctors/:id"), async (req, res, next) => {
  try {
    const result = await adminDoctorService.updateDoctorByUserId({
      userId: String(req.params.id),
      ...(req.body || {}),
    });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

adminRouter.delete("/admin/doctors/:id", withRateLimit("DELETE /api/admin/doctors/:id"), async (req, res, next) => {
  try {
    const result = await adminDoctorService.blockDoctorByUserId({
      userId: String(req.params.id),
    });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/admin/patients", withRateLimit("GET /api/admin/patients"), async (_req, res, next) => {
  try {
    const result = await adminPatientService.listPatients();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

adminRouter.post("/admin/patients", withRateLimit("POST /api/admin/patients"), async (req, res, next) => {
  try {
    const result = await adminPatientService.createPatient(req.body || {});
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

adminRouter.patch("/admin/patients/:id", withRateLimit("PATCH /api/admin/patients/:id"), async (req, res, next) => {
  try {
    const result = await adminPatientService.updatePatientById({
      id: String(req.params.id),
      ...(req.body || {}),
    });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/admin/doctor-change-requests", withRateLimit("GET /api/admin/doctor-change-requests"), async (req, res, next) => {
  try {
    const all = req.query.all === "true";
    const result = await adminDoctorChangeRequestService.listRequests({ all });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

adminRouter.patch("/admin/doctor-change-requests", withRateLimit("PATCH /api/admin/doctor-change-requests"), async (req, res, next) => {
  try {
    const result = await adminDoctorChangeRequestService.actOnRequest({
      id: req.body?.id,
      action: req.body?.action,
    });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/admin/settings", withRateLimit("GET /api/admin/settings"), async (_req, res, next) => {
  try {
    const result = await adminSettingsService.getSettings();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

adminRouter.patch("/admin/settings", withRateLimit("PATCH /api/admin/settings"), async (req, res, next) => {
  try {
    const result = await adminSettingsService.updateSettings({ patch: req.body || {} });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});
