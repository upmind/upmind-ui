#!/usr/bin/env node
// docs/corpus/gates/gate-api-drift.selftest.mjs
//
// Selftest + negative controls for docs/corpus/gates/gate-api-drift.mjs
// — FE-2752 T10 (prover seat).
//
// Authored by the prover seat, a separate invocation from the gate author
// (seat-separation.md / ADR-021 test-writer != code-writer clause — cited, not
// restated). Assertions written against the *public* contract only:
// requirements.md's read-backs (2753-AC1/AC4), design.md's gate output contract
// (§7.1/§7.2), bdd.md's B6/B14, and docs/corpus/corpus.types.ts. The gate's own
// source was never read — each case drives the real
// `node corpus/gates/gate-api-drift.mjs` process as a black box.
//
// Covers bdd.md:
//   B14 - clean tree -> gate:api-drift exits 0 (2753-AC1)
//   B6  - a documented export renamed in packages/*/src (fixture drift-renamed-export)
//         -> exit 1 naming BOTH the now-undocumented real export AND the removed-but-
//         still-documented renamed id, `<file>:<line> — <reason>` form (2753-AC1, 2753-AC4)
//   fail-closed - unreadable/malformed corpus.json -> exit non-zero, never a silent pass
//
// The RED case clones the real corpus.json, applies the committed drift-renamed-export
// defect (identical shape to the gate:symbols selftest — one fixture, two consumers),
// runs the gate, and asserts the finding names that specific drift. corpus.json is
// backed up and restored unconditionally.
//
// Usage:
//   node docs/corpus/gates/gate-api-drift.selftest.mjs             # run every case
//   node docs/corpus/gates/gate-api-drift.selftest.mjs --case <id> # run one case

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = path.resolve(HERE, '..', '..');
const CORPUS_JSON_PATH = path.join(DOCS_DIR, 'corpus', 'corpus.json');
const FIXTURES = path.join(DOCS_DIR, 'corpus', 'fixtures');

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function runGate() {
  return spawnSync(process.execPath, ['corpus/gates/gate-api-drift.mjs'], {
    cwd: DOCS_DIR,
    encoding: 'utf8',
  });
}

function combinedOutput(result) {
  return `${result.stdout || ''}\n${result.stderr || ''}`;
}

function withMutatedCorpus(mutate, run) {
  const original = fs.readFileSync(CORPUS_JSON_PATH, 'utf8');
  try {
    const corpus = JSON.parse(original);
    mutate(corpus);
    fs.writeFileSync(CORPUS_JSON_PATH, JSON.stringify(corpus, null, 2));
    return run();
  } finally {
    fs.writeFileSync(CORPUS_JSON_PATH, original);
  }
}

// ---------------------------------------------------------------------------
// B14 — clean tree, gate:api-drift exits 0.
// ---------------------------------------------------------------------------
function caseCleanGreen() {
  const result = runGate();
  assert(
    result.status === 0,
    `expected gate:api-drift to exit 0 on the clean tree (B14 / 2753-AC1), got exit ${result.status}\n${combinedOutput(result)}`,
  );
}

// ---------------------------------------------------------------------------
// B6 — renamed export. gate:api-drift rebuilds the symbols set from the fresh
// reflection and diffs it against the committed corpus; the rename produces two
// findings: the real export is now undocumented (missing from corpus) and the
// renamed id is documented but no longer exported.
// ---------------------------------------------------------------------------
function caseRenamedExportRed() {
  const defect = JSON.parse(
    fs.readFileSync(path.join(FIXTURES, 'drift-renamed-export.json'), 'utf8'),
  );
  let victimId = null;
  const result = withMutatedCorpus(
    (corpus) => {
      victimId = Object.keys(corpus.symbols)[0];
      assert(victimId, 'real corpus.json has no symbols to rename');
      const victim = corpus.symbols[victimId];
      delete corpus.symbols[victimId];
      delete corpus.index[victimId];
      corpus.symbols[defect.renamedId] = {
        ...victim,
        id: defect.renamedId,
        name: defect.renamedName,
      };
      corpus.index[defect.renamedId] = {
        kind: 'symbol',
        path: victim.sourceFile,
        module: victim.module,
        title: defect.renamedName,
      };
    },
    runGate,
  );
  const combined = combinedOutput(result);
  assert(
    result.status !== 0,
    `expected gate:api-drift to exit non-zero on a renamed export (B6 / 2753-AC1), got exit ${result.status}\n${combined}`,
  );
  assert(
    combined.includes(defect.renamedId),
    `RED-for-the-right-reason: expected a finding naming the removed-but-still-documented id "${defect.renamedId}" (2753-AC4), got:\n${combined}`,
  );
  assert(
    combined.includes(victimId),
    `RED-for-the-right-reason: expected a finding naming the now-undocumented real export "${victimId}" (2753-AC4), got:\n${combined}`,
  );
}

// ---------------------------------------------------------------------------
// fail-closed — a malformed corpus.json must fail the gate, not pass silently.
// ---------------------------------------------------------------------------
function caseFailClosedOnCorruptCorpus() {
  const original = fs.readFileSync(CORPUS_JSON_PATH, 'utf8');
  try {
    fs.writeFileSync(CORPUS_JSON_PATH, '{ this is not valid json ][');
    const result = runGate();
    const combined = combinedOutput(result);
    assert(
      result.status !== 0,
      `fail-closed: expected gate:api-drift to exit non-zero on an unreadable corpus.json, got exit ${result.status}\n${combined}`,
    );
    assert(
      /fail-closed|not valid json/i.test(combined),
      `fail-closed: expected the failure to declare it cannot verify drift, got:\n${combined}`,
    );
  } finally {
    fs.writeFileSync(CORPUS_JSON_PATH, original);
  }
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------
const CASES = [
  { id: 'b14-clean-green', bdd: 'B14 / 2753-AC1', fn: caseCleanGreen },
  { id: 'b6-renamed-export-red', bdd: 'B6 / 2753-AC1, 2753-AC4', fn: caseRenamedExportRed },
  { id: 'fail-closed-corrupt-corpus', bdd: 'fail-closed / design §7.1', fn: caseFailClosedOnCorruptCorpus },
];

function main() {
  const args = process.argv.slice(2);
  const caseFlagIdx = args.indexOf('--case');
  const onlyCase = caseFlagIdx !== -1 ? args[caseFlagIdx + 1] : null;

  const toRun = onlyCase ? CASES.filter((c) => c.id === onlyCase) : CASES;
  if (onlyCase && toRun.length === 0) {
    console.error(
      `FAIL: unknown --case "${onlyCase}". Known cases: ${CASES.map((c) => c.id).join(', ')}`,
    );
    process.exit(1);
  }

  let failures = 0;
  for (const c of toRun) {
    const startedAt = Date.now();
    try {
      c.fn();
      console.log(`PASS  ${c.id}  (${c.bdd})  ${Date.now() - startedAt}ms`);
    } catch (err) {
      failures += 1;
      console.error(`FAIL  ${c.id}  (${c.bdd})  ${Date.now() - startedAt}ms\n  ${err.message}`);
    }
  }
  console.log(`\n${toRun.length - failures}/${toRun.length} gate-api-drift.selftest.mjs cases passed`);
  process.exit(failures ? 1 : 0);
}

main();
