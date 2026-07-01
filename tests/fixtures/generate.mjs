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
 *
 * Requires VITE_API_URL + staging credentials. A module unit's `.env.recording`
 * (e.g. packages/headless/.env.recording) is loaded before the run; we fail
 * loud if VITE_API_URL is still unset.
 *
 * Mode (a) direct-API only. Mode (b) headless Playwright journey capture is
 * deferred to FE-2935.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");
const HEADLESS = join(REPO_ROOT, "packages", "headless");

const unit = process.argv[2];

if (!unit) {
  console.error("[fixtures:generate] Usage: pnpm fixtures:generate <unit>");
  console.error("  e.g. pnpm fixtures:generate query");
  process.exit(1);
}

// --- locate the unit's generator file (module units only for mode (a)).

const fixtureFile = join(
  HEADLESS,
  "src",
  "modules",
  unit,
  "__tests__",
  `${unit}.fixtures.ts`
);

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

console.log(`[fixtures:generate] Capturing "${unit}" against ${env.VITE_API_URL}`);

const run = spawnSync(
  "pnpm",
  [
    "exec",
    "vitest",
    "run",
    "--config",
    "vitest.fixtures.config.ts",
    `src/modules/${unit}/__tests__/${unit}.fixtures.ts`
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
