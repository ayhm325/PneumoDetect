import { expect, test } from "@playwright/test";

// Valid 64x64 grayscale PNG bytes for DenseNet121 X-ray upload E2E verification
const SAMPLE_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAAAAACPAi4CAAAAQUlEQVR4nO3QsREAIAzDQOHJGZ0iTIA7TmpSxcWvTVfKfxxAAzTQYAplcQAN0AANNJhCWRxAAzRAAw2m3PvcBwMHQHQBAD+VHygAAAAASUVORK5CYII=";

test.use({ storageState: undefined });

test.describe("Patient X-Ray Analysis E2E", () => {
  test("authenticated patient can open dashboard, analyze an X-ray, and view history", async ({
    page,
    context,
  }) => {
    const loginRes = await context.request.post("/api/login", {
      data: { email: "patient@example.com", password: "changeme" },
    });
    expect(loginRes.ok()).toBe(true);

    await page.goto("/patient/dashboard");
    await expect(page).toHaveURL(/\/patient\/dashboard/);
    await expect(page.locator("main")).toBeVisible();

    await page.goto("/patient/analysis");
    await expect(page).toHaveURL(/\/patient\/analysis/);

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "chest-xray-e2e.png",
      mimeType: "image/png",
      buffer: Buffer.from(SAMPLE_PNG_BASE64, "base64"),
    });

    const analyzeResponsePromise = page.waitForResponse(
      (res) =>
        res.url().includes("/api/analysis/analyze") &&
        res.request().method() === "POST",
    );

    const submitButton = page.locator('button[type="submit"], button').filter({
      hasText: /تحليل|Analyze/i,
    }).first();
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    const analyzeResponse = await analyzeResponsePromise;
    expect(analyzeResponse.status()).toBe(200);
    const analyzeJson = await analyzeResponse.json();
    expect(analyzeJson.success).toBe(true);
    if (analyzeJson.is_mock) {
      expect(analyzeJson.saved).toBe(false);
    } else {
      expect(analyzeJson.saved).toBe(true);
    }
    expect(["NORMAL", "PNEUMONIA"]).toContain(analyzeJson.prediction);
    expect(analyzeJson.data?.id).toBeTruthy();

    await page.goto("/patient/analysis/history");
    await expect(page).toHaveURL(/\/patient\/analysis\/history/);
    await expect(page.locator("main")).toBeVisible();
  });
});
