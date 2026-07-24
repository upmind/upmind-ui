#!/usr/bin/env node
// @ts-check
/**
 * FE-2842 Tranche 0 — the single authoritative ESLint entrypoint.
 *
 * WHY THIS EXISTS
 * ---------------
 * `eslint-suppressions.json` (ESLint 9 native bulk-suppressions ledger) lives at
 * the monorepo root, and ESLint resolves it — and computes every suppression key
 * as a path RELATIVE TO `process.cwd()`. The ledger's keys are therefore
 * root-relative (e.g. "packages/headless/src/…"). Consequences:
 *
 *   • Run from the repo root  → keys match  → the ledger is applied.  ✅
 *   • Run from a package dir  → keys are package-relative → NO match → ledger
 *     silently ignored, so every suppressed violation reports as a live error. ❌
 *
 * The old per-package script was `eslint . --fix`, invoked by `pnpm -r lint` /
 * `pnpm --filter <pkg> lint` with cwd = the package directory. That path never
 * saw the ledger, so per-package lint disagreed with a root `eslint .` run on the
 * same tree (~1,005 suppressed violations reported as errors in one, zero in the
 * other). Pointing `--suppressions-location` at the root file from a package cwd
 * is NOT enough — the relative-key mismatch remains. The only fix is to run
 * ESLint with cwd = repo root regardless of who invoked it.
 *
 * WHAT THIS DOES
 * --------------
 * Every managed package's `lint`/`lint:fix` script calls this wrapper. It:
 *   1. Locates the repo root from its own location (.claude/scripts/lint/../../..).
 *   2. Uses the INVOKING directory (process.cwd()) as the lint target, so
 *      `pnpm --filter <pkg> lint` lints just that package and a root run lints
 *      the whole tree — but ESLint always executes with cwd = repo root, so the
 *      ledger's root-relative keys always match.
 *   3. Passes `--suppressions-location <root>/eslint-suppressions.json` explicitly
 *      (belt-and-braces; cwd-root discovery would already find it) and
 *      `--pass-on-unpruned-suppressions` — REQUIRED, because a package-scoped run
 *      only touches one package's files, so every OTHER package's ledger entry is
 *      "unused" for that invocation and would otherwise exit 2. Ledger staleness /
 *      regeneration is a separate concern (FE-2842 Decision B) handled by
 *      re-running with `--prune-suppressions`; this wrapper deliberately never
 *      mutates the ledger.
 *   4. Forwards all extra CLI args (e.g. `--fix`, `-f json`) to ESLint verbatim.
 *      No `--fix` is added by default — a lint GATE must not mutate the tree.
 *
 * This wrapper is THE single source of truth: every lint entrypoint (root
 * `pnpm lint`, `pnpm -r lint`, `pnpm --filter <pkg> lint`, CI) routes through it,
 * so they all resolve the identical suppression state. `.claude/scripts/lint/
 * verify-lint-convergence.mjs` guards that invariant.
 *
 * SUBMODULE BOUNDARY: packages/ui, apps/hosting, apps/velia are git submodules
 * whose package.json lives in a separate repo; their `lint` scripts must adopt
 * this same wrapper in their own repos (the parent cannot edit them without
 * submodule churn). Until then, only THOSE packages' `--filter` runs diverge; a
 * whole-tree root run still suppresses them correctly (their files are in the
 * tree and their keys match).
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(scriptDir, "..", "..", "..");
const ESLINT_BIN = resolve(REPO_ROOT, "node_modules/eslint/bin/eslint.js");
const LEDGER = resolve(REPO_ROOT, "eslint-suppressions.json");

// The directory ESLint was asked to lint = wherever the invoking `pnpm` script
// ran (the package dir under `--filter`/`-r`, or the repo root for a root run).
// Captured as an absolute path so it stays correct after we switch cwd to root.
const target = process.cwd();

if (!existsSync(ESLINT_BIN)) {
  console.error(
    `[eslint-workspace] cannot find ESLint at ${ESLINT_BIN} — run pnpm install at the repo root.`
  );
  process.exit(1);
}

const args = [
  ESLINT_BIN,
  target,
  "--suppressions-location",
  LEDGER,
  "--pass-on-unpruned-suppressions",
  // Everything the caller passed (e.g. --fix, -f json) is appended verbatim.
  ...process.argv.slice(2)
];

const result = spawnSync(process.execPath, args, {
  cwd: REPO_ROOT,
  stdio: "inherit"
});

if (result.error) {
  console.error(`[eslint-workspace] failed to spawn ESLint:`, result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
