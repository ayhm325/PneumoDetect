import { z } from "zod";
import { AnalysisPredictionEnum } from "../enums/index.js";

export const PredictRequestSchema = z.object({
  image_base64: z.string().min(1),
  with_heatmap: z.boolean().optional().default(false),
});
export type PredictRequest = z.infer<typeof PredictRequestSchema>;

export const PredictResponseSchema = z.object({
  prediction: AnalysisPredictionEnum.or(z.string()),
  confidence: z.number(),
  probabilities: z.record(z.string(), z.number()).optional(),
  heatmap_url: z.string().nullable().optional(),
  model_version: z.string().optional(),
  inference_time_ms: z.number().optional(),
});
export type PredictResponse = z.infer<typeof PredictResponseSchema>;

export const AnalysisResultItemSchema = z.object({
  id: z.string(),
  patientId: z.string().nullable().optional(),
  doctorId: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  heatmapUrl: z.string().nullable().optional(),
  prediction: z.string(),
  confidence: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  createdAt: z.string(),
});
export type AnalysisResultItem = z.infer<typeof AnalysisResultItemSchema>;
