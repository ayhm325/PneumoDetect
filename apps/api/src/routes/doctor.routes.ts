import { Router } from "express";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middleware/auth.js";
import { withRateLimit } from "../middleware/rateLimit.js";
import { doctorPortalService } from "../services/doctor/index.js";
import { authService, passwordService } from "../services/auth/index.js";
import { logAudit } from "../legacy-lib/security/auditLogger.js";
import { toServiceRequest } from "../lib/http/expressAdapter.js";

export const doctorRouter = Router();

// Public doctor registration
doctorRouter.post(
  "/doctor",
  withRateLimit("POST /api/doctor"),
  async (req, res, next) => {
    try {
      const result = await authService.registerDoctor({
        email: req.body?.email,
        password: req.body?.password,
        fullName: req.body?.fullName,
        licenseNumber: req.body?.licenseNumber,
        phone: req.body?.phone,
      });
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },
);

doctorRouter.get(
  "/doctor/me",
  requireAuth,
  requireRole("doctor"),
  withRateLimit("GET /api/doctor/me"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await doctorPortalService.getMyProfile(req.auth!.user.id);
      logAudit({
        event: "doctor_profile_viewed",
        userId: req.auth!.user.id,
        ip: req.ip,
        details: { doctorId: req.auth!.user.id },
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

doctorRouter.get(
  "/doctor/list",
  withRateLimit("GET /api/doctor/list"),
  async (req, res, next) => {
    try {
      const includePendingRequested = req.query.includePending === "true";
      const allowPending = process.env.NODE_ENV !== "production" || process.env.DEBUG_INCLUDE_PENDING === "true";
      const result = await doctorPortalService.listDoctors({
        includePending: includePendingRequested && allowPending,
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

doctorRouter.get(
  "/doctor/patients",
  requireAuth,
  requireRole("doctor"),
  withRateLimit("GET /api/doctor/patients"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await doctorPortalService.listPatients(req.auth!.user.id);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

doctorRouter.get(
  "/doctor/results",
  requireAuth,
  requireRole("doctor"),
  withRateLimit("GET /api/doctor/results"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const patientId = typeof req.query.patientId === "string" ? req.query.patientId : undefined;
      const result = await doctorPortalService.listResults({
        userId: req.auth!.user.id,
        patientId,
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

doctorRouter.patch(
  "/doctor/results",
  requireAuth,
  requireRole("doctor"),
  withRateLimit("PATCH /api/doctor/results"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await doctorPortalService.updateResult({
        userId: req.auth!.user.id,
        ...(req.body || {}),
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

doctorRouter.get(
  "/doctor/appointments",
  requireAuth,
  requireRole("doctor"),
  withRateLimit("GET /api/doctor/appointments"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await doctorPortalService.listAppointments(req.auth!.user.id);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

doctorRouter.post(
  "/doctor/appointments",
  requireAuth,
  requireRole("doctor"),
  withRateLimit("POST /api/doctor/appointments"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await doctorPortalService.createAppointment({
        userId: req.auth!.user.id,
        ...(req.body || {}),
      });
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },
);

doctorRouter.patch(
  "/doctor/appointments/:id",
  requireAuth,
  requireRole("doctor"),
  withRateLimit("PATCH /api/doctor/appointments/:id"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await doctorPortalService.patchAppointment({
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

doctorRouter.delete(
  "/doctor/appointments/:id",
  requireAuth,
  requireRole("doctor"),
  withRateLimit("DELETE /api/doctor/appointments/:id"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await doctorPortalService.deleteAppointment({
        userId: req.auth!.user.id,
        id: String(req.params.id),
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

doctorRouter.head(
  "/doctor/notifications",
  requireAuth,
  requireRole("doctor"),
  withRateLimit("HEAD /api/doctor/notifications"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const unread = await doctorPortalService.getUnreadNotificationsCount(req.auth!.user.id);
      res.setHeader("X-Unread-Count", String(unread));
      res.setHeader("Access-Control-Expose-Headers", "X-Unread-Count");
      return res.status(200).end();
    } catch (error) {
      next(error);
    }
  },
);

doctorRouter.get(
  "/doctor/notifications",
  requireAuth,
  requireRole("doctor"),
  withRateLimit("GET /api/doctor/notifications"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const cursor = typeof req.query.cursor === "string" ? req.query.cursor : null;
      const take = req.query.take ? Number(req.query.take) : undefined;
      const result = await doctorPortalService.listNotifications({
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

doctorRouter.patch(
  "/doctor/notifications",
  requireAuth,
  requireRole("doctor"),
  withRateLimit("PATCH /api/doctor/notifications"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await doctorPortalService.updateNotifications({
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

doctorRouter.delete(
  "/doctor/notifications",
  requireAuth,
  requireRole("doctor"),
  withRateLimit("DELETE /api/doctor/notifications"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const id = typeof req.query.id === "string" ? req.query.id : null;
      const result = await doctorPortalService.deleteNotifications({
        userId: req.auth!.user.id,
        id,
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

doctorRouter.post(
  "/doctor/change-password",
  requireAuth,
  requireRole("doctor"),
  withRateLimit("POST /api/doctor/change-password"),
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
