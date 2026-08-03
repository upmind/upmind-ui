#!/usr/bin/env node
// @ts-check
/**
 * FE-2976 deep-review cluster 7 — makes the two `known-bad/*.must-fail.patch`
 * fixtures a machine-enforced negative control instead of README prose.
 *
 * For each `*.must-fail.patch` under `src/__tests__/known-bad/`:
 *   1. `git apply --check` — if the patch no longer applies cleanly against
 *      HEAD, that IS the staleness alarm this script exists to raise; fail
 *      loudly rather than silently skipping it.
 *   2. Apply it, run this package's lint scoped to `packages/scenario-harness`,
 *      and assert the run goes RED naming the specifier the patch itself adds
 *      (extracted from the patch's own `+import ... from "<specifier>"` line —
 *      never hardcoded, so a future patch is covered with no code change here).
 *   3. Revert it (always, even on assertion failure — `finally`) and assert the
 *      run returns to GREEN.
 *
 * Mirrors `.claude/scripts/lint/eslint-workspace.mjs`'s own invocation (cwd =
 * repo root, target = this package, same suppressions-ledger flags) so the
 * verdict this script reads is the exact one `pnpm --filter
 * @upmind-automation/scenario-harness lint` would report.
 */

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PACKAGE_DIR = resolve(SCRIPT_DIR, "..");
const REPO_ROOT = resolve(PACKAGE_DIR, "..", "..");
const KNOWN_BAD_DIR = resolve(PACKAGE_DIR, "src/__tests__/known-bad");
const ESLINT_BIN = resolve(REPO_ROOT, "node_modules/eslint/bin/eslint.js");
const LEDGER = resolve(REPO_ROOT, "eslint-suppressions.json");

const ADDED_IMPORT_LINE = /^\+.*\bfrom\s+["']([^"']+)["']/m;
const PATCH_TARGET_LINE = /^\+\+\+ b\/(.+)$/gm;

function git(args) {
  return execFileSync("git", args, { cwd: REPO_ROOT, encoding: "utf8" });
}

function gitApplyCheck(patchPath) {
  const result = spawnSync("git", ["apply", "--check", patchPath], {
    cwd: REPO_ROOT,
    encoding: "utf8"
  });
  return result.status === 0;
}

function gitApply(patchPath, reverse) {
  git(["apply", ...(reverse ? ["-R"] : []), patchPath]);
}

function runLint() {
  const result = spawnSync(
    process.execPath,
    [
      ESLINT_BIN,
      PACKAGE_DIR,
      "--suppressions-location",
      LEDGER,
      "--pass-on-unpruned-suppressions"
    ],
    { cwd: REPO_ROOT, encoding: "utf8" }
  );
  return {
    exitCode: result.status ?? 1,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`
  };
}

function extractBannedSpecifier(patchText) {
  const match = ADDED_IMPORT_LINE.exec(patchText);
  return match?.[1];
}

function extractPatchTargets(patchText) {
  return [...patchText.matchAll(PATCH_TARGET_LINE)].map(match =>
    resolve(REPO_ROOT, match[1])
  );
}

function assertClean(label, targets) {
  const dirty = git(["status", "--porcelain", "--", ...targets]).trim();
  if (dirty.length > 0) {
    throw new Error(
      `${label}: its own target file(s) have uncommitted changes before this ` +
        `patch was applied — refusing to run against a dirty tree:\n${dirty}`
    );
  }
}

function verifyPatch(patchFile) {
  const patchPath = resolve(KNOWN_BAD_DIR, patchFile);
  const patchText = readFileSync(patchPath, "utf8");
  const specifier = extractBannedSpecifier(patchText);

  if (!specifier) {
    throw new Error(
      `${patchFile}: could not extract a banned import specifier from the ` +
        `patch's own '+...from "..."' line — negative control has nothing to assert.`
    );
  }

  if (!gitApplyCheck(patchPath)) {
    throw new Error(
      `${patchFile}: STALE PATCH — it no longer applies cleanly against HEAD. ` +
        `Regenerate it against the current source (this is the staleness alarm ` +
        `the negative-control lane exists to raise).`
    );
  }

  assertClean(patchFile, extractPatchTargets(patchText));

  gitApply(patchPath, false);

  try {
    const injected = runLint();

    if (injected.exitCode === 0) {
      throw new Error(
        `${patchFile}: expected the lint run to go RED after applying this ` +
          `patch, but it exited 0 (green). The no-vue boundary no longer catches ` +
          `this shape.`
      );
    }
    if (!injected.output.includes(specifier)) {
      throw new Error(
        `${patchFile}: the lint run went red, but its output never named the ` +
          `banned specifier "${specifier}" — cannot confirm it failed for the ` +
          `right reason.\n${injected.output}`
      );
    }

    console.log(`  RED as expected, naming "${specifier}": ${patchFile}`);
  } finally {
    gitApply(patchPath, true);
  }

  const reverted = runLint();
  if (reverted.exitCode !== 0) {
    throw new Error(
      `${patchFile}: expected the lint run to return to GREEN after reverting ` +
        `this patch, but it exited ${reverted.exitCode}.\n${reverted.output}`
    );
  }

  console.log(`  GREEN after revert: ${patchFile}`);
}

function main() {
  if (!existsSync(KNOWN_BAD_DIR)) {
    console.error(
      `[verify-negative-controls] no such directory: ${KNOWN_BAD_DIR}`
    );
    process.exit(1);
  }

  const patches = readdirSync(KNOWN_BAD_DIR).filter(name =>
    name.endsWith(".must-fail.patch")
  );

  if (patches.length === 0) {
    console.error(
      "[verify-negative-controls] found zero *.must-fail.patch fixtures — " +
        "the negative-control lane has nothing to prove."
    );
    process.exit(1);
  }

  let failures = 0;

  for (const patchFile of patches) {
    console.log(`[verify-negative-controls] ${patchFile}`);
    try {
      verifyPatch(patchFile);
    } catch (error) {
      failures += 1;
      console.error(
        `  FAILED: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  if (failures > 0) {
    console.error(
      `[verify-negative-controls] ${failures}/${patches.length} negative control(s) failed.`
    );
    process.exit(1);
  }

  console.log(
    `[verify-negative-controls] all ${patches.length} negative control(s) verified red-then-green.`
  );
}

main();
