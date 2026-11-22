import { expect, test } from "@playwright/test";

// Minimal 1x1 valid PNG bytes for X-ray upload E2E verification
const SAMPLE_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=";

test.describe("Patient X-Ray Analysis E2E", () => {
  test("authenticated patient can open dashboard, analyze an X-ray, and view history", async ({
    page,
  }) => {
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
    expect(analyzeJson).toHaveProperty("prediction");

    await page.goto("/patient/analysis/history");
    await expect(page).toHaveURL(/\/patient\/analysis\/history/);
    await expect(page.locator("main")).toBeVisible();
  });
});
