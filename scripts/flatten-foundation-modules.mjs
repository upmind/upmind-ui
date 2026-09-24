#!/usr/bin/env node
// Flattens `packages/modules-foundation/src/modules/<unit>/` up one level, to
// `src/<unit>/`. Discovers the units from disk, so it runs unchanged on every
// phase branch. Idempotent: a second run reports nothing to do.
//
// Three edits, and nothing else:
//   1. git mv each unit directory up one level
//   2. the barrel's `./modules/<unit>` specifiers lose the `modules/` segment
//   3. unit __tests__ files reaching `../../../` now reach `../../`
//
// Sibling imports are NOT rewritten and must not be: both ends move together,
// so `../icon` keeps its meaning. There is no `../../` anywhere in the tree —
// that is the one depth whose meaning would change silently — and the script
// refuses to run if one appears, rather than guessing.

import { execFileSync } from "node:child_process";
import {
  existsSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  statSync
} from "node:fs";
import { join } from "node:path";

const DRY = process.argv.includes("--dry-run");
const PKG = "packages/modules-foundation";
const SRC = `${PKG}/src`;
const MODULES = `${SRC}/modules`;

const git = (...args) =>
  execFileSync("git", args, { encoding: "utf8" }).trimEnd();

const repoRoot = git("rev-parse", "--show-toplevel");
process.chdir(repoRoot);

let units;
try {
  units = readdirSync(MODULES).filter((n) =>
    statSync(join(MODULES, n)).isDirectory()
  );
} catch {
  console.log(`nothing to do: ${MODULES} does not exist`);
  process.exit(0);
}

const tracked = git("ls-files", MODULES).split("\n").filter(Boolean);

// The refusal check, before any write.
const twoLevel = tracked.filter((f) =>
  /from\s+["']\.\.\/\.\.\/(?!\.\.)/.test(readFileSync(f, "utf8"))
);
if (twoLevel.length > 0) {
  console.error(
    "REFUSING: these files import with `../../`, whose meaning changes when the\n" +
      "unit moves up a level. Resolve each by hand, then re-run:\n  " +
      twoLevel.join("\n  ")
  );
  process.exit(1);
}

console.log(`units: ${units.length} (${units.join(", ")})`);
console.log(`tracked files under modules/: ${tracked.length}`);

// 1. Move.
for (const u of units) {
  const from = `${MODULES}/${u}`;
  const to = `${SRC}/${u}`;
  console.log(`  mv ${from} -> ${to}`);
  if (!DRY) git("mv", from, to);
}

// 2. The barrel.
const barrel = `${SRC}/index.ts`;
const before = readFileSync(barrel, "utf8");
const after = before.replace(/(["'])\.\/modules\//g, "$1./");
const barrelRefs = (before.match(/["']\.\/modules\//g) ?? []).length;
console.log(`  ${barrel}: ${barrelRefs} refs`);
if (!DRY && after !== before) writeFileSync(barrel, after);

// 3. The escaping test imports, at their new paths.
let escaped = 0;
// On a dry run the files are still at their old paths, so read there and report
// the path each one WILL have.
const pairs = DRY
  ? tracked.map((f) => [f, f.replace(`${MODULES}/`, `${SRC}/`)])
  : git("ls-files", SRC)
      .split("\n")
      .filter(Boolean)
      .map((f) => [f, f]);
for (const [readPath, reportPath] of pairs) {
  const text = readFileSync(readPath, "utf8");
  const n = (text.match(/["']\.\.\/\.\.\/\.\.\//g) ?? []).length;
  if (n === 0) continue;
  escaped += n;
  console.log(`  ${reportPath}: ${n} escaping import(s)`);
  if (!DRY)
    writeFileSync(readPath, text.replace(/(["'])\.\.\/\.\.\/\.\.\//g, "$1../../"));
}

// 4. `eslint-suppressions.json` keys on the file path, so every suppression for
//    a moved file goes stale silently — the rule fires again and reads as new.
const SUPPRESSIONS = "eslint-suppressions.json";
let suppressed = 0;
if (existsSync(SUPPRESSIONS)) {
  const before = readFileSync(SUPPRESSIONS, "utf8");
  const after = before.replaceAll(`"${MODULES}/`, `"${SRC}/`);
  suppressed = (before.match(new RegExp(`"${MODULES}/`, "g")) ?? []).length;
  if (suppressed > 0) {
    console.log(`  ${SUPPRESSIONS}: ${suppressed} key(s)`);
    if (!DRY) writeFileSync(SUPPRESSIONS, after);
  }
}

console.log(
  `\n${DRY ? "would move" : "moved"}: ${units.length} units · ` +
    `barrel refs: ${barrelRefs} · escaping imports: ${escaped} · ` +
    `suppression keys: ${suppressed}`
);
console.log(
  "next: run the package's tests, `vue-tsc -b`, and a repo-wide sweep for\n" +
    "`modules-foundation/src/modules` — it must return zero."
);
