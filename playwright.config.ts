import { defineConfig, devices } from "@playwright/test";

/**
 * Smoke testleri (tests/e2e) — prod build'e karşı koşar: `npm run build`
 * sonrası `npm run test:e2e` (webServer `next start`'ı kendisi açar).
 * DB'siz ortamda (CI) site data/snapshot fallback'inden render olur; testler
 * bu yüzden içerik adlarına değil akışlara/iskelete asserts eder.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 90_000,
  },
});
