#!/usr/bin/env node
// docs/corpus/gates/gate-examples.selftest.mjs
//
// Selftest + negative control for docs/corpus/gates/gate-examples.mjs
// — FE-2752 T10 (prover seat).
//
// Authored by the prover seat, a separate invocation from the gate author
// (seat-separation.md / ADR-021 test-writer != code-writer clause — cited, not
// restated). Assertions written against the *public* contract only:
// requirements.md's read-backs (2753-AC1/AC4), design.md's gate contract (§7.1
// gate:examples row, §7.2), bdd.md's B7/B14, and docs/corpus/corpus.types.ts
// (the ExampleEntry shape). The gate's own source was never read — each case
// drives the real `node corpus/gates/gate-examples.mjs` process as a black box.
//
// Covers bdd.md:
//   B14 - clean tree (near-empty examples set) -> gate:examples exits 0, green-with-count
//         (the FE-2754 seam: the gate precedes the content) (2753-AC1)
//   B7  - a snippet importing a non-existent export (fixture drift-broken-snippet)
//         -> exit 1 naming the example id + the failing import, `<file> — <reason>`
//         form, type-checked with vue-tsc against the REAL workspace packages
//         (2753-AC1, 2753-AC4)
//   fail-closed - unreadable/malformed corpus.json -> exit non-zero, never a silent pass
//
// The RED case clones the real corpus.json, injects the committed
// drift-broken-snippet example (code read from the fixture's snippet.ts), runs
// the gate, and asserts the finding names that specific example and the missing
// export (RED-for-the-right-reason — not a tautology). corpus.json is backed up
// and restored unconditionally.
//
// Usage:
//   node docs/corpus/gates/gate-examples.selftest.mjs             # run every case
//   node docs/corpus/gates/gate-examples.selftest.mjs --case <id> # run one case

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = path.resolve(HERE, '..', '..');
const CORPUS_JSON_PATH = path.join(DOCS_DIR, 'corpus', 'corpus.json');
const FIXTURE_DIR = path.join(DOCS_DIR, 'corpus', 'fixtures', 'drift-broken-snippet');

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function runGate() {
  return spawnSync(process.execPath, ['corpus/gates/gate-examples.mjs'], {
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
// B14 — clean tree, gate:examples exits 0 (empty-set green-with-count).
// ---------------------------------------------------------------------------
function caseCleanGreen() {
  const result = runGate();
  const combined = combinedOutput(result);
  assert(
    result.status === 0,
    `expected gate:examples to exit 0 on the clean tree (B14 / 2753-AC1), got exit ${result.status}\n${combined}`,
  );
  assert(
    /\bsnippet/i.test(combined),
    `expected the clean run to print a compiled-snippet count (green-with-count), got:\n${combined}`,
  );
}

// ---------------------------------------------------------------------------
// B7 — broken snippet (drift-broken-snippet). Inject the fixture example and
// assert the gate type-checks it against real exports and REDs.
// ---------------------------------------------------------------------------
function caseBrokenSnippetRed() {
  const example = JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, 'example.json'), 'utf8'));
  const code = fs.readFileSync(path.join(FIXTURE_DIR, example.codeFile), 'utf8');
  const result = withMutatedCorpus(
    (corpus) => {
      corpus.examples[example.id] = {
        id: example.id,
        title: example.title,
        lang: example.lang,
        code,
        sourceFile: `docs/corpus/fixtures/drift-broken-snippet/${example.codeFile}`,
      };
      corpus.index[example.id] = {
        kind: 'example',
        path: `docs/corpus/fixtures/drift-broken-snippet/${example.codeFile}`,
        module: '',
        title: example.title,
      };
    },
    runGate,
  );
  const combined = combinedOutput(result);
  assert(
    result.status !== 0,
    `expected gate:examples to exit non-zero on a snippet importing a non-existent export (B7 / 2753-AC1), got exit ${result.status}\n${combined}`,
  );
  assert(
    combined.includes(example.id),
    `RED-for-the-right-reason: expected the finding to name the example id "${example.id}" (2753-AC4), got:\n${combined}`,
  );
  assert(
    combined.includes(example.expectFinding),
    `RED-for-the-right-reason: expected the finding to name the missing export "${example.expectFinding}", got:\n${combined}`,
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
      `fail-closed: expected gate:examples to exit non-zero on an unreadable corpus.json, got exit ${result.status}\n${combined}`,
    );
    assert(
      /not valid json|FAIL/i.test(combined),
      `fail-closed: expected the failure to name the parse failure, got:\n${combined}`,
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
  { id: 'b7-broken-snippet-red', bdd: 'B7 / 2753-AC1, 2753-AC4', fn: caseBrokenSnippetRed },
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
  console.log(`\n${toRun.length - failures}/${toRun.length} gate-examples.selftest.mjs cases passed`);
  process.exit(failures ? 1 : 0);
}

main();
