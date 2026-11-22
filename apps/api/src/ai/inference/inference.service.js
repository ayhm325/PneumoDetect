import crypto from "crypto";
import { preprocessImage } from "../utils/imagePreprocessor.js";
import { getModel } from "./index.js";

function _uuid() {
  if (crypto && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function runInference(file) {
  const prepared = preprocessImage(file);
  const start = Date.now();
  const model = getModel();

  console.info(`[inference.service] using model: ${model?.name || "python"}`);

  const requestHeatmap =
    file.with_heatmap === true || process.env.REQUEST_HEATMAP === "1";

  const json = await model.infer(prepared, {
    with_heatmap: requestHeatmap,
  });

  const end = Date.now();
  const rawPred = String(json.prediction || json.data?.prediction || "").trim().toUpperCase();
  if (rawPred !== "NORMAL" && rawPred !== "PNEUMONIA") {
    const err = new Error(`Invalid or unclassified model prediction: ${rawPred || "empty"}`);
    err.code = "inference_error";
    err.statusCode = 502;
    throw err;
  }

  const probs = json.probabilities || json.data?.probabilities || null;
  let rawConfidence = typeof json.confidence === "number" ? json.confidence : 0;

  if (probs && typeof probs === "object") {
    if (typeof probs[rawPred] === "number") {
      rawConfidence = probs[rawPred];
    } else {
      const numeric = Object.values(probs).filter((v) => typeof v === "number");
      if (numeric.length > 0) {
        rawConfidence = Math.max(...numeric);
      }
    }
  }

  const confidence = Number(rawConfidence);
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    const err = new Error(`Invalid model confidence score: ${rawConfidence}`);
    err.code = "inference_error";
    err.statusCode = 502;
    throw err;
  }

  const threshold = Number(process.env.MODEL_CONFIDENCE_THRESHOLD) || 0.85;
  const needs_review = confidence < threshold;
  const isMock = Boolean(json.is_mock || model?.isMock);

  return {
    analysis_id: json.analysis_id || _uuid(),
    prediction: rawPred,
    confidence,
    probabilities: probs,
    needs_review,
    display_label: needs_review ? "Needs Physician Review" : rawPred,
    explanation: json.explanation ?? "",
    heatmap_url: json.heatmap_url ?? json.heatmapUrl ?? null,
    model_version: json.model_version ?? json.modelVersion ?? model?.name ?? "unknown",
    inference_time_ms: typeof json.inference_time_ms === "number" ? json.inference_time_ms : end - start,
    created_at: new Date().toISOString(),
    is_mock: isMock,
  };
}
