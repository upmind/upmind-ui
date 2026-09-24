#!/usr/bin/env node
// @ts-check
/**
 * Renames the domain package directories to `modules-<name>` and rewrites every path reference.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DRY_RUN = process.argv.includes("--dry-run");

const PACKAGES = [
  "auth",
  "basket",
  "catalogue",
  "client",
  "domain",
  "foundation",
  "invoice",
  "payment",
  "product",
  "recommendations"
];

const EXCLUDED_TREES = [
  "design-system/",
  "packages/types/",
  "docs/published-docs/",
  "apps/hosting/",
  "apps/velia/",
  ".agent/",
  "graphify-out/"
];

const EXCLUDED_FILES = [
  "pnpm-workspace.yaml",
  // pnpm rewrites the importer keys itself on the next install.
  "pnpm-lock.yaml",
  "scripts/rename-domain-packages.mjs"
];

const NAMES = PACKAGES.join("|");
// The trailing boundary keeps `packages/client` off `packages/client-vue`.
const ABSOLUTE_REF = new RegExp(`packages/(${NAMES})(?![A-Za-z0-9_-])`, "g");
// `../<name>` refs between the ten, only in package-root files: elsewhere `../auth` is a module.
const SIBLING_REF = new RegExp(`\\.\\./(${NAMES})(?![A-Za-z0-9_-])`, "g");
const SIBLING_SCOPE = /^packages\/[^/]+\/[^/]+$/;

function git(args) {
  return execFileSync("git", args, { cwd: REPO_ROOT, encoding: "utf8" });
}

function isExcluded(relPath) {
  if (EXCLUDED_FILES.includes(relPath)) return true;
  return EXCLUDED_TREES.some(tree => relPath.startsWith(tree));
}

function isRewritableFile(absPath) {
  const stat = statSync(absPath);
  if (!stat.isFile() || stat.size > 8 * 1024 * 1024) return false;
  return !readFileSync(absPath).subarray(0, 8000).includes(0);
}

const report = {
  renamed: [],
  alreadyRenamed: [],
  missing: [],
  rewritten: [],
  patchesNeedingRegeneration: [],
  rosterFixOutstanding: null
};

// -----------------------------------------------------------------------------
// 1. The directory moves.
// -----------------------------------------------------------------------------
for (const name of PACKAGES) {
  const from = `packages/${name}`;
  const to = `packages/modules-${name}`;

  if (existsSync(resolve(REPO_ROOT, to))) {
    report.alreadyRenamed.push(to);
    continue;
  }
  if (!existsSync(resolve(REPO_ROOT, from))) {
    report.missing.push(from);
    continue;
  }
  if (!DRY_RUN) git(["mv", from, to]);
  report.renamed.push(`${from} -> ${to}`);
}

// -----------------------------------------------------------------------------
// 2. The path rewrites, over tracked files only.
// -----------------------------------------------------------------------------
const tracked = git(["ls-files", "-z"]).split("\0").filter(Boolean);

for (const relPath of tracked) {
  if (isExcluded(relPath)) continue;

  const absPath = resolve(REPO_ROOT, relPath);
  if (!existsSync(absPath) || !isRewritableFile(absPath)) continue;

  const original = readFileSync(absPath, "utf8");

  if (relPath.endsWith(".must-fail.patch")) {
    ABSOLUTE_REF.lastIndex = 0;
    if (ABSOLUTE_REF.test(original))
      report.patchesNeedingRegeneration.push(relPath);
    continue;
  }

  let refs = (original.match(ABSOLUTE_REF) ?? []).length;
  let updated = original.replace(ABSOLUTE_REF, "packages/modules-$1");
  if (SIBLING_SCOPE.test(relPath)) {
    refs += (original.match(SIBLING_REF) ?? []).length;
    updated = updated.replace(SIBLING_REF, "../modules-$1");
  }
  if (updated === original) continue;

  if (!DRY_RUN) writeFileSync(absPath, updated);
  report.rewritten.push({ path: relPath, refs });
}

// -----------------------------------------------------------------------------
// 3. The two seams this script reports rather than attempts.
// -----------------------------------------------------------------------------
const eslintConfig = resolve(REPO_ROOT, "eslint.config.mjs");
if (existsSync(eslintConfig)) {
  const source = readFileSync(eslintConfig, "utf8");
  const hasRoster = source.includes("DOMAIN_PACKAGES");
  const isFixed =
    source.includes("SHARED_BASE_DIR") &&
    /\.map\(dir => \(\{ dir, name/.test(source);
  report.rosterFixOutstanding = hasRoster && !isFixed;
}

// -----------------------------------------------------------------------------
// 4. Report.
// -----------------------------------------------------------------------------
const line = "-".repeat(72);
console.log(`[rename-domain-packages]${DRY_RUN ? " DRY RUN" : ""}`);
console.log(line);
console.log(`renamed directories:        ${report.renamed.length}/10`);
for (const entry of report.renamed) console.log(`  ${entry}`);
if (report.alreadyRenamed.length > 0) {
  console.log(`already at the new path:    ${report.alreadyRenamed.length}`);
  for (const entry of report.alreadyRenamed) console.log(`  ${entry}`);
}
if (report.missing.length > 0) {
  console.log(`absent on this branch:      ${report.missing.length}`);
  for (const entry of report.missing) console.log(`  ${entry}`);
}

const refCount = report.rewritten.reduce((total, f) => total + f.refs, 0);
console.log(line);
console.log(
  `files rewritten:            ${report.rewritten.length} (${refCount} refs)`
);
for (const f of report.rewritten) console.log(`  ${f.path}  (${f.refs})`);

console.log(line);
console.log("NOT DONE BY THIS SCRIPT — both fail silently if skipped:");
if (report.rosterFixOutstanding === true) {
  console.log(
    "  [ ] eslint.config.mjs ADR 023 roster still conflates directory with"
  );
  console.log(
    "      package name. Apply the plan's §4 fix: { dir, name } pairs, name"
  );
  console.log("      read from each manifest, plus the roster-name guard.");
} else if (report.rosterFixOutstanding === false) {
  console.log(
    "  [x] eslint.config.mjs roster already carries { dir, name } pairs."
  );
} else {
  console.log(
    "  [?] eslint.config.mjs carries no ADR 023 roster on this branch."
  );
}

if (report.patchesNeedingRegeneration.length > 0) {
  console.log(
    `  [ ] ${report.patchesNeedingRegeneration.length} must-fail patch(es) still name a moved path.`
  );
  console.log(
    "      Regenerate each per the plan's §5 A7: re-apply the mutation, `git"
  );
  console.log(
    "      diff` it out, revert, then prove it applies, reds, and reverts green."
  );
  for (const p of report.patchesNeedingRegeneration) console.log(`      ${p}`);
} else {
  console.log("  [x] no must-fail patch names a moved path.");
}

console.log(line);
if (report.rewritten.length > 0) {
  console.log(
    "Reformat the files above — the longer paths change prettier's wrapping:"
  );
  console.log(
    `  pnpm exec prettier --write ${report.rewritten.map(f => f.path).join(" ")}`
  );
  console.log(line);
}
console.log("Then, in order: pnpm install · rm -rf packages/modules-*/dist");
console.log(
  "packages/modules-*/*.tsbuildinfo · pnpm exec tsc -b tsconfig.json --dry"
);
console.log(
  "Grade every gate by an executed COUNT. `pnpm --filter` matching nothing"
);
console.log("exits 0, so an exit code cannot tell success from an empty lane.");
