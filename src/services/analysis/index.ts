import { runInference } from "../../../ai/inference/inference.service.js";
import { createAnalysisResultRepository } from "../../repositories/analysis/analysisResultRepository";
import { createMedicalRecordRepository } from "../../repositories/analysis/medicalRecordRepository";
import { createNotificationRepository } from "../../repositories/analysis/notificationRepository";
import { createPatientRepository } from "../../repositories/analysis/patientRepository";
import { createAnalysisService } from "./analysisService";
import { createAnalysisHistoryService } from "./analysisHistoryService";

const analysisResultRepository = createAnalysisResultRepository();
const patientRepository = createPatientRepository();
const medicalRecordRepository = createMedicalRecordRepository();
const notificationRepository = createNotificationRepository();

export const analysisService = createAnalysisService({
  runInference,
  analysisResultRepository,
  patientRepository,
  medicalRecordRepository,
  notificationRepository,
});

export const analysisHistoryService = createAnalysisHistoryService({
  analysisResultRepository,
});
