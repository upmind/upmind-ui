/// <reference types="node" />
import { defineConfig, devices } from "@playwright/test";
import { createBdd, defineBddConfig, test as base } from "playwright-bdd";
import { STEP_KIND } from "@upmind-automation/scenario-harness";
import { createBrowserWorld } from "./tests/e2e/browser-world";
import { catalogs } from "./tests/e2e/catalogs";
import type { ScenarioKey } from "@upmind-automation/headless/scenarios";
import type {
  StepCatalog,
  StepKind,
  World
} from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------
/**
 * The labs-nuxt BDD lane. Separate from the root `playwright.config.ts` (the
 * cart e2e suite) and from `playwright.bdd.config.ts` (the harness's own
 * in-process fixture lane): this one boots the playground in a browser and
 * drives the SAME `.feature` the in-page world runs.
 *
 * The port is DEDICATED and `reuseExistingServer` is off on purpose — a
 * reused ordinary dev server on the default port publishes no world, so every
 * bridge call would time out with nothing to say why.
 */
// -----------------------------------------------------------------------------

const TEST_PORT = 4100;
const baseURL =
  process.env.PW_BASE_URL ?? `http://labs.localhost:${TEST_PORT}/`;

const testDir = defineBddConfig({
  // A module's feature is colocated with its module source (ADR-027 Am.2),
  // which is why this lane reaches out of the playground to find it.
  features: ["../../packages/*/src/modules/**/*.feature"],
  // The registrations below live in this file, so it doubles as its own
  // "steps" module for playwright-bdd's generation pass.
  steps: "playwright.config.ts",
  outputDir: ".features-gen",
  // Every catalog handler forwards a rest-args tuple, so `Function.length` is
  // always 0 — the documented case for disabling the arity check (the root
  // BDD lane disables it for the same reason).
  arityCheck: false
});

export const test = base.extend<{ world: World<ScenarioKey> }>({
  world: async ({ page }, use) => {
    const world = createBrowserWorld(page);

    await use(world);
    await world.dispose();
  }
});

const bdd = createBdd(test, { worldFixture: "world" });

function registrarFor(kind: StepKind) {
  if (kind === STEP_KIND.GIVEN) return bdd.Given;
  if (kind === STEP_KIND.WHEN) return bdd.When;

  return bdd.Then;
}

/** Re-registers an engine-free catalog against playwright-bdd over the `world` fixture. */
function registerCatalog(catalog: StepCatalog): void {
  for (const step of catalog.steps) {
    registrarFor(step.kind)(step.pattern, function (this: World, ...args) {
      return step.handler(this, ...args);
    });
  }
}

catalogs.forEach(registerCatalog);

export default defineConfig({
  testDir,
  timeout: 60000,
  expect: { timeout: 30000 },
  reporter: "list",
  use: {
    baseURL,
    testIdAttribute: "data-test-key",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    reducedMotion: "reduce"
  },
  webServer: {
    command: `pnpm exec nuxt dev --host labs.localhost --port ${TEST_PORT} --dotenv .env.development`,
    url: baseURL,
    // The world is published in dev only, so a server this config did not
    // start is not a server this lane can drive.
    reuseExistingServer: false,
    timeout: 120000
  },
  projects: [{ name: "chrome", use: { ...devices["Desktop Chrome"] } }]
});
