#!/usr/bin/env node
// docs/corpus/gates/gate-symbols.selftest.mjs
//
// Selftest + negative controls for docs/corpus/gates/gate-symbols.mjs
// — FE-2752 T10 (prover seat).
//
// Authored by the prover seat, a separate invocation from the gate author
// (seat-separation.md / ADR-021 test-writer != code-writer clause — cited, not
// restated). Every assertion here was written against the *public* contract
// only: requirements.md's AC read-backs (2753-AC1/AC4, 3003-AC2), design.md's
// documented gate CLI/exit-code/`<file>:<line> — <reason>` output contract
// (§7.1/§7.2), bdd.md's B6/B12/B14 scenarios, and docs/corpus/corpus.types.ts.
// gate-symbols.mjs's own source was never read to write these cases — each case
// drives the real `node corpus/gates/gate-symbols.mjs` process as a black box
// and inspects only its exit code and stdio.
//
// Covers bdd.md:
//   B14 - clean tree -> gate:symbols exits 0 (green path proven, not assumed) (2753-AC1)
//   B6  - a documented export renamed in packages/*/src (fixture drift-renamed-export)
//         -> exit 1 naming the dead symbol id, `<file> — <reason>` form (2753-AC1, 2753-AC4)
//   B12 - a glossary referent pointing at a removed symbol (fixture
//         drift-dead-glossary-referent) -> exit 1 naming the term + dead referent id (3003-AC2)
//   fail-closed - unreadable/malformed corpus.json -> exit non-zero, never a silent pass
//
// The RED cases clone the real corpus.json, apply exactly one committed-fixture
// defect, run the gate, and assert the finding names that specific defect
// (RED-for-the-right-reason — not a tautology). corpus.json is backed up and
// restored unconditionally (try/finally) around every swapped-in run.
//
// Usage:
//   node docs/corpus/gates/gate-symbols.selftest.mjs             # run every case
//   node docs/corpus/gates/gate-symbols.selftest.mjs --case <id> # run one case

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)); // docs/corpus/gates
const DOCS_DIR = path.resolve(HERE, '..', '..'); // -> docs/
const CORPUS_JSON_PATH = path.join(DOCS_DIR, 'corpus', 'corpus.json');
const FIXTURES = path.join(DOCS_DIR, 'corpus', 'fixtures');

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function runGate() {
  return spawnSync(process.execPath, ['corpus/gates/gate-symbols.mjs'], {
    cwd: DOCS_DIR,
    encoding: 'utf8',
  });
}

function combinedOutput(result) {
  return `${result.stdout || ''}\n${result.stderr || ''}`;
}

function readCorpus() {
  return JSON.parse(fs.readFileSync(CORPUS_JSON_PATH, 'utf8'));
}

// Backs up corpus.json, hands a mutable clone to `mutate`, writes it, runs the
// gate, and restores the original bytes unconditionally.
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
// B14 — clean tree, gate:symbols exits 0.
// ---------------------------------------------------------------------------
function caseCleanGreen() {
  const result = runGate();
  assert(
    result.status === 0,
    `expected gate:symbols to exit 0 on the clean tree (B14 / 2753-AC1), got exit ${result.status}\n${combinedOutput(result)}`,
  );
}

// ---------------------------------------------------------------------------
// B6 — renamed export (drift-renamed-export). Remove the first documented
// symbol and re-add it under a renamed id absent from the reflection.
// ---------------------------------------------------------------------------
function caseRenamedExportRed() {
  const defect = JSON.parse(
    fs.readFileSync(path.join(FIXTURES, 'drift-renamed-export.json'), 'utf8'),
  );
  const result = withMutatedCorpus(
    (corpus) => {
      const victimId = Object.keys(corpus.symbols)[0];
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
    `expected gate:symbols to exit non-zero on a renamed/dead documented symbol (B6 / 2753-AC1), got exit ${result.status}\n${combined}`,
  );
  assert(
    combined.includes(defect.renamedId),
    `RED-for-the-right-reason: expected the finding to name the dead id "${defect.renamedId}" (2753-AC4), got:\n${combined}`,
  );
  assert(
    /no longer resolves|renamed\/removed/i.test(combined),
    `expected the finding to state the symbol no longer resolves, got:\n${combined}`,
  );
}

// ---------------------------------------------------------------------------
// B12 — dead glossary referent (drift-dead-glossary-referent). Repoint the
// first symbol-type referent of the first eligible term at a dead symbol id.
// ---------------------------------------------------------------------------
function caseDeadGlossaryReferentRed() {
  const defect = JSON.parse(
    fs.readFileSync(
      path.join(FIXTURES, 'drift-dead-glossary-referent.json'),
      'utf8',
    ),
  );
  let targetedTerm = null;
  const result = withMutatedCorpus(
    (corpus) => {
      const slug = Object.keys(corpus.glossary.terms).find((s) =>
        corpus.glossary.terms[s].referents.some((r) => r.type === 'symbol'),
      );
      assert(slug, 'seed glossary has no term carrying a symbol-type referent to mutate');
      targetedTerm = corpus.glossary.terms[slug].term;
      corpus.glossary.terms[slug].referents[0] = {
        type: defect.type,
        id: defect.deadReferentId,
      };
    },
    runGate,
  );
  const combined = combinedOutput(result);
  assert(
    result.status !== 0,
    `expected gate:symbols to exit non-zero on a dead glossary referent (B12 / 3003-AC2), got exit ${result.status}\n${combined}`,
  );
  assert(
    combined.includes(defect.deadReferentId),
    `RED-for-the-right-reason: expected the finding to name the dead referent id "${defect.deadReferentId}", got:\n${combined}`,
  );
  assert(
    targetedTerm && combined.includes(targetedTerm),
    `expected the finding to name the offending term "${targetedTerm}" (3003-AC2), got:\n${combined}`,
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
      `fail-closed: expected gate:symbols to exit non-zero on an unreadable corpus.json, got exit ${result.status}\n${combined}`,
    );
    assert(
      /corpus\.json/.test(combined) && /not valid json|fail-closed/i.test(combined),
      `fail-closed: expected the failure to name corpus.json and the parse failure, got:\n${combined}`,
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
  { id: 'b12-dead-glossary-referent-red', bdd: 'B12 / 3003-AC2', fn: caseDeadGlossaryReferentRed },
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
  console.log(`\n${toRun.length - failures}/${toRun.length} gate-symbols.selftest.mjs cases passed`);
  process.exit(failures ? 1 : 0);
}

main();
