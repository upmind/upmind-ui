#!/usr/bin/env node
// docs/corpus/gates/gate-authorship.selftest.mjs
//
// Selftest + negative controls for docs/corpus/gates/gate-authorship.mjs
// — FE-2752 T10 (prover seat).
//
// Authored by the prover seat, a separate invocation from the gate author
// (seat-separation.md / ADR-021 test-writer != code-writer clause — cited, not
// restated). Assertions written against the *public* contract only:
// requirements.md's read-backs (2950-AC1/AC2/AC3/AC4), design.md's guard
// contract (§8.1 manifest, §8.2 three checks, §8.3 provenance, §6.3
// determinism), bdd.md's B10/B11/B14, and docs/corpus/corpus.types.ts. The
// guard's own source was never read — each case drives the real
// `node corpus/gates/gate-authorship.mjs` process as a black box.
//
// Covers bdd.md:
//   B14  - clean tree -> gate:authorship exits 0 (replay + pins + provenance) (2950-AC2)
//   B11  - --check-provenance exits 0 on a fresh emit (2950-AC3/AC4)
//   AC1  - --print-manifest prints the exact five machine-owned paths (2950-AC1)
//   B10a - a hand-edited generated file -> exit 1 naming the file (2950-AC2)
//   B10b - a hand-edited corpus.json -> exit 1 via the content-hash pin (§8.2 check 2)
//   B10c - a hand-edited relations.json -> exit 1 via the sha256 pin (§8.2 check 3)
//   B10d - two consecutive emits with no source change -> byte-identical (determinism,
//          §6.3; design §9 "regen twice, diff clean" negative control)
//   B11a - a generated page missing one of the 8 keys -> --check-provenance exit 1
//          naming the page + the missing key (2950-AC3)
//   B11b - a hand-authored page carrying `generated: true` -> --check-provenance exit 1
//          naming the page + the boundary violation (2950-AC4)
//   fail-closed - unreadable/malformed corpus.json -> exit non-zero, never a silent pass
//
// IMPORTANT (tree-sync precondition, stated honestly). gate:authorship reads the
// committed tree via the git repo root and re-emits from the on-disk
// docs/corpus/corpus.json (§8.2). In this worktree the committed
// docs/published-docs/developers/** tree was emitted from an EARLIER corpus than the on-disk
// (untracked) corpus.json, so the guard is legitimately RED on the raw worktree
// (it is correctly reporting a stale tree). The clean-green + provenance cases
// therefore first bring the tree into the self-consistent built state the
// operator/CI commits (`corpus:emit`), assert green, and restore the committed
// bytes unconditionally (try/finally) — mirroring the T5 prover pattern of
// swapping a real file in and out around a single run. Every case leaves the
// worktree exactly as it found it.
//
// Usage:
//   node docs/corpus/gates/gate-authorship.selftest.mjs             # run every case
//   node docs/corpus/gates/gate-authorship.selftest.mjs --case <id> # run one case

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)); // docs/corpus/gates
const DOCS_DIR = path.resolve(HERE, '..', '..'); // -> docs/
const CORPUS_JSON_PATH = path.join(DOCS_DIR, 'corpus', 'corpus.json');
const RELATIONS_JSON_PATH = path.join(DOCS_DIR, 'corpus', 'relations.json');
const DEVELOPERS_DIR = path.join(DOCS_DIR, 'published-docs', 'developers');
const SAMPLE_PAGE = path.join(DEVELOPERS_DIR, 'reference', 'headless', 'classes', 'Upmind.mdx');

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function runGate(...args) {
  return spawnSync(process.execPath, ['corpus/gates/gate-authorship.mjs', ...args], {
    cwd: DOCS_DIR,
    encoding: 'utf8',
  });
}

function runEmitSync() {
  return spawnSync(process.execPath, ['corpus/emit-mdx.mjs'], { cwd: DOCS_DIR, encoding: 'utf8' });
}

function runEmitTo(outDir) {
  return spawnSync(process.execPath, ['corpus/emit-mdx.mjs', '--out', outDir], {
    cwd: DOCS_DIR,
    encoding: 'utf8',
  });
}

function combinedOutput(result) {
  return `${result.stdout || ''}\n${result.stderr || ''}`;
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

// Backs up the committed tree + both pinned artifacts, emits a self-consistent
// tree from the on-disk corpus.json (the state the operator/CI commits), runs
// `fn`, and restores the exact committed bytes unconditionally.
function withCleanBuiltTree(fn) {
  const bk = fs.mkdtempSync(path.join(os.tmpdir(), 'fe2752-auth-selftest-'));
  fs.cpSync(DEVELOPERS_DIR, path.join(bk, 'developers'), { recursive: true });
  fs.copyFileSync(CORPUS_JSON_PATH, path.join(bk, 'corpus.json'));
  fs.copyFileSync(RELATIONS_JSON_PATH, path.join(bk, 'relations.json'));
  try {
    const emit = runEmitSync();
    assert(
      emit.status === 0,
      `precondition: corpus:emit must exit 0 to sync the tree, got exit ${emit.status}\n${combinedOutput(emit)}`,
    );
    return fn();
  } finally {
    fs.rmSync(DEVELOPERS_DIR, { recursive: true, force: true });
    fs.cpSync(path.join(bk, 'developers'), DEVELOPERS_DIR, { recursive: true });
    fs.copyFileSync(path.join(bk, 'corpus.json'), CORPUS_JSON_PATH);
    fs.copyFileSync(path.join(bk, 'relations.json'), RELATIONS_JSON_PATH);
    fs.rmSync(bk, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// 2950-AC1 — --print-manifest prints exactly the five machine-owned paths.
// ---------------------------------------------------------------------------
function casePrintManifest() {
  const result = runGate('--print-manifest');
  const combined = combinedOutput(result);
  assert(result.status === 0, `--print-manifest should exit 0, got ${result.status}\n${combined}`);
  const expected = [
    'docs/published-docs/developers/reference/**',
    'docs/published-docs/developers/changelog/**',
    'docs/published-docs/developers/corpus-version.json',
    'docs/corpus/corpus.json',
    'docs/corpus/relations.json',
  ];
  for (const p of expected) {
    assert(combined.includes(p), `--print-manifest is missing "${p}" (2950-AC1), got:\n${combined}`);
  }
}

// ---------------------------------------------------------------------------
// B14 — clean (self-consistent built) tree, gate:authorship exits 0.
// ---------------------------------------------------------------------------
function caseCleanGreen() {
  withCleanBuiltTree(() => {
    const result = runGate();
    assert(
      result.status === 0,
      `expected gate:authorship to exit 0 on a self-consistent built tree (B14 / 2950-AC2), got exit ${result.status}\n${combinedOutput(result)}`,
    );
  });
}

// ---------------------------------------------------------------------------
// B11 (green) — --check-provenance exits 0 on a fresh emit.
// ---------------------------------------------------------------------------
function caseProvenanceGreen() {
  withCleanBuiltTree(() => {
    const result = runGate('--check-provenance');
    assert(
      result.status === 0,
      `expected --check-provenance to exit 0 on a fresh emit (2950-AC3/AC4), got exit ${result.status}\n${combinedOutput(result)}`,
    );
  });
}

// ---------------------------------------------------------------------------
// B10a — a hand-edited generated file. Emit-replay byte-diff must RED naming it.
// ---------------------------------------------------------------------------
function caseHandEditRed() {
  withCleanBuiltTree(() => {
    assert(fs.existsSync(SAMPLE_PAGE), `expected the synced tree to contain ${SAMPLE_PAGE}`);
    fs.appendFileSync(SAMPLE_PAGE, '\nhand-edited-by-negative-control\n');
    const result = runGate();
    const combined = combinedOutput(result);
    assert(
      result.status !== 0,
      `expected gate:authorship to exit non-zero on a hand-edited generated file (B10a / 2950-AC2), got exit ${result.status}\n${combined}`,
    );
    assert(
      combined.includes('classes/Upmind.mdx'),
      `RED-for-the-right-reason: expected the finding to name the hand-edited page, got:\n${combined}`,
    );
    assert(
      /hand-edited generated file/i.test(combined),
      `expected the finding to state the file was hand-edited, got:\n${combined}`,
    );
  });
}

// ---------------------------------------------------------------------------
// B10b — a hand-edited corpus.json. Re-emit first so the byte-replay stays
// green, isolating the content-hash pin (§8.2 check 2) as the sole RED cause.
// ---------------------------------------------------------------------------
function caseCorpusPinRed() {
  withCleanBuiltTree(() => {
    const corpus = JSON.parse(fs.readFileSync(CORPUS_JSON_PATH, 'utf8'));
    const slug = Object.keys(corpus.glossary.terms)[0];
    assert(slug, 'corpus has no glossary terms to tamper with');
    corpus.glossary.terms[slug].definition += ' [negative-control-pin-tamper]';
    fs.writeFileSync(CORPUS_JSON_PATH, JSON.stringify(corpus, null, 2));
    const emit = runEmitSync(); // keep the emit-replay green; isolate the pin
    assert(emit.status === 0, `re-emit after corpus tamper should exit 0, got ${emit.status}\n${combinedOutput(emit)}`);
    const result = runGate();
    const combined = combinedOutput(result);
    assert(
      result.status !== 0,
      `expected gate:authorship to exit non-zero when corpus.json content no longer matches its pinned hash (B10b / §8.2), got exit ${result.status}\n${combined}`,
    );
    assert(
      /docs\/corpus\/corpus\.json/.test(combined) && /content hash|pinned/i.test(combined),
      `RED-for-the-right-reason: expected the content-hash pin to RED naming corpus.json, got:\n${combined}`,
    );
  });
}

// ---------------------------------------------------------------------------
// B10c — a hand-edited relations.json. The sha256 pin (§8.2 check 3) must RED;
// relations.json does not feed the emit, so replay + corpus pin stay green.
// ---------------------------------------------------------------------------
function caseRelationsPinRed() {
  withCleanBuiltTree(() => {
    const rel = JSON.parse(fs.readFileSync(RELATIONS_JSON_PATH, 'utf8'));
    if (Array.isArray(rel.edges) && rel.edges.length) {
      rel.edges[0].confidence = (rel.edges[0].confidence || 0) + 0.000001;
    } else {
      rel.__negativeControlTamper = true;
    }
    fs.writeFileSync(RELATIONS_JSON_PATH, JSON.stringify(rel));
    const result = runGate();
    const combined = combinedOutput(result);
    assert(
      result.status !== 0,
      `expected gate:authorship to exit non-zero when relations.json no longer matches its pinned sha256 (B10c / §8.2), got exit ${result.status}\n${combined}`,
    );
    assert(
      /docs\/corpus\/relations\.json/.test(combined) && /sha256|pinned/i.test(combined),
      `RED-for-the-right-reason: expected the relations sha256 pin to RED naming relations.json, got:\n${combined}`,
    );
  });
}

// ---------------------------------------------------------------------------
// B10d — determinism. Two consecutive emits from the same corpus.json must be
// byte-identical (the property that makes the byte-diff guard workable, §6.3).
// ---------------------------------------------------------------------------
function caseDeterminismTwiceDiffClean() {
  const a = fs.mkdtempSync(path.join(os.tmpdir(), 'fe2752-emitA-'));
  const b = fs.mkdtempSync(path.join(os.tmpdir(), 'fe2752-emitB-'));
  try {
    const r1 = runEmitTo(a);
    assert(r1.status === 0, `first emit should exit 0, got ${r1.status}\n${combinedOutput(r1)}`);
    const r2 = runEmitTo(b);
    assert(r2.status === 0, `second emit should exit 0, got ${r2.status}\n${combinedOutput(r2)}`);
    const relA = walk(a).map((f) => path.relative(a, f)).sort();
    const relB = walk(b).map((f) => path.relative(b, f)).sort();
    assert(
      JSON.stringify(relA) === JSON.stringify(relB),
      `two consecutive emits produced different file sets — emit is not deterministic (B10d / §6.3)`,
    );
    for (const rel of relA) {
      const ba = fs.readFileSync(path.join(a, rel));
      const bb = fs.readFileSync(path.join(b, rel));
      assert(
        ba.equals(bb),
        `two consecutive emits differ at ${rel} — emit is not deterministic (B10d / §6.3), so the guard's byte-diff would false-RED`,
      );
    }
  } finally {
    fs.rmSync(a, { recursive: true, force: true });
    fs.rmSync(b, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// B11a — a generated page missing one of the 8 provenance keys.
// ---------------------------------------------------------------------------
function caseProvenanceMissingKeyRed() {
  withCleanBuiltTree(() => {
    assert(fs.existsSync(SAMPLE_PAGE), `expected the synced tree to contain ${SAMPLE_PAGE}`);
    const original = fs.readFileSync(SAMPLE_PAGE, 'utf8');
    const stripped = original.replace(/\nmodule:.*(?=\n)/, '');
    assert(stripped !== original, 'expected to strip the "module" provenance key from the sample page');
    fs.writeFileSync(SAMPLE_PAGE, stripped);
    const result = runGate('--check-provenance');
    const combined = combinedOutput(result);
    assert(
      result.status !== 0,
      `expected --check-provenance to exit non-zero on a generated page missing a key (B11a / 2950-AC3), got exit ${result.status}\n${combined}`,
    );
    assert(
      combined.includes('classes/Upmind.mdx') && /module/.test(combined),
      `RED-for-the-right-reason: expected the finding to name the page + the missing "module" key, got:\n${combined}`,
    );
  });
}

// ---------------------------------------------------------------------------
// B11b — a hand-authored page (outside the partition) carrying generated: true.
// ---------------------------------------------------------------------------
function caseOutOfPartitionGeneratedFlagRed() {
  withCleanBuiltTree(() => {
    const learnDir = path.join(DEVELOPERS_DIR, 'learn');
    fs.mkdirSync(learnDir, { recursive: true });
    const fake = path.join(learnDir, 'intro.mdx');
    fs.writeFileSync(
      fake,
      '---\ngenerated: true\ntitle: fake\n---\n\n# hand-authored page falsely claiming generated\n',
    );
    const result = runGate('--check-provenance');
    const combined = combinedOutput(result);
    assert(
      result.status !== 0,
      `expected --check-provenance to exit non-zero on a hand-authored page carrying generated:true (B11b / 2950-AC4), got exit ${result.status}\n${combined}`,
    );
    assert(
      combined.includes('learn/intro.mdx') && /generated/i.test(combined),
      `RED-for-the-right-reason: expected the finding to name the hand-authored page + the illegal generated flag, got:\n${combined}`,
    );
  });
}

// ---------------------------------------------------------------------------
// fail-closed — a malformed corpus.json must fail the guard, not pass silently.
// ---------------------------------------------------------------------------
function caseFailClosedOnCorruptCorpus() {
  const original = fs.readFileSync(CORPUS_JSON_PATH, 'utf8');
  try {
    fs.writeFileSync(CORPUS_JSON_PATH, '{ this is not valid json ][');
    const result = runGate();
    const combined = combinedOutput(result);
    assert(
      result.status !== 0,
      `fail-closed: expected gate:authorship to exit non-zero on an unreadable corpus.json, got exit ${result.status}\n${combined}`,
    );
    assert(
      /not valid json|replay failed/i.test(combined),
      `fail-closed: expected the emit-replay to surface the parse failure, got:\n${combined}`,
    );
  } finally {
    fs.writeFileSync(CORPUS_JSON_PATH, original);
  }
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------
const CASES = [
  { id: 'ac1-print-manifest', bdd: '2950-AC1', fn: casePrintManifest },
  { id: 'b14-clean-green', bdd: 'B14 / 2950-AC2', fn: caseCleanGreen },
  { id: 'b11-provenance-green', bdd: 'B11 green / 2950-AC3, AC4', fn: caseProvenanceGreen },
  { id: 'b10a-hand-edit-red', bdd: 'B10a / 2950-AC2', fn: caseHandEditRed },
  { id: 'b10b-corpus-pin-red', bdd: 'B10b / §8.2 check 2', fn: caseCorpusPinRed },
  { id: 'b10c-relations-pin-red', bdd: 'B10c / §8.2 check 3', fn: caseRelationsPinRed },
  { id: 'b10d-determinism-twice-diff-clean', bdd: 'B10d / §6.3', fn: caseDeterminismTwiceDiffClean },
  { id: 'b11a-provenance-missing-key-red', bdd: 'B11a / 2950-AC3', fn: caseProvenanceMissingKeyRed },
  { id: 'b11b-out-of-partition-generated-flag-red', bdd: 'B11b / 2950-AC4', fn: caseOutOfPartitionGeneratedFlagRed },
  { id: 'fail-closed-corrupt-corpus', bdd: 'fail-closed / design §8.2', fn: caseFailClosedOnCorruptCorpus },
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
  console.log(`\n${toRun.length - failures}/${toRun.length} gate-authorship.selftest.mjs cases passed`);
  process.exit(failures ? 1 : 0);
}

main();
