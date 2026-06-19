import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 5000);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "public/e2e-report", open: "never" }],
    ["./e2e/manifest-reporter.ts"],
  ],
  outputDir: "public/e2e-results",
  use: {
    baseURL,
    trace: "retain-on-failure",
    video: {
      mode: "on",
      size: { width: 1280, height: 720 },
    },
    screenshot: "only-on-failure",
    viewport: { width: 1280, height: 720 },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
