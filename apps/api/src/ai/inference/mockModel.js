import crypto from "crypto";

const POSSIBLE_PREDICTIONS = ["PNEUMONIA", "NORMAL"];

export async function runMockModel(_imageBuffer, _opts = {}) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Mock model cannot execute in production");
  }

  await new Promise((resolve) => setTimeout(resolve, 150));

  const prediction = POSSIBLE_PREDICTIONS[Math.floor(Math.random() * POSSIBLE_PREDICTIONS.length)];
  const primaryProb = Number((Math.random() * (0.95 - 0.75) + 0.75).toFixed(4));
  const secondaryProb = Number((1 - primaryProb).toFixed(4));
  const probabilities =
    prediction === "PNEUMONIA"
      ? { NORMAL: secondaryProb, PNEUMONIA: primaryProb }
      : { NORMAL: primaryProb, PNEUMONIA: secondaryProb };

  return {
    analysis_id: crypto.randomUUID(),
    prediction,
    confidence: primaryProb,
    probabilities,
    explanation: "[SIMULATED MOCK OUTPUT — NOT A REAL MEDICAL ANALYSIS]",
    heatmap_url: null,
    model_version: "mock-simulator-dev-only",
    inference_time_ms: 150,
    is_mock: true,
  };
}
