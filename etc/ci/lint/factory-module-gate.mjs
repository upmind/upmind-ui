#!/usr/bin/env node
// @ts-check
/**
 * The factory's module gate: the checks that STOP a `/factory` composable run
 * (`.claude/workflows/run-factory-composable.js`) at Code, Template review and
 * Verify. A red gate is a stop, never a note to the next seat.
 *
 * WHY THIS EXISTS
 * ---------------
 * MR !616 (FE-3227, tip 91779b28e8) reached a merge request with CI red on
 * lint: 49 `async-discipline/no-promise-try-catch`, `no-direct-tanstack-query`,
 * 2x `owned-endpoint-boundary`. The rules existed; nothing in the lane made a
 * red lint a stop. This script is that stop. Most of it IS the repo lint: the
 * same ESLint and config CI uses, with no suppressions ledger: every
 * pre-existing error in the module is in scope (ruling D8). The script adds only
 * what ESLint cannot see: a new inline suppression in the diff, a must-fail
 * patch outside `__tests__/`, and a diff that leaves the module.
 *
 * GATES (numbered as in docs/sdd/FE-3227/handover-plugin-factory.md, G5)
 * ---------------------------------------------------------------------
 *   1  lint            ESLint over the module exits 0, and the diff adds no
 *                      inline disable of `endpoint-ownership/*` or
 *                      `async-discipline/*` (rule `new-suppression`).
 *   2  one-int-test    `tests/one-replay-int-test`.
 *   3  replay-only     `tests/int-replay-only`, `scope-based/no-hand-rolled-int-fixture`.
 *   4  must-fail-home  every `*.must-fail.patch` in the module sits under
 *                      `__tests__/` (rule `must-fail-outside-tests`).
 *   5  recorder        `tests/fixtures-shared-recorder`.
 *   7  scope           every path the branch changes since its merge base is
 *                      inside the module, the module barrel, or a path passed
 *                      with --allow (rule `diff-outside-scope`). This blocks a
 *                      shared-harness edit, an ADR edit, and a ledger edit.
 * Gates 2, 3 and 5 are ESLint rules, so one ESLint run feeds them; the script
 * only attributes each error to its gate. Every gate runs; the LAST line names
 * the first red gate and its rules.
 *
 * USAGE
 * -----
 *   node etc/ci/lint/factory-module-gate.mjs --module <path> [--base <ref>]
 *        [--allow <path>]... [--root <dir>] [--config <eslint config>]
 *
 *   --module  the module directory, relative to the root (required).
 *   --base    the branch the story forks from (default origin/develop).
 *   --allow   a path the story names explicitly; a directory allows its tree.
 *   --root    the repo or worktree to grade (default: the current directory).
 *   --config  an ESLint config to grade with (default: the root's own). The
 *             known-bad replay passes today's config to grade an old tree.
 *
 * Exit 0 = GREEN. Exit 1 = RED; the last line is
 *   `factory-module-gate: RED gate-<n> <rule>[,<rule>…]`.
 * Exit 2 = usage or environment error (no verdict).
 */

/* global console */

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const SELF = "factory-module-gate";
const MAX_ROWS = 25;
const SCRIPT_REPO = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  ".."
);
const BARREL = "packages/headless/src/modules/index.ts";
const BLOCKER_FAMILIES = /\b(endpoint-ownership|async-discipline)\/[\w-]+/g;

/** ESLint rules owned by a gate other than gate 1. */
const RULE_GATE = {
  "tests/one-replay-int-test": 2,
  "tests/int-replay-only": 3,
  "scope-based/no-hand-rolled-int-fixture": 3,
  "tests/fixtures-shared-recorder": 5
};

const GATES = [
  { n: 1, name: "lint" },
  { n: 2, name: "one-int-test" },
  { n: 3, name: "replay-only" },
  { n: 4, name: "must-fail-home" },
  { n: 5, name: "recorder" },
  { n: 7, name: "scope" }
];

function usage(message) {
  console.error(`[${SELF}] ${message}`);
  process.exit(2);
}

// --- arguments -----------------------------------------------------------------
const opts = {
  module: "",
  base: "origin/develop",
  allow: [],
  root: process.cwd(),
  config: ""
};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i += 1) {
  const key = argv[i];
  const value = argv[i + 1];
  if (value === undefined) usage(`missing value for ${key}`);
  if (key === "--module") opts.module = value;
  else if (key === "--base") opts.base = value;
  else if (key === "--allow") opts.allow.push(value);
  else if (key === "--root") opts.root = value;
  else if (key === "--config") opts.config = value;
  else usage(`unknown argument ${key}`);
  i += 1;
}
if (!opts.module) usage("--module is required");

const root = resolve(opts.root);
const modulePath = opts.module.replace(/\/+$/, "");
const moduleAbs = join(root, modulePath);
if (!existsSync(moduleAbs)) usage(`module not found: ${moduleAbs}`);

function git(args) {
  const res = spawnSync("git", ["-C", root, ...args], {
    encoding: "utf8",
    maxBuffer: 1 << 28
  });
  if (res.status !== 0)
    usage(`git ${args.join(" ")} failed: ${res.stderr.trim()}`);
  return res.stdout;
}

const head = git(["rev-parse", "HEAD"]).trim();
const mergeBase = git(["merge-base", opts.base, "HEAD"]).trim();
const lines = s => s.split("\n").filter(Boolean);
const changed = [
  ...new Set([
    ...lines(git(["diff", "--name-only", mergeBase])),
    ...lines(git(["ls-files", "--others", "--exclude-standard"]))
  ])
];

/** @type {Record<number, string[]>} rows per gate, each `<rule> <where>` */
const rows = { 1: [], 2: [], 3: [], 4: [], 5: [], 7: [] };

// --- gates 1, 2, 3, 5: the repo lint ----------------------------------------------
const localBin = join(root, "node_modules", "eslint", "bin", "eslint.js");
const eslintBin = existsSync(localBin)
  ? localBin
  : join(SCRIPT_REPO, "node_modules", "eslint", "bin", "eslint.js");
if (!existsSync(eslintBin))
  usage(`cannot find ESLint (looked in ${root} and ${SCRIPT_REPO})`);
// The module is graded with NO suppressions ledger: a pre-existing lint error
// in the module is always in scope, and the story fixes it (ruling D8). The
// empty ledger file lives beside this script.
const eslintArgs = [
  eslintBin,
  "--no-warn-ignored",
  "--format",
  "json",
  "--suppressions-location",
  join(SCRIPT_REPO, "etc", "ci", "lint", "no-suppressions.json"),
  "--pass-on-unpruned-suppressions"
];
if (opts.config) eslintArgs.push("--config", resolve(opts.config));
eslintArgs.push(modulePath);
const lint = spawnSync(process.execPath, eslintArgs, {
  cwd: root,
  encoding: "utf8",
  maxBuffer: 1 << 28
});
let results;
try {
  results = JSON.parse(lint.stdout);
} catch {
  usage(
    `ESLint produced no report (exit ${lint.status}): ${lint.stderr.trim().slice(0, 400)}`
  );
}
for (const file of results) {
  const where = relative(root, file.filePath);
  for (const m of file.messages) {
    if (m.severity !== 2 && !m.fatal) continue;
    const rule = m.ruleId ?? "parse-error";
    rows[RULE_GATE[rule] ?? 1].push(`${rule} ${where}:${m.line ?? 0}`);
  }
}

// Gate 1, second half: a suppression the diff adds for a blocker family.
const moduleDiff = git(["diff", "-U0", mergeBase, "--", modulePath]);
let diffFile = "";
for (const line of moduleDiff.split("\n")) {
  if (line.startsWith("+++ ")) diffFile = line.replace(/^\+\+\+ (b\/)?/, "");
  if (!line.startsWith("+") || line.startsWith("+++")) continue;
  if (!line.includes("eslint-disable")) continue;
  for (const match of line.matchAll(BLOCKER_FAMILIES)) {
    rows[1].push(`new-suppression ${diffFile} disables ${match[0]}`);
  }
}

// --- gate 4: must-fail patches live under __tests__/ ---------------------------
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules") continue;
    const abs = join(dir, entry);
    if (statSync(abs).isDirectory()) walk(abs);
    else if (
      entry.endsWith(".must-fail.patch") &&
      !abs.includes("/__tests__/")
    ) {
      rows[4].push(`must-fail-outside-tests ${relative(root, abs)}`);
    }
  }
}
walk(moduleAbs);

// --- gate 7: the diff stays inside the module and the named paths ------------
const allowed = [
  modulePath,
  BARREL,
  ...opts.allow.map(a => a.replace(/\/+$/, ""))
];
const inScope = file =>
  allowed.some(a => file === a || file.startsWith(`${a}/`));
for (const file of changed) {
  if (!inScope(file)) rows[7].push(`diff-outside-scope ${file}`);
}

// --- report ----------------------------------------------------------------------
console.log(
  `${SELF}: module ${modulePath} @ ${head.slice(0, 10)}, base ${opts.base} (${mergeBase.slice(0, 10)}), ${changed.length} changed paths`
);
let firstRed = null;
for (const gate of GATES) {
  const found = rows[gate.n];
  if (!found.length) {
    console.log(`gate-${gate.n} ${gate.name}: GREEN`);
    continue;
  }
  const counts = {};
  for (const row of found) {
    const rule = row.split(" ")[0];
    counts[rule] = (counts[rule] ?? 0) + 1;
  }
  // The blocker families lead, then the rest by count.
  const isBlocker = rule =>
    /^(endpoint-ownership|async-discipline)\//.test(rule);
  const rules = Object.entries(counts).sort(
    (a, b) => Number(isBlocker(b[0])) - Number(isBlocker(a[0])) || b[1] - a[1]
  );
  console.log(
    `gate-${gate.n} ${gate.name}: RED — ${rules.map(([r, c]) => `${r} x${c}`).join(", ")}`
  );
  for (const row of found.slice(0, MAX_ROWS)) console.log(`  ${row}`);
  if (found.length > MAX_ROWS)
    console.log(`  … ${found.length - MAX_ROWS} more`);
  if (!firstRed) firstRed = `gate-${gate.n} ${rules.map(([r]) => r).join(",")}`;
}
if (firstRed) {
  console.log(`${SELF}: RED ${firstRed}`);
  process.exit(1);
}
console.log(`${SELF}: GREEN ${modulePath} @ ${head}`);
