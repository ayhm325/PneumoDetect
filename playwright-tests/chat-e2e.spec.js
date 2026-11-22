import { test, expect } from "@playwright/test";

test.use({ storageState: undefined });

test("Doctor and Patient exchange real-time messages without page refresh", async ({ browser }) => {
  const baseURL = process.env.PW_BASE_URL || "http://localhost:5173";

  const doctorContext = await browser.newContext({ baseURL });
  const patientContext = await browser.newContext({ baseURL });

  try {
    const doctorLogin = await doctorContext.request.post("/api/login", {
      data: { email: "doctor@example.com", password: "changeme" },
    });
    expect(doctorLogin.ok()).toBe(true);

    const patientLogin = await patientContext.request.post("/api/login", {
      data: { email: "patient@example.com", password: "changeme" },
    });
    expect(patientLogin.ok()).toBe(true);

    const doctorPage = await doctorContext.newPage();
    const patientPage = await patientContext.newPage();

    const docConsoleErrors = [];
    const patConsoleErrors = [];
    doctorPage.on("pageerror", (e) => docConsoleErrors.push(e.message));
    patientPage.on("pageerror", (e) => patConsoleErrors.push(e.message));

    await Promise.all([
      doctorPage.goto("/doctor/chat", { waitUntil: "networkidle" }),
      patientPage.goto("/patient/chat", { waitUntil: "networkidle" }),
    ]);

    // Select the seeded patient conversation on the Doctor workspace
    const patientRow = doctorPage.locator("aside button", { hasText: /Patient|patient@example\.com/i }).first();
    await expect(patientRow).toBeVisible({ timeout: 15000 });
    await patientRow.click();

    // Wait for both chat composers to be ready
    const docInput = doctorPage.locator("textarea").first();
    const patInput = patientPage.locator("textarea").first();
    await expect(docInput).toBeVisible({ timeout: 10000 });
    await expect(patInput).toBeVisible({ timeout: 10000 });

    const ts = Date.now();
    const docText = `E2E-Doc-${ts}`;
    const patText = `E2E-Pat-${ts}`;

    // 1. Doctor sends message -> Patient sees it immediately without refresh
    await docInput.fill(docText);
    await docInput.press("Enter");

    await expect(doctorPage.locator("p", { hasText: docText })).toBeVisible({ timeout: 10000 });
    await expect(patientPage.locator("p", { hasText: docText })).toBeVisible({ timeout: 10000 });

    // 2. Patient replies -> Doctor sees it immediately without refresh
    await patInput.fill(patText);
    await patInput.press("Enter");

    await expect(patientPage.locator("p", { hasText: patText })).toBeVisible({ timeout: 10000 });
    await expect(doctorPage.locator("p", { hasText: patText })).toBeVisible({ timeout: 10000 });

    // 3. REST fallback broadcast check: Patient sends via REST -> Doctor sees it immediately without refresh
    const patChatsRes = await patientContext.request.get("/api/chat/patient");
    expect(patChatsRes.ok()).toBe(true);
    const patChatsJson = await patChatsRes.json();
    const chatId = patChatsJson?.chats?.[0]?.id;
    expect(chatId).toBeTruthy();

    const restText = `E2E-REST-${ts}`;
    const restSendRes = await patientContext.request.post(`/api/chat/${chatId}/messages`, {
      data: { text: restText, clientKey: `e2e-rest-${ts}` },
    });
    expect(restSendRes.ok()).toBe(true);

    await expect(doctorPage.locator("p", { hasText: restText })).toBeVisible({ timeout: 10000 });

    expect(docConsoleErrors).toEqual([]);
    expect(patConsoleErrors).toEqual([]);
  } finally {
    await doctorContext.close();
    await patientContext.close();
  }
});
