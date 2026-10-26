import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  workers: 2,
  use: {
    baseURL: "http://127.0.0.1:4173",
    locale: "fr-FR",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: ["chromium", "firefox", "webkit"].flatMap((browserName) =>
    [false, true].map((mobile) => ({
      name: `${browserName}-${mobile ? "mobile" : "desktop"}`,
      use: {
        browserName,
        viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
        hasTouch: mobile,
        ...(browserName === "chromium" && process.env.CHROMIUM_EXECUTABLE_PATH
          ? { launchOptions: { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } }
          : {}),
      },
    })),
  ),
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
  },
});
