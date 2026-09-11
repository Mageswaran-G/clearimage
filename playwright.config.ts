import { defineConfig, devices } from "@playwright/test";

// This container ships a pre-installed Chromium at a fixed path instead of
// the revision @playwright/test would otherwise try to download.
const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "Desktop Chrome",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: { executablePath },
      },
    },
    {
      name: "Mobile Chrome",
      use: {
        ...devices["Pixel 7"],
        launchOptions: { executablePath },
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
