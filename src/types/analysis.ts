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
  explanation?: string;
  heatmap_url?: string | null;
  heatmapUrl?: string | null;
  model_version?: string;
  modelVersion?: string;
  inference_time_ms?: number;
  inferenceTimeMs?: number;
  created_at?: string;
  createdAt?: string;
};

export type NormalizedInferenceResult = {
  analysisId: string | null;
  prediction: string;
  confidence: number;
  explanation: string;
  heatmapUrl: string | null;
  modelVersion: string;
  inferenceTimeMs: number;
  createdAt: string;
};

export type SaveAnalysisInput = {
  userId: string;
  imageUrl: string;
  analysisData: NormalizedInferenceResult;
};

export type AnalyzeXrayCommand = {
  userId: string;
  image: UploadImageInput;
};

export type AnalyzeXrayResult = {
  success: true;
  data: unknown;
  saved: boolean;
  saveError?: string;
};
