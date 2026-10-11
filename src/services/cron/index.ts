import { createAppointmentReminderRepository } from "../../repositories/cron/appointmentReminderRepository";
import { createAppointmentReminderService } from "./appointmentReminderService";

const appointmentReminderRepository = createAppointmentReminderRepository();

export const appointmentReminderService = createAppointmentReminderService({
  appointmentReminderRepository,
});
