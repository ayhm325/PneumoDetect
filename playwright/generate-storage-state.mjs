import fs from "node:fs";
import path from "node:path";
import { request } from "@playwright/test";

const baseURL = process.env.PW_BASE_URL || "http://localhost:5173";
const storageStatePath =
  process.env.PW_STORAGE_STATE || "playwright/.auth/patient.json";
const email = process.env.E2E_PATIENT_EMAIL || "patient@example.com";
const password = process.env.E2E_PATIENT_PASSWORD || "changeme";

async function main() {
  fs.mkdirSync(path.dirname(storageStatePath), { recursive: true });

  const apiContext = await request.newContext({ baseURL });

  try {
    const loginRes = await apiContext.post("/api/login", {
      data: { email, password },
    });

    if (!loginRes.ok()) {
      const body = await loginRes.text().catch(() => "");
      throw new Error(
        `Patient login failed (${loginRes.status()} ${loginRes.statusText()}): ${body}`,
      );
    }

    const whoamiRes = await apiContext.get("/api/auth/whoami");
    if (!whoamiRes.ok()) {
      throw new Error(
        `Session validation (/api/auth/whoami) failed with status ${whoamiRes.status()}`,
      );
    }

    const whoami = await whoamiRes.json();
    if (!whoami?.id || whoami?.role !== "patient") {
      throw new Error(
        `Unexpected /api/auth/whoami payload: ${JSON.stringify(whoami)}`,
      );
    }

    await apiContext.storageState({ path: storageStatePath });
    console.log(
      `Saved Playwright storage state for ${whoami.email || email} to ${storageStatePath}`,
    );
  } finally {
    await apiContext.dispose();
  }
}

main().catch((err) => {
  console.error("generate-storage-state error:", err?.message || err);
  process.exit(1);
});
