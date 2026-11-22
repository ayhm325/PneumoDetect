export type UploadImageInput = {
  name?: string | null;
  type?: string | null;
  buffer: Buffer;
  withHeatmap?: boolean;
};

export type RunInferenceInput = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
  with_heatmap?: boolean;
};

export type RawInferenceResult = {
  analysis_id?: string;
  analysisId?: string;
  prediction?: string;
  confidence?: number | string;
  probabilities?: Record<string, number> | null;
  needs_review?: boolean;
  needsReview?: boolean;
  display_label?: string;
  displayLabel?: string;
  explanation?: string;
  heatmap_url?: string | null;
  heatmapUrl?: string | null;
  model_version?: string;
  modelVersion?: string;
  inference_time_ms?: number;
  inferenceTimeMs?: number;
  created_at?: string;
  createdAt?: string;
  is_mock?: boolean;
};

export type NormalizedInferenceResult = {
  analysisId: string | null;
  prediction: string;
  confidence: number;
  probabilities: Record<string, number> | null;
  needsReview: boolean;
  displayLabel: string;
  explanation: string;
  heatmapUrl: string | null;
  modelVersion: string;
  inferenceTimeMs: number;
  createdAt: string;
  isMock: boolean;
};

export type SaveAnalysisInput = {
  userId: string;
  patientId?: string | null;
  uploadedByUserId?: string | null;
  uploadedByRole?: string | null;
  uploadNotes?: string | null;
  reviewStatus?: string;
  imageUrl: string;
  analysisData: NormalizedInferenceResult;
};

export type AnalyzeXrayCommand = {
  userId: string;
  role?: string;
  patientId?: string;
  modality?: string;
  notes?: string;
  image: UploadImageInput;
};

export type AnalyzeXrayResult = {
  success: true;
  data: unknown;
  saved: boolean;
  saveError?: string;
  prediction?: string;
  confidence?: number;
  probabilities?: Record<string, number> | null;
  needs_review?: boolean;
  display_label?: string;
  heatmap_url?: string | null;
  model_version?: string;
  inference_time_ms?: number;
  is_mock?: boolean;
};
