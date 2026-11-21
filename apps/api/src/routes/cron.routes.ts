import { Router } from "express";
import { appointmentReminderService } from "../services/cron/index.js";

export const cronRouter = Router();

cronRouter.post("/cron/appointment-reminders", async (req, res, next) => {
  try {
    const result = await appointmentReminderService.runReminders(req.body || {});
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});
