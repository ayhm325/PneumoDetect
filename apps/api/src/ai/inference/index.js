import { runMockModel } from "./mockModel.js";
import { runPyModel } from "./pyModel.js";

export function isMockEnabled() {
  const isProduction = process.env.NODE_ENV === "production";
  const rawUseMock = String(process.env.AI_USE_MOCK || "").trim().toLowerCase();
  if (isProduction) {
    if (rawUseMock === "true") {
      throw new Error("AI_USE_MOCK=true is strictly forbidden in production");
    }
    return false;
  }
  return rawUseMock === "true";
}

export const useMock = isMockEnabled();

export function getModel() {
  if (isMockEnabled()) {
    return {
      infer: async (prepared, opts = {}) => {
        return await runMockModel(prepared.buffer, opts);
      },
      name: "mock",
      isMock: true,
    };
  }

  return {
    infer: async (prepared, opts = {}) => {
      return await runPyModel(prepared, opts);
    },
    name: "python",
    isMock: false,
  };
}
