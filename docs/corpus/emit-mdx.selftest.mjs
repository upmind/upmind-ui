#!/usr/bin/env node
// docs/corpus/emit-mdx.selftest.mjs
//
// Selftest for docs/corpus/emit-mdx.mjs — FE-2752 T5 (prover seat).
//
// Authored by the prover seat, a separate invocation from the builder
// (seat-separation.md / ADR-021 test-writer != code-writer clause — cited,
// not restated). Assertions were written against the *public* contract
// only: requirements.md's AC read-backs, design.md's documented CLI/log/
// exit-code contract for `corpus:emit` (§6, §8.2, §9), bdd.md's B3/B4/B15/B16
// scenarios, and docs/corpus/corpus.types.ts. emit-mdx.mjs's own source was
// never read to write these cases — every assertion drives the real
// `node corpus/emit-mdx.mjs --out <tempDir>` process as a black box and
// inspects only its exit code, stdio, and the tree it writes.
//
// This selftest does NOT invoke corpus:build — it consumes whatever
// docs/corpus/corpus.json is already on disk (per T5's Input State: "T3, T4
// output states hold"). The reality-check invocation order
// (`build.selftest.mjs && emit-mdx.selftest.mjs`) guarantees a fresh,
// well-formed corpus.json is in place before this file runs.
//
// Every case that emits uses `--out <tempDir>` (the flag design §8.2/tasks.md
// T4 document as existing "for the guard's replay target") so this selftest
// never touches the committed docs/published-docs/developers/** tree.
//
// Covers bdd.md:
//   B3  - provenance frontmatter (8 keys) + Mintlify-mapped body (2752-AC3, 2950-AC3)
//   B4  - an emit run touches only manifest paths (2752-AC4, 2950-AC1)
//   B16 - every emitted page carries a generated Related section (2752-AC7)
//   B15 - corpus-version.json equals corpus.meta.corpus_version (2753-AC5)
//   RED - a symbol whose id/name escapes the --out root fails the emit
//         (design §9 "emitter also hard-asserts its own write-root")
//
// Usage:
//   node docs/corpus/emit-mdx.selftest.mjs               # run every case
//   node docs/corpus/emit-mdx.selftest.mjs --case <id>   # run one case

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = path.resolve(HERE, '..'); // docs/corpus/.. -> docs/
const CORPUS_JSON_PATH = path.join(DOCS_DIR, 'corpus', 'corpus.json');
const FIXTURE_ESCAPE_SYMBOL = path.join(
  HERE,
  'fixtures',
  'emit-write-root-escape.json',
);

const REQUIRED_FRONTMATTER_KEYS = [
  'generated',
  'corpus_version',
  'built_at',
  'id',
  'audience',
  'module',
  'status',
  'last-verified-against-commit',
];

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function ensureCorpusJsonExists() {
  assert(
    fs.existsSync(CORPUS_JSON_PATH),
    'docs/corpus/corpus.json does not exist — run "pnpm --filter docs corpus:build" ' +
      '(or docs/corpus/build.selftest.mjs) first; this selftest exercises emit-mdx.mjs ' +
      'only, it does not invoke the builder',
  );
}

function readCorpus() {
  return JSON.parse(fs.readFileSync(CORPUS_JSON_PATH, 'utf8'));
}

function runEmit(outDir) {
  return spawnSync(process.execPath, ['corpus/emit-mdx.mjs', '--out', outDir], {
    cwd: DOCS_DIR,
    encoding: 'utf8',
  });
}

function combinedOutput(result) {
  return `${result.stdout || ''}\n${result.stderr || ''}`;
}

function mkTempOutDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fe2752-emit-selftest-'));
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

function withTempOutDir(fn) {
  const out = mkTempOutDir();
  try {
    return fn(out);
  } finally {
    fs.rmSync(out, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// B3 — Given a symbol with TSDoc, when emitted, then the page carries the
// full provenance frontmatter (2752-AC3, 2950-AC3) and a Mintlify-mapped
// body (no unconverted VitePress `.md` links). Checked across every emitted
// page, not one sample.
// ---------------------------------------------------------------------------
function caseProvenanceAndMdxMapping() {
  ensureCorpusJsonExists();
  withTempOutDir((out) => {
    const result = runEmit(out);
    assert(
      result.status === 0,
      `expected "node corpus/emit-mdx.mjs --out ${out}" to exit 0, got exit ${result.status}\n${combinedOutput(result)}`,
    );
    const pages = walk(out).filter((f) => f.endsWith('.mdx'));
    assert(pages.length > 0, `expected at least one emitted .mdx page under ${out}`);
    for (const page of pages) {
      const relPage = path.relative(out, page);
      const text = fs.readFileSync(page, 'utf8');
      assert(text.startsWith('---\n'), `${relPage} — missing opening frontmatter fence`);
      const closeIdx = text.indexOf('\n---', 4);
      assert(closeIdx !== -1, `${relPage} — missing closing frontmatter fence`);
      const front = text.slice(0, closeIdx);
      for (const key of REQUIRED_FRONTMATTER_KEYS) {
        assert(
          new RegExp(`(^|\\n)${key}:`).test(front),
          `${relPage} — frontmatter missing "${key}:" (2950-AC3 requires all 8 keys)`,
        );
      }
      assert(
        /(^|\n)generated: true(\n|$)/.test(front),
        `${relPage} — frontmatter "generated" is not literally "true"`,
      );
      const body = text.slice(closeIdx);
      assert(
        !/\]\([^)]*\.md\)/.test(body),
        `${relPage} — body still carries an unconverted VitePress ".md" link (2752-AC3 Mintlify transform)`,
      );
    }
  });
}

// ---------------------------------------------------------------------------
// B4 — Given an emit run, when it writes, then only manifest paths are
// touched (2752-AC4, 2950-AC1): every file under the emit root is either
// `corpus-version.json` or lives under `reference/**` / `changelog/**`.
// ---------------------------------------------------------------------------
function casePartitionConfinement() {
  ensureCorpusJsonExists();
  withTempOutDir((out) => {
    const result = runEmit(out);
    assert(
      result.status === 0,
      `expected "node corpus/emit-mdx.mjs --out ${out}" to exit 0, got exit ${result.status}\n${combinedOutput(result)}`,
    );
    const files = walk(out);
    assert(files.length > 0, `expected emit to write at least one file under ${out}`);
    for (const f of files) {
      const relPath = path.relative(out, f);
      const inPartition =
        relPath === 'corpus-version.json' ||
        relPath.startsWith(`reference${path.sep}`) ||
        relPath.startsWith(`changelog${path.sep}`);
      assert(
        inPartition,
        `emitted file outside the manifest partition (design §8.1): ${relPath}`,
      );
    }
  });
}

// ---------------------------------------------------------------------------
// B16 — Given any emitted page, when read, then it carries a generated
// Related section rendered from corpus.relations (2752-AC7). Checked across
// every emitted page under reference/** and changelog/**.
// ---------------------------------------------------------------------------
function caseRelatedSectionPresent() {
  ensureCorpusJsonExists();
  withTempOutDir((out) => {
    const result = runEmit(out);
    assert(
      result.status === 0,
      `expected "node corpus/emit-mdx.mjs --out ${out}" to exit 0, got exit ${result.status}\n${combinedOutput(result)}`,
    );
    const pages = walk(out).filter((f) => f.endsWith('.mdx'));
    assert(pages.length > 0, `expected at least one emitted .mdx page under ${out}`);
    for (const page of pages) {
      const relPage = path.relative(out, page);
      const text = fs.readFileSync(page, 'utf8');
      assert(
        /^## Related/m.test(text),
        `${relPage} — missing the generated "## Related" section (2752-AC7)`,
      );
    }
  });
}

// ---------------------------------------------------------------------------
// B15 — Given an emit, when corpus-version.json is read, then it equals
// corpus.meta's version/timestamp/commit (the FE-2949 canary seam, 2753-AC5).
// ---------------------------------------------------------------------------
function caseCorpusVersionMatches() {
  ensureCorpusJsonExists();
  const corpus = readCorpus();
  withTempOutDir((out) => {
    const result = runEmit(out);
    assert(
      result.status === 0,
      `expected "node corpus/emit-mdx.mjs --out ${out}" to exit 0, got exit ${result.status}\n${combinedOutput(result)}`,
    );
    const versionFilePath = path.join(out, 'corpus-version.json');
    assert(fs.existsSync(versionFilePath), `corpus-version.json was not emitted at ${versionFilePath}`);
    const marker = JSON.parse(fs.readFileSync(versionFilePath, 'utf8'));
    assert(
      marker.corpus_version === corpus.meta.corpus_version,
      `corpus-version.json .corpus_version "${marker.corpus_version}" !== corpus.meta.corpus_version "${corpus.meta.corpus_version}"`,
    );
    assert(
      marker.built_at === corpus.meta.built_at,
      `corpus-version.json .built_at "${marker.built_at}" !== corpus.meta.built_at "${corpus.meta.built_at}"`,
    );
    assert(
      marker.commit === corpus.meta.source_commit,
      `corpus-version.json .commit "${marker.commit}" !== corpus.meta.source_commit "${corpus.meta.source_commit}"`,
    );
  });
}

// ---------------------------------------------------------------------------
// RED — negative control. A symbol whose `.id`/`.name` are seeded with a
// directory-traversal payload must fail the emit (exit non-zero, refusal
// named) rather than write outside the --out partition root. Backs up +
// restores the real corpus.json unconditionally around the single
// swapped-in run.
// ---------------------------------------------------------------------------
function caseOutOfPartitionWriteFailsEmit() {
  ensureCorpusJsonExists();
  assert(fs.existsSync(FIXTURE_ESCAPE_SYMBOL), `missing fixture: ${FIXTURE_ESCAPE_SYMBOL}`);
  const original = fs.readFileSync(CORPUS_JSON_PATH, 'utf8');
  withTempOutDir((out) => {
    try {
      const corpus = JSON.parse(original);
      const templateId = Object.keys(corpus.symbols)[0];
      assert(templateId, 'real corpus.json has no symbols to clone a fixture from');
      const template = corpus.symbols[templateId];
      const { namePayload } = JSON.parse(fs.readFileSync(FIXTURE_ESCAPE_SYMBOL, 'utf8'));
      const evilId = `@upmind-automation/headless!${namePayload}`;
      corpus.symbols[evilId] = { ...template, id: evilId, name: namePayload };
      fs.writeFileSync(CORPUS_JSON_PATH, JSON.stringify(corpus, null, 2));

      const result = runEmit(out);
      const combined = combinedOutput(result);
      assert(
        result.status !== 0,
        `expected "node corpus/emit-mdx.mjs --out ${out}" to refuse a symbol whose name escapes the --out root, got exit ${result.status}\n${combined}`,
      );
      assert(
        /outside the partition/i.test(combined),
        `expected the write-root hard-assert (design §9) to name the refusal ("outside the partition"), RED-for-the-right-reason check failed — got:\n${combined}`,
      );
    } finally {
      fs.writeFileSync(CORPUS_JSON_PATH, original);
    }
  });
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------
const CASES = [
  { id: 'b3-provenance-and-mdx-mapping', bdd: 'B3 / 2752-AC3, 2950-AC3', fn: caseProvenanceAndMdxMapping },
  { id: 'b4-partition-confinement', bdd: 'B4 / 2752-AC4, 2950-AC1', fn: casePartitionConfinement },
  { id: 'b16-related-section-present', bdd: 'B16 / 2752-AC7', fn: caseRelatedSectionPresent },
  { id: 'b15-corpus-version-matches', bdd: 'B15 / 2753-AC5', fn: caseCorpusVersionMatches },
  {
    id: 'red-out-of-partition-write-fails-emit',
    bdd: 'RED negative control / 2752-AC4 partition guarantee',
    fn: caseOutOfPartitionWriteFailsEmit,
  },
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
  console.log(`\n${toRun.length - failures}/${toRun.length} emit-mdx.selftest.mjs cases passed`);
  process.exit(failures ? 1 : 0);
}

main();
