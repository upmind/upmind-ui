#!/usr/bin/env node
// docs/corpus/build.selftest.mjs
//
// Selftest for docs/corpus/build.mjs — FE-2752 T5 (prover seat).
//
// Authored by the prover seat, a separate invocation from the builder
// (seat-separation.md / ADR-021 test-writer != code-writer clause — cited,
// not restated). This file's assertions were written against the *public*
// contract only: requirements.md's AC read-backs, design.md's documented
// CLI/log/exit-code contract for `corpus:build` (§5, §6.3, §7.1), bdd.md's
// B1/B2/B5/B13 scenarios, and docs/corpus/corpus.types.ts (the exported
// public surface). build.mjs's own source was never read to write these
// cases — every assertion below drives the real `node corpus/build.mjs`
// process as a black box and inspects only its exit code, stdio, and the
// corpus.json it writes.
//
// Covers bdd.md:
//   B1  - clean checkout -> corpus:build -> corpus.json carries all 9 sections (2752-AC1)
//   B2  - relations edges non-empty + index-resolvable; changelog.bySymbol present (2752-AC2)
//   B5  - corpus.json carries no renderer markup (2752-AC5)
//   B13 - seed glossary compiles to {term,kind,aliases,definition,referents[]}, referents resolve (3003-AC1)
//   RED - malformed glossary entry fails corpus:build (2753-AC1 corpus:build "Fails when" row;
//         tasks.md T3 action 1 "failing on malformed entries")
//
// Usage:
//   node docs/corpus/build.selftest.mjs               # run every case
//   node docs/corpus/build.selftest.mjs --case <id>    # run one case (see CASES below)
//
// Every case that exercises the real build re-runs `node corpus/build.mjs`
// itself (cwd = docs/, exactly as the `corpus:build` pnpm script does) —
// cases are independent and do not rely on execution order or on each
// other's corpus.json. The one RED case backs up + restores
// docs/corpus/glossary.yaml unconditionally (try/finally) around its single
// swapped-in run.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = path.resolve(HERE, '..'); // docs/corpus/.. -> docs/
const CORPUS_JSON_PATH = path.join(DOCS_DIR, 'corpus', 'corpus.json');
const GLOSSARY_PATH = path.join(DOCS_DIR, 'corpus', 'glossary.yaml');
const FIXTURE_MALFORMED_GLOSSARY = path.join(
  HERE,
  'fixtures',
  'malformed-glossary.yaml',
);

const REQUIRED_SECTIONS = [
  'symbols',
  'guides',
  'adrs',
  'examples',
  'relations',
  'changelog',
  'glossary',
  'index',
  'meta',
];

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function runBuild() {
  return spawnSync(process.execPath, ['corpus/build.mjs'], {
    cwd: DOCS_DIR,
    encoding: 'utf8',
  });
}

function readCorpus() {
  return JSON.parse(fs.readFileSync(CORPUS_JSON_PATH, 'utf8'));
}

function combinedOutput(result) {
  return `${result.stdout || ''}\n${result.stderr || ''}`;
}

// ---------------------------------------------------------------------------
// B1 — Given a clean checkout, when corpus:build runs, then corpus.json
// carries all sections (2752-AC1). Mirrors the AC1 read-back verbatim.
// ---------------------------------------------------------------------------
function caseCleanBuildAllSections() {
  const result = runBuild();
  assert(
    result.status === 0,
    `expected "node corpus/build.mjs" to exit 0 on a clean checkout, got exit ${result.status}\n${combinedOutput(result)}`,
  );
  const corpus = readCorpus();
  const missing = REQUIRED_SECTIONS.filter((k) => !(k in corpus));
  assert(
    missing.length === 0,
    `corpus.json is missing section(s): ${missing.join(', ')} (2752-AC1)`,
  );
  assert(
    typeof corpus.meta.corpus_version === 'string' &&
      /^\d+\+[0-9a-f]{12}$/.test(corpus.meta.corpus_version),
    `meta.corpus_version "${corpus.meta.corpus_version}" does not match "<schema-major>+<12-hex>" (design §6.3)`,
  );
}

// ---------------------------------------------------------------------------
// B2 — Given the built corpus, relations edges are non-empty and every
// sampled endpoint resolves in corpus.index; the symbol-keyed changelog map
// is present (2752-AC2). Empty {} is legitimate pre-first-docs-v*-tag
// (design §5.4 seed) — this case asserts presence/shape, not non-emptiness,
// of the changelog map.
// ---------------------------------------------------------------------------
function caseRelationsAndChangelogPresent() {
  const result = runBuild();
  assert(
    result.status === 0,
    `expected "node corpus/build.mjs" to exit 0, got exit ${result.status}\n${combinedOutput(result)}`,
  );
  const corpus = readCorpus();
  assert(
    Array.isArray(corpus.relations.edges) && corpus.relations.edges.length > 0,
    'corpus.relations.edges must be non-empty (2752-AC2)',
  );
  const unresolved = corpus.relations.edges.filter(
    (e) => !(corpus.index[e.from] && corpus.index[e.to]),
  );
  assert(
    unresolved.length === 0,
    `${unresolved.length} relation edge(s) have an endpoint that does not resolve in corpus.index, e.g. ${JSON.stringify(unresolved[0])}`,
  );
  assert(
    typeof corpus.changelog.bySymbol === 'object' &&
      corpus.changelog.bySymbol !== null &&
      !Array.isArray(corpus.changelog.bySymbol),
    'corpus.changelog.bySymbol must be a keyed map, present even when empty (design §5.4 seed)',
  );
}

// ---------------------------------------------------------------------------
// B5 — Given corpus.json, when grepped for renderer markup, then none exists
// (2752-AC5). Same structural regex as the AC5 read-back — matches
// component *tags* (`<Note ...>`, `</Note>`), not the bare word (a substring
// like "mintlify" in ingested ADR prose is data, not markup).
// ---------------------------------------------------------------------------
function caseRendererIndependent() {
  const result = runBuild();
  assert(
    result.status === 0,
    `expected "node corpus/build.mjs" to exit 0, got exit ${result.status}\n${combinedOutput(result)}`,
  );
  const raw = fs.readFileSync(CORPUS_JSON_PATH, 'utf8');
  const markupPattern = /<\/?(Note|Warning|Tip|Card|Accordion|CodeGroup|Steps|Tabs)[ >/]/;
  const match = raw.match(markupPattern);
  assert(
    !match,
    `corpus.json carries renderer markup, forbidden by 2752-AC5 — first match: ${match && match[0]}`,
  );
}

// ---------------------------------------------------------------------------
// B13 — Given the seed glossary, when built, every term compiles to
// {term, kind, aliases, definition, referents[{type,id}]} and every referent
// resolves in corpus.index (3003-AC1). Named `glossary-compiles` — this
// exact case id is the one tasks.md T1's Reality Check cites
// ("node docs/corpus/build.selftest.mjs --case glossary-compiles").
// ---------------------------------------------------------------------------
function caseGlossaryCompiles() {
  const result = runBuild();
  assert(
    result.status === 0,
    `expected "node corpus/build.mjs" to exit 0, got exit ${result.status}\n${combinedOutput(result)}`,
  );
  const corpus = readCorpus();
  const terms = corpus.glossary.terms;
  const slugs = Object.keys(terms);
  assert(
    slugs.length > 0,
    'corpus.glossary.terms is empty — expected the seed glossary (docs/corpus/glossary.yaml, ~10 core terms) to compile in (3003-AC1)',
  );
  const validTypes = new Set(['symbol', 'guide', 'adr', 'example']);
  for (const slug of slugs) {
    const t = terms[slug];
    assert(typeof t.term === 'string' && t.term.length > 0, `glossary term "${slug}" missing .term`);
    assert(t.kind === 'domain' || t.kind === 'system', `glossary term "${slug}" has invalid .kind "${t.kind}"`);
    assert(Array.isArray(t.aliases), `glossary term "${slug}" .aliases is not an array`);
    assert(
      typeof t.definition === 'string' && t.definition.length > 0,
      `glossary term "${slug}" missing .definition`,
    );
    assert(
      Array.isArray(t.referents) && t.referents.length > 0,
      `glossary term "${slug}" has no referents`,
    );
    for (const r of t.referents) {
      assert(
        validTypes.has(r.type),
        `glossary term "${slug}" referent has invalid .type "${r.type}"`,
      );
      assert(
        Boolean(corpus.index[r.id]),
        `glossary term "${slug}" referent "${r.id}" does not resolve in corpus.index (3003-AC2 is the drift-check leg; this case proves the happy path resolves)`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// RED — negative control. A malformed glossary entry (referents not an
// array) must fail corpus:build, naming the file and the reason, rather
// than silently compiling in a broken term. Backs up + restores the real
// glossary.yaml unconditionally around the single swapped-in run.
// ---------------------------------------------------------------------------
function caseMalformedGlossaryFailsBuild() {
  assert(
    fs.existsSync(FIXTURE_MALFORMED_GLOSSARY),
    `missing fixture: ${FIXTURE_MALFORMED_GLOSSARY}`,
  );
  const original = fs.readFileSync(GLOSSARY_PATH, 'utf8');
  const malformed = fs.readFileSync(FIXTURE_MALFORMED_GLOSSARY, 'utf8');
  try {
    fs.writeFileSync(GLOSSARY_PATH, malformed);
    const result = runBuild();
    const combined = combinedOutput(result);
    assert(
      result.status !== 0,
      `expected "node corpus/build.mjs" to exit non-zero on a malformed glossary entry (referents not an array), got exit ${result.status}\n${combined}`,
    );
    assert(
      /glossary\.yaml/.test(combined),
      `expected the failure output to name glossary.yaml (2753-AC4 failure-output convention), got:\n${combined}`,
    );
    assert(
      /malformed glossary entry/i.test(combined),
      `expected the failure output to name the malformed-entry reason, got:\n${combined}`,
    );
    assert(
      /referents/i.test(combined),
      `expected the failure output to name this fixture's specific defect ("referents"), not an unrelated failure — RED-for-the-right-reason, got:\n${combined}`,
    );
  } finally {
    fs.writeFileSync(GLOSSARY_PATH, original);
  }
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------
const CASES = [
  { id: 'b1-clean-build-all-sections', bdd: 'B1 / 2752-AC1', fn: caseCleanBuildAllSections },
  { id: 'b2-relations-and-changelog-present', bdd: 'B2 / 2752-AC2', fn: caseRelationsAndChangelogPresent },
  { id: 'b5-renderer-independent', bdd: 'B5 / 2752-AC5', fn: caseRendererIndependent },
  { id: 'glossary-compiles', bdd: 'B13 / 3003-AC1', fn: caseGlossaryCompiles },
  {
    id: 'red-malformed-glossary-fails-build',
    bdd: 'RED negative control / 2753-AC1 corpus:build failure mode',
    fn: caseMalformedGlossaryFailsBuild,
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
  console.log(`\n${toRun.length - failures}/${toRun.length} build.selftest.mjs cases passed`);
  process.exit(failures ? 1 : 0);
}

main();
