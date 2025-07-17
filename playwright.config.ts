import { defineConfig, devices } from "@playwright/test";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  /* Timeouts */
  timeout: 60000,
  expect: {
    timeout: 30000
  },

  /*Filepaths*/
  testDir: "./tests/Playwright/e2e/e2e-tests",
  outputDir: "./tests/Playwright/e2e/test-output/test-results",
  testMatch: "**/*.spec.ts",
  snapshotPathTemplate:
    "./tests/Playwright/e2e/snapshots/{arg}-{projectName}.png",

  /*Set number of retries on a failed test*/
  //retries: 2,

  /* Run tests in files in parallel */
  fullyParallel: false,

  /* Reporter to use for test results. See https://playwright.dev/docs/test-reporters */
  reporter: [["html", { outputFolder: "./tests/Playwright/e2e/reports/html" }]],

  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "http://qa-automation.local:5173/",

    /* Setting headless to false will cuse the test runner to open a real browser window for each test (headless:true is the default setting)*/
    headless: true,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry"
    //video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    },

    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] }
    },

    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] }
    }

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
  ]

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
