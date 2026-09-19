import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 0,
  workers: 2,
  timeout: 45000,
  expect: { timeout: 10000 },
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3000", trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev -- --webpack",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120000,
  },
});
