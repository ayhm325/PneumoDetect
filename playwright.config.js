// playwright.config.js

const baseURL = process.env.PW_BASE_URL || "http://localhost:5173";

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  webServer: {
    command: 'npx concurrently "npm run dev:api" "npm run dev:web"',
    url: baseURL,
    timeout: 120 * 1000,
    reuseExistingServer: true,
  },
  testDir: "./playwright-tests",
  use: {
    baseURL,
    trace: "on-first-retry",
    storageState:
      process.env.PW_STORAGE_STATE || "playwright/.auth/patient.json",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
};

export default config;
