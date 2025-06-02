import { defineConfig, devices } from "@playwright/test";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  /*Filepaths*/
  testDir: "./e2e/e2e-tests",
  outputDir: "./e2e/e2e-tests/test-results",
  testMatch: "**/*.spec.ts",
  snapshotPathTemplate: "./e2e/snapshots/{testFileDir}/{arg}-{projectName}.png",
  /*Set number of retries on a failed test*/
  //retries: 2,
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Reporter to use for test results. See https://playwright.dev/docs/test-reporters */
  reporter: [["html", { outputFolder: "./e2e/e2e-tests/playwright-report" }]],

  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "http://collabstudio.local:5173/",
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    //video: 'retain-on-failure',
  },

  /* Timeouts */
  expect: {
    timeout: 10_000,
  },
  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },

    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
