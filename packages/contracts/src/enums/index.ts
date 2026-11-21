import { z } from "zod";

export const RoleEnum = z.enum(["admin", "doctor", "patient"]);
export type Role = z.infer<typeof RoleEnum>;

export const DoctorStatusEnum = z.enum(["active", "suspended", "pending", "banned"]);
export type DoctorStatus = z.infer<typeof DoctorStatusEnum>;

export const PatientStatusEnum = z.enum(["active", "inactive", "suspended"]);
export type PatientStatus = z.infer<typeof PatientStatusEnum>;

export const ClinicalStatusEnum = z.enum(["stable", "critical", "recovering"]);
export type ClinicalStatus = z.infer<typeof ClinicalStatusEnum>;

export const AppointmentStatusEnum = z.enum(["scheduled", "completed", "cancelled"]);
export type AppointmentStatus = z.infer<typeof AppointmentStatusEnum>;

export const AnalysisPredictionEnum = z.enum(["Pneumonia", "Normal", "Uncertain"]);
export type AnalysisPrediction = z.infer<typeof AnalysisPredictionEnum>;
