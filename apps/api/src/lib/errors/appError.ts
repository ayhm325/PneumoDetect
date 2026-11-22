export type ErrorCode =
  | "unauthenticated"
  | "invalid_token"
  | "invalid_token_payload"
  | "token_revoked"
  | "revocation_check_unavailable"
  | "missing_file"
  | "missing_id"
  | "invalid_file_type"
  | "invalid_modality"
  | "unsupported_dicom"
  | "missing_patient_id"
  | "invalid_image"
  | "model_unavailable"
  | "inference_timeout"
  | "file_too_large"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "validation_error"
  | "repository_error"
  | "inference_error"
  | "server_error";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(params: {
    code: ErrorCode;
    message: string;
    statusCode: number;
    details?: unknown;
    cause?: unknown;
  }) {
    super(params.message);
    this.name = "AppError";
    this.code = params.code;
    this.statusCode = params.statusCode;
    this.details = params.details;

    if (params.cause && (this as Error & { cause?: unknown }).cause === undefined) {
      (this as Error & { cause?: unknown }).cause = params.cause;
    }
  }
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  return new AppError({
    code: "server_error",
    message: "Internal server error",
    statusCode: 500,
    cause: error,
  });
}
