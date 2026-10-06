#!/usr/bin/env node
// etc/ci/lint/factory-module-gate.selftest.mjs
//
// Selftest for etc/ci/lint/factory-module-gate.mjs (prover seat).
//
// Assertions are written against the gate's documented contract only (its
// file header and etc/ci/lint/fixtures/factory-module-gate/README.md +
// fixture.json). Each case drives the real gate process as a black box.
//
//   known-bad-mr616   - the MR !616 fixture, replayed from its commit: exit 1,
//                       first red gate is gate-1, the output names the
//                       blocker-family rules, and every gate the fixture lists
//                       as red is RED.
//   pre-existing      - the client-email module, unchanged, on this branch's
//                       commit: RED at gate 1, because its ledger-held errors
//                       are in scope (ruling D8).
//   gate-1-lint       - an ESLint error in the module is RED at gate 1 only.
//   gate-1-suppress   - a diff that adds an inline disable of a blocker-family
//                       rule is RED at gate 1 as `new-suppression`.
//   gate-2 .. gate-7  - one constructed case per gate, RED for that gate's own
//                       reason with every other gate GREEN, plus the paired
//                       green control where the contract names one.
//
// Usage:
//   node etc/ci/lint/factory-module-gate.selftest.mjs             # every case
//   node etc/ci/lint/factory-module-gate.selftest.mjs --case <id> # one case

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..", "..");
const GATE = path.join(HERE, "factory-module-gate.mjs");
const FIXTURE_DIR = path.join(HERE, "fixtures", "factory-module-gate");
const KNOWN_GOOD_MODULE = "packages/headless/src/modules/client-email";
const DEMO = "packages/headless/src/modules/demo";
const BARREL = "packages/headless/src/modules/index.ts";
const GATE_NUMBERS = [1, 2, 3, 4, 5, 7];

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function out(res) {
  return `${res.stdout || ""}\n${res.stderr || ""}`;
}

function sh(cmd, args, cwd) {
  const res = spawnSync(cmd, args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 1 << 28
  });
  assert(
    res.status === 0,
    `precondition failed: ${cmd} ${args.join(" ")}\n${out(res)}`
  );
  return res.stdout;
}

function runGate(args, cwd = REPO) {
  return spawnSync(process.execPath, [GATE, ...args], {
    cwd,
    encoding: "utf8",
    maxBuffer: 1 << 28
  });
}

function gateStatuses(text) {
  const map = {};
  for (const m of text.matchAll(/^gate-(\d+) [\w-]+: (GREEN|RED)\b/gm)) {
    map[Number(m[1])] = m[2];
  }
  return map;
}

function lastLine(text) {
  return text.trim().split("\n").pop();
}

function assertOnlyRed(res, redGate, ruleOrRow) {
  const text = out(res);
  assert(
    res.status === 1,
    `expected exit 1 (RED), got ${res.status}\n${text}`
  );
  const statuses = gateStatuses(text);
  for (const n of GATE_NUMBERS) {
    const want = n === redGate ? "RED" : "GREEN";
    assert(
      statuses[n] === want,
      `expected gate-${n} ${want}, got ${statuses[n]} (RED for its own reason only)\n${text}`
    );
  }
  assert(
    lastLine(text).startsWith(`factory-module-gate: RED gate-${redGate} `),
    `last line must name the first red gate gate-${redGate}, got: ${lastLine(text)}`
  );
  assert(
    text.includes(ruleOrRow),
    `output must name "${ruleOrRow}" for gate-${redGate}\n${text}`
  );
}

function assertGreen(res) {
  const text = out(res);
  assert(res.status === 0, `expected exit 0 (GREEN), got ${res.status}\n${text}`);
  const statuses = gateStatuses(text);
  for (const n of GATE_NUMBERS) {
    assert(statuses[n] === "GREEN", `expected gate-${n} GREEN\n${text}`);
  }
  assert(
    lastLine(text).startsWith("factory-module-gate: GREEN"),
    `last line must be GREEN, got: ${lastLine(text)}`
  );
}

const requireFromRepo = createRequire(path.join(REPO, "package.json"));
const PARSER_URL = pathToFileURL(
  requireFromRepo.resolve("@typescript-eslint/parser")
).href;
const PLUGIN_URL = pathToFileURL(
  path.join(REPO, "packages", "eslint-plugin-tests", "index.mjs")
).href;

const ESLINT_CONFIG = `import tsParser from ${JSON.stringify(PARSER_URL)};
import testsPlugin from ${JSON.stringify(PLUGIN_URL)};

export default [
  {
    files: ["**/*.ts"],
    languageOptions: { parser: tsParser, ecmaVersion: "latest", sourceType: "module" },
    plugins: { tests: testsPlugin },
    rules: {
      "no-var": "error",
      "tests/one-replay-int-test": "error",
      "tests/int-replay-only": "error"
    }
  },
  {
    files: ["**/*.fixtures.ts"],
    plugins: { tests: testsPlugin },
    rules: { "tests/fixtures-shared-recorder": "error" }
  }
];
`;

const GOOD_RECORDER = `import { Generator } from "@upmind-automation/test-fixtures/generator";
import { mintClientToken } from "../../auth/__tests__/auth.tokens";

export const recorder = [Generator, mintClientToken];
`;

const GOOD_FILES = {
  [`${DEMO}/demo.ts`]: `export const demo = 1;\n`,
  [`${DEMO}/__tests__/demo.replay.int.test.ts`]: `export const replay = 1;\n`,
  [`${DEMO}/__tests__/demo.fixtures.ts`]: GOOD_RECORDER
};

function write(dir, files) {
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(dir, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  }
}

function commitAll(dir, message) {
  sh("git", ["add", "-A"], dir);
  sh("git", ["commit", "-q", "-m", message], dir);
}

// A scratch repo: branch `base` holds the lint config and the barrel; branch
// `feature` adds the demo module plus `files` on top of it.
function withRepo(files, fn, gateExtra = []) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "fmg-selftest-"));
  try {
    sh("git", ["init", "-q", "-b", "base"], dir);
    sh("git", ["config", "user.email", "selftest@example.invalid"], dir);
    sh("git", ["config", "user.name", "selftest"], dir);
    write(dir, {
      "eslint.config.mjs": ESLINT_CONFIG,
      [BARREL]: `export {};\n`
    });
    commitAll(dir, "base");
    sh("git", ["checkout", "-q", "-b", "feature"], dir);
    write(dir, { ...GOOD_FILES, ...files });
    commitAll(dir, "feature");
    return fn(dir, args => runGate(["--root", dir, "--base", "base", ...gateExtra, ...args]));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function withWorktree(ref, fetchCmd, fn) {
  const root = path.join(REPO, ".claude", "worktrees");
  fs.mkdirSync(root, { recursive: true });
  const parent = fs.mkdtempSync(path.join(root, "fmg-selftest-"));
  const dir = path.join(parent, "tree");
  const have = spawnSync("git", ["-C", REPO, "cat-file", "-e", `${ref}^{commit}`]);
  if (have.status !== 0 && fetchCmd) {
    const [cmd, ...rest] = fetchCmd.split(" ");
    sh(cmd, rest, REPO);
  }
  sh("git", ["-C", REPO, "worktree", "add", "--detach", dir, ref], REPO);
  try {
    return fn(dir);
  } finally {
    spawnSync("git", ["-C", REPO, "worktree", "remove", "--force", dir]);
    fs.rmSync(parent, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// Known-bad: replayed exactly as the fixture README prescribes.
// ---------------------------------------------------------------------------
function caseKnownBad() {
  const fixture = JSON.parse(
    fs.readFileSync(
      path.join(FIXTURE_DIR, "known-bad-1-mr616-affiliate", "fixture.json"),
      "utf8"
    )
  );
  withWorktree(fixture.ref, fixture.fetch, dir => {
    const res = runGate(
      [
        "--root",
        dir,
        "--module",
        fixture.module,
        "--base",
        fixture.base,
        "--config",
        path.join(REPO, "eslint.config.mjs")
      ],
      REPO
    );
    const text = out(res);
    assert(
      res.status === fixture.expect.exit,
      `expected exit ${fixture.expect.exit}, got ${res.status}\n${text}`
    );
    const last = lastLine(text);
    assert(
      last.startsWith(`factory-module-gate: RED ${fixture.expect.firstRed} `),
      `last line must name ${fixture.expect.firstRed}, got: ${last}`
    );
    const named = last.split(" ").pop().split(",");
    for (const rule of fixture.expect.firstRedRules) {
      assert(
        named.includes(rule),
        `last line must name rule ${rule}, got: ${last}`
      );
      assert(text.includes(rule), `output must name rule ${rule}`);
    }
    const statuses = gateStatuses(text);
    for (const n of fixture.expect.red) {
      assert(statuses[n] === "RED", `fixture lists gate-${n} RED, got ${statuses[n]}\n${text}`);
    }
  });
}

// ---------------------------------------------------------------------------
// Pre-existing errors are in scope: client-email on a clean checkout of this
// branch's commit has lint errors the suppressions ledger holds. The gate
// ignores the ledger (ruling D8), so it goes RED at gate 1 with no diff at all.
// ---------------------------------------------------------------------------
function caseKnownGood() {
  withWorktree("HEAD", "", dir => {
    const res = runGate(
      [
        "--root",
        dir,
        "--module",
        KNOWN_GOOD_MODULE,
        "--base",
        "HEAD",
        "--config",
        path.join(REPO, "eslint.config.mjs")
      ],
      REPO
    );
    assertOnlyRed(res, 1, "explicit-function-return-type");
  });
}

// ---------------------------------------------------------------------------
// Constructed cases: one per gate.
// ---------------------------------------------------------------------------
function caseConstructedGreen() {
  withRepo({}, (_dir, run) => assertGreen(run(["--module", DEMO])));
}

function caseGate1Lint() {
  withRepo({ [`${DEMO}/bad.ts`]: `var x = 1;\nexport { x };\n` }, (_d, run) =>
    assertOnlyRed(run(["--module", DEMO]), 1, "no-var")
  );
}

function caseGate1Suppression() {
  withRepo(
    {
      [`${DEMO}/quiet.ts`]: `// eslint-disable-next-line async-discipline/no-promise-try-catch\nexport const quiet = 1;\n`
    },
    (_d, run) => {
      const res = run(["--module", DEMO]);
      assert(res.status === 1, `expected exit 1, got ${res.status}\n${out(res)}`);
      const text = out(res);
      assert(
        /gate-1 lint: RED/.test(text) && text.includes("new-suppression"),
        `gate-1 must be RED with new-suppression\n${text}`
      );
      assert(
        text.includes("async-discipline/no-promise-try-catch"),
        `gate-1 row must name the disabled rule\n${text}`
      );
    }
  );
}

function caseGate1SuppressionOtherRuleAllowed() {
  withRepo(
    {
      [`${DEMO}/quiet.ts`]: `// eslint-disable-next-line no-var\nvar y = 1;\nexport { y };\n`
    },
    (_d, run) => assertGreen(run(["--module", DEMO]))
  );
}

function caseGate2() {
  withRepo({ [`${DEMO}/__tests__/demo.int.test.ts`]: `export const a = 1;\n` }, (_d, run) =>
    assertOnlyRed(run(["--module", DEMO]), 2, "tests/one-replay-int-test")
  );
}

function caseGate3() {
  withRepo(
    {
      [`${DEMO}/__tests__/demo.replay.int.test.ts`]: `import { http } from "msw";\nhttp.get("/api/demo", () => null);\n`
    },
    (_d, run) => assertOnlyRed(run(["--module", DEMO]), 3, "tests/int-replay-only")
  );
}

function caseGate4() {
  withRepo({ [`${DEMO}/demo.must-fail.patch`]: `--- a\n+++ b\n` }, (_d, run) =>
    assertOnlyRed(run(["--module", DEMO]), 4, "must-fail-outside-tests")
  );
}

function caseGate4HomeIsGreen() {
  withRepo(
    { [`${DEMO}/__tests__/demo.replay.int.must-fail.patch`]: `--- a\n+++ b\n` },
    (_d, run) => assertGreen(run(["--module", DEMO]))
  );
}

function caseGate5() {
  withRepo({ [`${DEMO}/__tests__/demo.fixtures.ts`]: `export const a = 1;\n` }, (_d, run) =>
    assertOnlyRed(run(["--module", DEMO]), 5, "tests/fixtures-shared-recorder")
  );
}

function caseGate7() {
  withRepo({ "packages/headless/src/shared.ts": `export const s = 1;\n` }, (_d, run) =>
    assertOnlyRed(
      run(["--module", DEMO]),
      7,
      "diff-outside-scope packages/headless/src/shared.ts"
    )
  );
}

function caseGate7AllowAndBarrel() {
  withRepo(
    {
      "packages/headless/src/shared.ts": `export const s = 1;\n`,
      [BARREL]: `export * from "./demo";\n`
    },
    (_d, run) =>
      assertGreen(run(["--module", DEMO, "--allow", "packages/headless/src/shared.ts"]))
  );
}

// ---------------------------------------------------------------------------
const CASES = [
  { id: "known-bad-mr616-red-gate-1", fn: caseKnownBad },
  { id: "pre-existing-errors-in-scope-red", fn: caseKnownGood },
  { id: "constructed-clean-green", fn: caseConstructedGreen },
  { id: "gate-1-lint-red", fn: caseGate1Lint },
  { id: "gate-1-new-suppression-red", fn: caseGate1Suppression },
  { id: "gate-1-other-rule-suppression-green", fn: caseGate1SuppressionOtherRuleAllowed },
  { id: "gate-2-one-int-test-red", fn: caseGate2 },
  { id: "gate-3-replay-only-red", fn: caseGate3 },
  { id: "gate-4-must-fail-outside-tests-red", fn: caseGate4 },
  { id: "gate-4-must-fail-under-tests-green", fn: caseGate4HomeIsGreen },
  { id: "gate-5-recorder-red", fn: caseGate5 },
  { id: "gate-7-diff-outside-scope-red", fn: caseGate7 },
  { id: "gate-7-allow-and-barrel-green", fn: caseGate7AllowAndBarrel }
];

function main() {
  const args = process.argv.slice(2);
  const idx = args.indexOf("--case");
  const only = idx !== -1 ? args[idx + 1] : null;
  const toRun = only ? CASES.filter(c => c.id === only) : CASES;
  if (only && toRun.length === 0) {
    console.error(
      `FAIL: unknown --case "${only}". Known cases: ${CASES.map(c => c.id).join(", ")}`
    );
    process.exit(1);
  }
  let failures = 0;
  for (const c of toRun) {
    const startedAt = Date.now();
    try {
      c.fn();
      console.log(`PASS  ${c.id}  ${Date.now() - startedAt}ms`);
    } catch (err) {
      failures += 1;
      console.error(`FAIL  ${c.id}  ${Date.now() - startedAt}ms\n  ${err.message}`);
    }
  }
  console.log(
    `\n${toRun.length - failures}/${toRun.length} factory-module-gate.selftest.mjs cases passed`
  );
  process.exit(failures ? 1 : 0);
}

main();
