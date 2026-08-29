import { defineConfig, devices } from "@playwright/test";

const localBaseUrl = process.env.APP_ORIGIN ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests",
  testMatch: ["e2e/**/*.spec.ts", "accessibility/**/*.test.ts"],
  outputDir: "./test-results/playwright",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  reporter: process.env.CI
    ? [
        ["line"],
        ["junit", { outputFile: "test-results/playwright/results.xml" }],
      ]
    : [["line"]],
  use: {
    baseURL: localBaseUrl,
    actionTimeout: 5_000,
    navigationTimeout: 10_000,
    serviceWorkers: "block",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    locale: "en-IN",
    timezoneId: "Asia/Kolkata",
  },
  projects: [
    {
      name: "chromium-supplemental",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
