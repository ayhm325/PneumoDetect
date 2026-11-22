import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { appointmentReminderService } from "../services/cron/index.js";

export const cronRouter = Router();

cronRouter.post(
  "/cron/appointment-reminders",
  async (req, res, next) => {
    const cronSecret = process.env.CRON_SECRET;
    const headerSecret = req.headers["x-cron-secret"];
    if (cronSecret && typeof headerSecret === "string" && headerSecret === cronSecret) {
      return next();
    }
    return requireAuth(req, res, (err) => {
      if (err) return next(err);
      return requireRole("admin")(req, res, next);
    });
  },
  async (req, res, next) => {
    try {
      const result = await appointmentReminderService.runReminders(req.body || {});
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);
