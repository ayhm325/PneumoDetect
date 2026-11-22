import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:3001";
const URL = BASE + "/ar/doctor/appointments";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  console.log("Opening", URL);
  try {
    const resp = await page.goto(URL, {
      waitUntil: "networkidle",
      timeout: 15000,
    });
    if (!resp || resp.status() >= 400) {
      console.error(
        "Failed to load page, status:",
        resp ? resp.status() : "no response",
      );
      await browser.close();
      process.exit(2);
    }

    // Click the add button by its Arabic text
    const addButton = page.getByRole("button", { name: /إضافة موعد جديد/i });
    await addButton.waitFor({ state: "visible", timeout: 5000 });
    console.log("Clicking Add button");
    await addButton.click();

    // Wait for toast text (Arabic)
    const toastText = "ستنفتح نافذة إضافة الموعد قريبًا.";
    const toast = page.locator(`text=${toastText}`);
    const visible = await toast
      .waitFor({ state: "visible", timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    if (visible) {
      console.log("SUCCESS: Toast appeared with message:", toastText);
      await browser.close();
      process.exit(0);
    } else {
      console.error("FAIL: Toast did not appear");
      // Dump page content for debugging
      const html = await page.content();
      console.error("Page snapshot length:", html.length);
      await browser.close();
      process.exit(3);
    }
  } catch (err) {
    console.error("Error during test:", err);
    await browser.close();
    process.exit(4);
  }
})();
