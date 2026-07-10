/// <reference types="node" />
import { execSync } from "node:child_process";
import { defineConfig, devices } from "@playwright/test";

// The e2e suite runs the cart in test mode (`window.Upmind` bridge) on a
// DEDICATED port so it never collides with a normal `pnpm dev` server on 5173
// — a reused non-test-mode server has no bridge and every headless helper
// times out. Keep this port distinct from the dev default.
const TEST_PORT = 4000;
const baseURL =
  process.env.PW_BASE_URL ?? `http://qa-automation.local:${TEST_PORT}/`;

function git(args: string): string | undefined {
  try {
    return execSync(`git ${args}`, { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return undefined;
  }
}

const isCI = Boolean(process.env.CI);
const branch =
  process.env.CI_COMMIT_REF_NAME ||
  process.env.GITHUB_REF_NAME ||
  process.env.GIT_BRANCH ||
  git("rev-parse --abbrev-ref HEAD") ||
  "unknown";
const commit =
  process.env.CI_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  process.env.GIT_COMMIT ||
  git("rev-parse HEAD") ||
  "unknown";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  /* Timeouts */
  timeout: 60000,
  expect: {
    timeout: 30000,
    toHaveScreenshot: {
      maxDiffPixels: 2000,
      threshold: 0.15,
      animations: "disabled"
    }
  },

  /*Filepaths*/
  testDir: "./tests/Playwright/e2e/",
  outputDir: "./tests/Playwright/e2e/test-output/test-results",
  testMatch: "**/*.spec.ts",
  testIgnore: [
    "**/node_modules/**",
    "tests/fixtures/**",
    "**/*.int.test.ts",
    "tests/Playwright/specs/**"
  ],
  snapshotPathTemplate:
    "./tests/Playwright/e2e/snapshots/{testFilePath}/{projectName}/{arg}.png",
  globalTeardown: "./tests/Playwright/scripts/global-teardown.ts",
  //captureGitInfo: { commit: true, diff: true },

  /*Set number of retries on a failed test*/
  retries: 1,

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Reporter to use for test results. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ["html", { outputFolder: "./tests/Playwright/e2e/reports/html" }],
    [
      "allure-playwright",
      {
        resultsDir: "./tests/Playwright/e2e/reports/allure-results",
        detail: true,
        suiteTitle: true,
        environmentInfo: {
          source: isCI ? "ci" : "local",
          branch,
          commit,
          node: process.version,
          os: process.platform
        }
      }
    ]
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    // Invoke vite directly — `pnpm start:test -- --port` leaks a stray `--`
    // that vite ignores, booting on the 5173 default (see run-e2e.sh).
    command: `pnpm exec vite --mode test --port ${TEST_PORT} --strictPort`,
    cwd: "./apps/cart",
    url: baseURL,
    // run-e2e.sh owns server lifecycle (frees the port, starts THIS build,
    // tears it down) in every env, so always reuse the instance it started;
    // gating on !CI made Playwright throw "port already used" in CI.
    reuseExistingServer: true
  },

  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL,

    testIdAttribute: "data-test-key", //

    /* Setting headless to false will cuse the test runner to open a real browser window for each test (headless:true is the default setting)*/
    headless: true,

    /* Take a screenshot on test failure */
    screenshot: "only-on-failure",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    //video: 'retain-on-failure',

    viewport: { width: 1920, height: 1080 },

    // Video is off by default; opt in for triage with PW_VIDEO=1.
    video: process.env.PW_VIDEO
      ? { mode: "on", size: { width: 1920, height: 1080 } }
      : "off",

    // Emulate prefers-reduced-motion so the app skips animations/transitions —
    // faster renders and no waiting on animation frames. Replaces the deleted
    // "--disable-animations" launch arg (which was not a real Chromium flag).
    reducedMotion: "reduce"
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
        //locale: "en", ** Turning this on for a project will default to en locale (instead of en_US) and bypass any localazy sync issues
        launchOptions: {
          args: [
            "--no-sandbox",
            "--headless",
            "--disable-gpu",
            "--font-render-hinting=none"
          ]
        }
      }
    },
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        browserName: "firefox",
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
        browserName: "webkit",
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
