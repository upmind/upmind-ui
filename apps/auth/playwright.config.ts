import { defineConfig, devices } from "@playwright/test";

// A dedicated port, distinct from the dev default (5173) and from the app's own
// dev port (5183), so a running dev server is never displaced by a test run.
const PORT = 5291;
// The API resolves the brand from the Origin header, so the served host has to
// be a domain a brand exists for — not `localhost`. Add it to /etc/hosts.
const HOST = process.env.AUTH_E2E_HOST ?? "qa-automation.local";
const baseURL = `http://${HOST}:${PORT}`;

// Built and previewed, not `vite dev`: the fact under test is what the shipped
// bundle asks the API for, and a dev server serves a different module graph.
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  timeout: 120000,
  webServer: {
    command: `pnpm exec vite build --mode test && pnpm exec vite preview --port ${PORT} --host ${HOST} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 240000,
    stdout: "pipe",
    stderr: "pipe"
  },
  use: {
    baseURL,
    trace: "retain-on-failure"
  },
  projects: [{ name: "chrome", use: { ...devices["Desktop Chrome"] } }]
});
