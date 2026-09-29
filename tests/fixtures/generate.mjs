#!/usr/bin/env node
/**
 * Fixture Generator Runner (ADR 025 §A1.3 / FE-2937)
 *
 * Runs ONE unit's `<unit>.fixtures.ts` generator headlessly against a real API,
 * then auto-runs `lint:fixtures` on the output so a bad / PII-leaking capture
 * fails at the source (FE-2937 decision 5).
 *
 * Usage:
 *   pnpm fixtures:generate <unit>      # e.g. pnpm fixtures:generate query
 *   pnpm fixtures:generate <unit> --scenario "<title>"
 *                                      # re-record ONE scenario, by its title
 *
 * <unit> is the unit's path under `src/modules`. It is a bare name for a flat
 * module (`query`), and a path for one nested below a parent module
 * (`basket-billing/unified`).
 *
 * Requires VITE_API_URL + staging credentials. A module unit's `.env.recording`
 * (e.g. packages/headless/.env.recording) is loaded before the run; we fail
 * loud if VITE_API_URL is still unset.
 *
 * Two generator flavours share this ONE entrypoint (the flavour is an
 * implementation detail of the unit's `<unit>.fixtures.ts`, not a flag here):
 *   (a) direct-API — real `fetch` calls via `Generator` (auth/query/account/…).
 *   (b) headless Playwright — a real chromium session drives a real staging flow
 *       and `playwright-recorder.mjs` captures the browser's traffic through the
 *       SAME pipeline (see `product-setup.fixtures.ts`, FE-2937 mode (b)).
 * Both write v3, PII-masked, co-located fixtures and are linted below.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");
const HEADLESS = join(REPO_ROOT, "packages", "headless");

const unit = process.argv[2];

// `--scenario "<title>"` re-records ONE scenario: the generator's `describe`
// for a scenario is named by that scenario's title, so the title (escaped to a
// literal) is the vitest name filter. Every other test is skipped, and each
// scenario's `prepareScenarioDirs` clears only its OWN folders, so the other
// recordings are left exactly as they are.
const scenarioFlag = process.argv.indexOf("--scenario");
const scenario =
  scenarioFlag === -1 ? undefined : process.argv[scenarioFlag + 1];

if (scenarioFlag !== -1 && !scenario) {
  console.error('[fixtures:generate] --scenario needs a title: --scenario "<title>"');
  process.exit(1);
}

const nameFilter = scenario
  ? ["-t", scenario.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")]
  : [];

if (!unit) {
  console.error("[fixtures:generate] Usage: pnpm fixtures:generate <unit>");
  console.error("  e.g. pnpm fixtures:generate query");
  console.error("  nested: pnpm fixtures:generate basket-billing/unified");
  process.exit(1);
}

// --- locate the unit's generator file (module units only for mode (a)).
//
// A unit name IS its path under `src/modules`, so a unit nested below a parent
// module is named by that path: `basket-billing/unified`. The generator file is
// always named for the LAST segment, which leaves every flat unit (`query`,
// `auth`, …) spelled exactly as before. Resolving by path rather than by search
// keeps the lookup deterministic: two modules may hold a generator of the same
// filename without the name becoming ambiguous.

const segments = unit.split("/").filter(Boolean);
const leaf = segments[segments.length - 1];
const relFixtureFile = [
  "src",
  "modules",
  ...segments,
  "__tests__",
  `${leaf}.fixtures.ts`
].join("/");

const fixtureFile = join(HEADLESS, relFixtureFile);

if (!existsSync(fixtureFile)) {
  console.error(`[fixtures:generate] No generator for unit "${unit}".`);
  console.error(`  Expected: ${fixtureFile}`);
  process.exit(1);
}

// --- load .env.recording into the child process env (set -a equivalent).

const env = { ...process.env, FIXTURE_MODE: "record" };
const envFile = join(HEADLESS, ".env.recording");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!(key in process.env)) env[key] = trimmed.slice(eq + 1).trim();
  }
}

if (!env.VITE_API_URL) {
  console.error(
    "[fixtures:generate] VITE_API_URL is required (set it in " +
      "packages/headless/.env.recording or the environment)."
  );
  process.exit(1);
}

// --- run the generator headlessly via the fixtures-only vitest config.

console.log(
  `[fixtures:generate] Capturing "${unit}"${scenario ? ` scenario "${scenario}"` : ""} against ${env.VITE_API_URL}`
);

const run = spawnSync(
  "pnpm",
  [
    "exec",
    "vitest",
    "run",
    "--config",
    "vitest.fixtures.config.ts",
    ...nameFilter,
    relFixtureFile
  ],
  { cwd: HEADLESS, env, stdio: "inherit" }
);

if (run.status !== 0) {
  console.error(`[fixtures:generate] Generator run failed for "${unit}".`);
  process.exit(run.status ?? 1);
}

// --- auto-lint the output (FE-2937 decision 5): a bad capture fails here.

console.log(`[fixtures:generate] Linting captured fixtures...`);

const lint = spawnSync(
  "node",
  [join(REPO_ROOT, "tests", "fixtures", "lint-fixtures.mjs")],
  { cwd: REPO_ROOT, stdio: "inherit" }
);

process.exit(lint.status ?? 0);
