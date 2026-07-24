#!/usr/bin/env node
// @ts-check
/**
 * FE-2842 Tranche 0 — convergence guard.
 *
 * Locks the invariant that EVERY lint entrypoint resolves the same suppression
 * state (see .claude/scripts/lint/eslint-workspace.mjs for why cwd matters). Run in CI
 * (`pnpm lint:verify`) so the ledger can't silently stop applying to per-package
 * lint again.
 *
 * Two checks:
 *   1. STATIC — every managed (non-submodule) workspace package whose package.json
 *      has a `lint` script must invoke the shared wrapper verbatim. A revert to
 *      `eslint . --fix` (cwd = package → ledger ignored) fails here immediately.
 *   2. DYNAMIC — for one representative package it compares the count ESLint
 *      reports via the package's OWN wrapper script (cwd = package) against the
 *      authoritative root-cwd run (cwd = repo root + explicit ledger flags). They
 *      must be identical. This catches a broken wrapper even if the script string
 *      still looks right.
 *
 * Git-submodule packages (packages/ui, packages/types, apps/hosting, apps/velia)
 * are reported as a KNOWN BOUNDARY, not a failure: the parent repo cannot edit
 * their package.json without submodule churn, so the same one-line change must
 * land in each submodule's own repo. The guard flags any that still use the
 * legacy script so the boundary stays visible.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(scriptDir, "..", "..", "..");
const ESLINT_BIN = resolve(REPO_ROOT, "node_modules/eslint/bin/eslint.js");
const LEDGER = resolve(REPO_ROOT, "eslint-suppressions.json");

const WRAPPER_BASENAME = ".claude/scripts/lint/eslint-workspace.mjs";
// Workspace globs that can contain a linted package (mirrors pnpm-workspace.yaml).
const WORKSPACE_GLOBS = ["packages", "apps", "playgrounds"];
// Workspace entries that ARE a package themselves (pnpm-workspace.yaml lists
// them directly, not via a glob). Inert until they grow a lint script.
const DIRECT_PACKAGES = ["docs", "tests/fixtures"];
const DYNAMIC_SAMPLE = "playgrounds/labs";

/** Canonical `lint` script for a package at the given repo-relative path. */
function canonicalLint(relPath) {
  const depth = relPath.split("/").length; // packages/x → 2 → ../../
  return `node ${"../".repeat(depth)}${WRAPPER_BASENAME}`;
}

/** Parse .gitmodules → set of submodule paths (repo-relative). */
function readSubmodulePaths() {
  const set = new Set();
  const file = join(REPO_ROOT, ".gitmodules");
  if (!existsSync(file)) return set;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*path\s*=\s*(.+?)\s*$/);
    if (m) set.add(m[1]);
  }
  return set;
}

/** Enumerate every workspace package dir that has a package.json. */
function listPackageDirs() {
  const dirs = [];
  for (const direct of DIRECT_PACKAGES) {
    const abs = join(REPO_ROOT, direct);
    if (existsSync(join(abs, "package.json"))) dirs.push(abs);
  }
  for (const glob of WORKSPACE_GLOBS) {
    const base = join(REPO_ROOT, glob);
    if (!existsSync(base)) continue;
    for (const entry of readdirSync(base, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const abs = join(base, entry.name);
      if (existsSync(join(abs, "package.json"))) dirs.push(abs);
    }
  }
  return dirs;
}

/** Count ESLint errors+warnings from a JSON run. Returns {e,w} or null. */
function eslintCount(cwd, extraArgs) {
  const r = spawnSync(
    process.execPath,
    [ESLINT_BIN, ...extraArgs, "-f", "json"],
    { cwd, encoding: "utf8", maxBuffer: 1e9 }
  );
  try {
    let e = 0;
    let w = 0;
    for (const f of JSON.parse(r.stdout)) {
      e += f.errorCount || 0;
      w += f.warningCount || 0;
    }
    return { e, w };
  } catch {
    return null;
  }
}

const submodulePaths = readSubmodulePaths();
const failures = [];
const boundary = [];
let managedChecked = 0;

console.log("FE-2842 lint-convergence guard\n");

// -- Check 1: static ---------------------------------------------------------
for (const abs of listPackageDirs()) {
  const relPath = relative(REPO_ROOT, abs).split("\\").join("/");
  let pkg;
  try {
    pkg = JSON.parse(readFileSync(join(abs, "package.json"), "utf8"));
  } catch {
    continue;
  }
  const lint = pkg.scripts && pkg.scripts.lint;
  if (!lint) continue; // no lint entrypoint → nothing to converge

  const isSubmodule = [...submodulePaths].some(
    p => relPath === p || relPath.startsWith(`${p}/`)
  );
  if (isSubmodule) {
    boundary.push({ relPath, lint });
    continue;
  }

  managedChecked++;
  const want = canonicalLint(relPath);
  if (lint !== want) {
    failures.push(
      `  ${relPath}: lint script is ${JSON.stringify(lint)}\n` +
        `      expected ${JSON.stringify(want)} (must route through the shared wrapper)`
    );
  }

  // lint:fix mutates rather than gates, but a package-cwd `eslint . --fix`
  // would still apply a divergent suppression state — keep it on the wrapper.
  const lintFix = pkg.scripts && pkg.scripts["lint:fix"];
  if (lintFix && !lintFix.includes(WRAPPER_BASENAME)) {
    failures.push(
      `  ${relPath}: lint:fix script is ${JSON.stringify(lintFix)}\n` +
        `      expected it to route through ${WRAPPER_BASENAME} (e.g. ${JSON.stringify(`${want} --fix`)})`
    );
  }
}

console.log(
  `[static] ${managedChecked} managed package(s) checked, ` +
    `${failures.length} drifted.`
);

// -- Check 2: dynamic --------------------------------------------------------
const sampleAbs = join(REPO_ROOT, DYNAMIC_SAMPLE);
if (existsSync(sampleAbs)) {
  // Authoritative reference: explicit ledger flags, cwd = repo root.
  const direct = eslintCount(REPO_ROOT, [
    DYNAMIC_SAMPLE,
    "--suppressions-location",
    LEDGER,
    "--pass-on-unpruned-suppressions"
  ]);
  // What the package's own wrapper script produces, cwd = package.
  const viaWrapper = spawnSync(
    process.execPath,
    [resolve(REPO_ROOT, WRAPPER_BASENAME), "-f", "json"],
    { cwd: sampleAbs, encoding: "utf8", maxBuffer: 1e9 }
  );
  let wrapperCount = null;
  try {
    let e = 0;
    let w = 0;
    for (const f of JSON.parse(viaWrapper.stdout)) {
      e += f.errorCount || 0;
      w += f.warningCount || 0;
    }
    wrapperCount = { e, w };
  } catch {
    /* leave null */
  }

  if (!direct || !wrapperCount) {
    failures.push(
      `  [dynamic] could not obtain ESLint counts for ${DYNAMIC_SAMPLE} ` +
        `(direct=${JSON.stringify(direct)} wrapper=${JSON.stringify(wrapperCount)})`
    );
  } else if (direct.e !== wrapperCount.e || direct.w !== wrapperCount.w) {
    failures.push(
      `  [dynamic] ${DYNAMIC_SAMPLE} DIVERGES: ` +
        `root-cwd=e${direct.e}/w${direct.w} vs wrapper=e${wrapperCount.e}/w${wrapperCount.w}`
    );
  } else {
    console.log(
      `[dynamic] ${DYNAMIC_SAMPLE} converges: ` +
        `root-cwd == wrapper == e${direct.e}/w${direct.w}.`
    );
  }
} else {
  console.log(`[dynamic] sample ${DYNAMIC_SAMPLE} not checked out — skipped.`);
}

// -- Report ------------------------------------------------------------------
if (boundary.length) {
  console.log("\n[boundary] submodule packages the parent repo cannot rewire:");
  for (const b of boundary) {
    const ok = /eslint-workspace\.mjs/.test(b.lint);
    console.log(
      `  ${b.relPath}: ${JSON.stringify(b.lint)} ${ok ? "(already wired)" : "(legacy — fix in its own repo)"}`
    );
  }
}

if (failures.length) {
  console.error(
    "\nFAIL — lint entrypoints have diverged:\n" + failures.join("\n")
  );
  process.exit(1);
}

console.log(
  "\nPASS — every managed lint entrypoint resolves the shared ledger."
);
