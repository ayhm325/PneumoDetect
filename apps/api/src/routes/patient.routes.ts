import { Router } from "express";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middleware/auth.js";
import { withRateLimit } from "../middleware/rateLimit.js";
import { patientPortalService, patientDoctorChangeRequestService } from "../services/patient/index.js";
import { passwordService } from "../services/auth/index.js";
import { logAudit } from "../legacy-lib/security/auditLogger.js";
import { toServiceRequest } from "../lib/http/expressAdapter.js";

export const patientRouter = Router();

patientRouter.get(
  "/patient",
  requireAuth,
  requireRole("patient"),
  withRateLimit("GET /api/patient"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await patientPortalService.getProfile(req.auth!.user.id);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

patientRouter.get(
  "/patient/profile",
  requireAuth,
  requireRole("patient"),
  withRateLimit("GET /api/patient/profile"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await patientPortalService.getProfile(req.auth!.user.id);
      logAudit({
        event: "patient_profile_viewed",
        userId: req.auth!.user.id,
        ip: req.ip,
        details: { userId: req.auth!.user.id },
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

patientRouter.put(
  "/patient/profile",
  requireAuth,
  requireRole("patient"),
  withRateLimit("PUT /api/patient/profile"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await patientPortalService.updateProfile({
        userId: req.auth!.user.id,
        ...(req.body || {}),
      });
      logAudit({
        event: "patient_profile_updated",
        userId: req.auth!.user.id,
        ip: req.ip,
        details: { userId: req.auth!.user.id },
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

patientRouter.get(
  "/patient/dashboard-stats",
  requireAuth,
  requireRole("patient"),
  withRateLimit("GET /api/patient/dashboard-stats"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await patientPortalService.getDashboardStats(req.auth!.user.id);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

patientRouter.get(
  "/patient/results",
  requireAuth,
  requireRole("patient"),
  withRateLimit("GET /api/patient/results"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await patientPortalService.listResults(req.auth!.user.id);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

patientRouter.get(
  "/patient/appointments",
  requireAuth,
  requireRole("patient"),
  withRateLimit("GET /api/patient/appointments"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await patientPortalService.listAppointments(req.auth!.user.id);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

patientRouter.post(
  "/patient/appointments",
  requireAuth,
  requireRole("patient"),
  withRateLimit("POST /api/patient/appointments"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await patientPortalService.createAppointment({
        userId: req.auth!.user.id,
        ...(req.body || {}),
      });
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },
);

patientRouter.patch(
  "/patient/appointments/:id",
  requireAuth,
  requireRole("patient"),
  withRateLimit("PATCH /api/patient/appointments/:id"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await patientPortalService.patchAppointment({
        userId: req.auth!.user.id,
        appointmentId: String(req.params.id),
        ...(req.body || {}),
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

patientRouter.delete(
  "/patient/appointments/:id",
  requireAuth,
  requireRole("patient"),
  withRateLimit("DELETE /api/patient/appointments/:id"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await patientPortalService.deleteAppointment({
        userId: req.auth!.user.id,
        appointmentId: String(req.params.id),
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

patientRouter.head(
  "/patient/notifications",
  requireAuth,
  requireRole("patient"),
  withRateLimit("HEAD /api/patient/notifications"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const unread = await patientPortalService.getUnreadNotificationsCount(req.auth!.user.id);
      res.setHeader("X-Unread-Count", String(unread));
      res.setHeader("Access-Control-Expose-Headers", "X-Unread-Count");
      return res.status(200).end();
    } catch (error) {
      next(error);
    }
  },
);

patientRouter.get(
  "/patient/notifications",
  requireAuth,
  requireRole("patient"),
  withRateLimit("GET /api/patient/notifications"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const cursor = typeof req.query.cursor === "string" ? req.query.cursor : null;
      const take = req.query.take ? Number(req.query.take) : undefined;
      const result = await patientPortalService.listNotifications({
        userId: req.auth!.user.id,
        cursor,
        take,
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

patientRouter.patch(
  "/patient/notifications",
  requireAuth,
  requireRole("patient"),
  withRateLimit("PATCH /api/patient/notifications"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await patientPortalService.updateNotifications({
        userId: req.auth!.user.id,
        id: req.body?.id ?? null,
        isRead: req.body?.isRead,
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

patientRouter.delete(
  "/patient/notifications",
  requireAuth,
  requireRole("patient"),
  withRateLimit("DELETE /api/patient/notifications"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const id = typeof req.query.id === "string" ? req.query.id : null;
      const result = await patientPortalService.deleteNotifications({
        userId: req.auth!.user.id,
        id,
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

patientRouter.post(
  "/patient/change-password",
  requireAuth,
  requireRole("patient"),
  withRateLimit("POST /api/patient/change-password"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await passwordService.changePasswordForAuthenticatedUser({
        request: toServiceRequest(req),
        oldPassword: req.body?.oldPassword || req.body?.currentPassword || "",
        newPassword: req.body?.newPassword || "",
        tokenFallback: req.auth?.token,
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

patientRouter.get(
  "/doctor-change-requests",
  requireAuth,
  requireRole("patient"),
  withRateLimit("GET /api/doctor-change-requests"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await patientDoctorChangeRequestService.listDoctorsForPatientChange(
        req.auth!.user.id,
      );
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

patientRouter.post(
  "/doctor-change-requests",
  requireAuth,
  requireRole("patient"),
  withRateLimit("POST /api/doctor-change-requests"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await patientDoctorChangeRequestService.createDoctorChangeRequest({
        userId: req.auth!.user.id,
        ...(req.body || {}),
      });
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },
);
