import { z } from "zod";
import { AppointmentStatusEnum } from "../enums/index.js";

export const CreateAppointmentSchema = z.object({
  patientId: z.string().optional(),
  doctorId: z.string().optional(),
  scheduledAt: z.string(),
  type: z.string().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});
export type CreateAppointment = z.infer<typeof CreateAppointmentSchema>;

export const UpdateAppointmentSchema = z.object({
  status: AppointmentStatusEnum.optional(),
  scheduledAt: z.string().optional(),
  notes: z.string().optional(),
});
export type UpdateAppointment = z.infer<typeof UpdateAppointmentSchema>;
