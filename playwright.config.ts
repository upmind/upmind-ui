import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://qa-automation.local:5173/";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  /* Timeouts */
  timeout: 60000,
  expect: {
    timeout: 30000,
    toHaveScreenshot: { maxDiffPixels: 2000 }
  },

  /*Filepaths*/
  testDir: "./tests/Playwright/e2e/",
  outputDir: "./tests/Playwright/e2e/test-output/test-results",
  testMatch: "**/*.spec.ts",
  snapshotPathTemplate:
    "./tests/Playwright/e2e/snapshots/{testFilePath}/{projectName}/{arg}.png",
  //captureGitInfo: { commit: true, diff: true },

  /*Set number of retries on a failed test*/
  retries: 0,

  /* Run tests in files in parallel */
  //fullyParallel: true,

  /* Reporter to use for test results. See https://playwright.dev/docs/test-reporters */
  reporter: [["html", { outputFolder: "./tests/Playwright/e2e/reports/html" }]],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "pnpm start",
    cwd: "./apps/cart",
    url: baseURL,
    reuseExistingServer: !process.env.CI
  },

  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL,

    /* Setting headless to false will cuse the test runner to open a real browser window for each test (headless:true is the default setting)*/
    headless: true,

    /* Take a screenshot on test failure */
    screenshot: "only-on-failure",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    //video: 'retain-on-failure',

    viewport: { width: 1920, height: 1080 },

    video: {
      mode: "on-first-retry",
      size: { width: 1920, height: 1080 }
    },

    launchOptions: {
      args: ["--disable-animations"]
    }

    // contextOptions: {
    //   reducedMotion: "reduce"
    // }
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chrome",
      use: {
        ...devices["Desktop Chrome"],
        browserName: "chromium",
        headless: true,
        viewport: { width: 1920, height: 1080 },
        launchOptions: {
          args: ["--no-sandbox", "--headless", "--disable-gpu"]
        }
      }
    },
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        browserName: "chromium",
        headless: true,
        viewport: { width: 1920, height: 1080 },
        launchOptions: {
          args: ["--no-sandbox", "--headless", "--disable-gpu"]
        }
      }
    },
    {
      name: "safari",
      use: {
        ...devices["Desktop Safari"],
        browserName: "chromium",
        headless: true,
        viewport: { width: 1920, height: 1080 },
        launchOptions: {
          args: ["--no-sandbox", "--headless", "--disable-gpu"]
        }
      }
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
});
