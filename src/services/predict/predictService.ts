import { AppError } from "../../lib/errors/appError";

export interface PredictService {
  forwardPrediction(input: { payload: unknown }): Promise<{ status: number; body: unknown }>;
}

export function createPredictService(): PredictService {
  return {
    async forwardPrediction(input) {
      const modelUrl = process.env.PY_MODEL_URL || "http://127.0.0.1:8000/predict";

      let response: Response;
      try {
        response = await fetch(modelUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input.payload ?? {}),
        });
      } catch (error) {
        throw new AppError({
          code: "inference_error",
          message: "model_unreachable",
          statusCode: 502,
          cause: error,
        });
      }

      let body: unknown;
      try {
        body = await response.json();
      } catch {
        body = { error: "invalid_model_response" };
      }

      return { status: response.status, body };
    },
  };
}
