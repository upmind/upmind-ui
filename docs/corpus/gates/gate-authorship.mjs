#!/usr/bin/env node
// docs/corpus/gates/gate-authorship.mjs — FE-2752 T9 (design §8, FE-2950)
//
// The authorship guard: the one gate that proves the generated developer-docs
// partition and the machine-owned corpus artifacts were produced by the
// pipeline and never hand-edited (ADR-026 decision 1: "derived build artifact,
// never authored"). It closes the dual-authoring back-door FE-2950 exists to
// forbid.
//
// COMMITTED-TREE-ONLY (design §8.2): this gate reads ONLY the artifacts already
// in the checkout — no `build.mjs` run, no TypeDoc, no git history or tags. That
// is what keeps it <1 min (§7.5), lets it run in parallel with `corpus:build`,
// and makes its verdict independent of how far history has moved past
// `meta.source_commit` (§5.4). The one process it spawns is `emit-mdx.mjs`, which
// is itself a pure function of the committed `corpus.json` (design §6.3) — the
// replay, not a rebuild.
//
// FOUR checks over the §8.1 manifest (each manifest path has exactly one guard):
//   1. Emit replay        — re-emit from the committed corpus into a temp dir and
//                           byte-exact `diff -r` against the committed
//                           reference/** + changelog/** + corpus-version.json.
//                           No normalization: emit is deterministic (§6.3) and
//                           EOL is pinned LF via .gitattributes (§8.2), so any
//                           difference is a real hand-edit. (design §8.2 check 1)
//   2. Corpus integrity   — recompute the canonical content hash of the committed
//                           corpus.json and compare to the hash segment of
//                           meta.corpus_version. (design §8.2 check 2, §6.3)
//   3. Relations pin      — recompute sha256 of the committed relations.json and
//                           compare to meta.relationsSha256. relations.json is
//                           exempt from regen-compare (CI cannot regenerate it —
//                           graphify-out is untracked, §2.4). (design §8.2 check 3)
//   4. Provenance         — every generated page carries the full eight-key
//                           frontmatter with `generated: true`; every page OUTSIDE
//                           the partition carries NO `generated` key (absence, not
//                           `false` — the one-bit boundary). (design §8.3)
//
// Plain node ESM, no runtime deps (matching build.mjs / emit-mdx.mjs).
//
// Contract (convention adopted from agent:ci/docs-corpus-gate.mjs):
//   node docs/corpus/gates/gate-authorship.mjs                 (all four checks)
//   node docs/corpus/gates/gate-authorship.mjs --check-provenance  (check 4 only)
//   node docs/corpus/gates/gate-authorship.mjs --print-manifest    (manifest, exit 0)
//   Output one finding per line: `<file> — <reason>`. All findings print before
//   exit. Exit 0 = clean; exit 1 = at least one finding. Fail-closed: an
//   unreadable input (missing corpus.json, un-spawnable emitter, …) is a finding,
//   never a silent pass.

import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// --- anchors (cwd-independent) ---------------------------------------------
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url)); // <root>/docs/corpus/gates
const CORPUS_DIR = resolve(SCRIPT_DIR, '..'); //               <root>/docs/corpus
const DOCS_DIR = resolve(CORPUS_DIR, '..'); //                 <root>/docs
const ROOT = resolve(DOCS_DIR, '..'); //                       <root>

const EMIT_SCRIPT = join(CORPUS_DIR, 'emit-mdx.mjs');
const CORPUS_JSON = join(CORPUS_DIR, 'corpus.json');
const RELATIONS_JSON = join(CORPUS_DIR, 'relations.json');
const DEVELOPERS_DIR = join(DOCS_DIR, 'published-docs', 'developers');
const REF_DIR = join(DEVELOPERS_DIR, 'reference');
const CHANGELOG_DIR = join(DEVELOPERS_DIR, 'changelog');
const VERSION_JSON = join(DEVELOPERS_DIR, 'corpus-version.json');

// The §8.1 machine-owned path manifest — the single source of truth for what
// this gate guards, printable via --print-manifest (2950-AC1).
const MANIFEST = [
  'docs/published-docs/developers/reference/**',
  'docs/published-docs/developers/changelog/**',
  'docs/published-docs/developers/corpus-version.json',
  'docs/corpus/corpus.json',
  'docs/corpus/relations.json',
];

// The eight provenance keys every generated page must carry (design §6.2/§8.3).
const PROVENANCE_KEYS = [
  'generated',
  'corpus_version',
  'built_at',
  'id',
  'audience',
  'module',
  'status',
  'last-verified-against-commit',
];

const REMEDY = 'regenerate with pnpm --filter docs corpus:build && pnpm --filter docs corpus:emit';

const toRel = (fp) => relative(ROOT, fp).replace(/\\/g, '/');

// ---------------------------------------------------------------------------
// Canonical serialization + hashing — COPIED VERBATIM from build.mjs so the
// integrity pin (check 2) recomputes the exact same content hash build.mjs
// stamped into meta.corpus_version. If build.mjs's canonical form ever changes,
// both move together (they must, or the pin false-REDs).
// ---------------------------------------------------------------------------
function sortDeep(v) {
  if (Array.isArray(v)) return v.map(sortDeep);
  if (v && typeof v === 'object') {
    const out = {};
    for (const k of Object.keys(v).sort()) out[k] = sortDeep(v[k]);
    return out;
  }
  return v;
}
const stableStringify = (v) => JSON.stringify(sortDeep(v), null, 2) + '\n';
const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

// ---------------------------------------------------------------------------
// Small fs helpers.
// ---------------------------------------------------------------------------
function walkFiles(dir, base = dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walkFiles(full, base, out);
    else out.push(relative(base, full).replace(/\\/g, '/'));
  }
  return out;
}

// Parse a leading YAML frontmatter block into a flat key set + `generated` value.
// The emitter writes flat `key: value` frontmatter (design §6.2); this reader is
// scoped to that shape deliberately (no yaml dep, matching build.mjs).
function parseFrontmatter(text) {
  if (!text.startsWith('---\n') && !text.startsWith('---\r\n')) return null;
  const end = text.indexOf('\n---', 3);
  if (end === -1) return null;
  const block = text.slice(text.indexOf('\n') + 1, end);
  const keys = new Map();
  for (const line of block.split('\n')) {
    const m = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line);
    if (m) keys.set(m[1], m[2].replace(/^["']|["']$/g, '').trim());
  }
  return keys;
}

// ---------------------------------------------------------------------------
// Check 1 — emit replay (design §8.2 check 1). Re-emit from the COMMITTED
// corpus.json into a throwaway temp dir, then byte-exact compare against the
// committed generated tree. emit-mdx.mjs reads corpus.json from its own dir
// (the committed working copy) — this is the replay, not a rebuild.
// ---------------------------------------------------------------------------
function checkEmitReplay(findings) {
  if (!existsSync(EMIT_SCRIPT)) {
    findings.push(`${toRel(EMIT_SCRIPT)} — emitter missing; cannot replay the generated tree`);
    return;
  }
  if (!existsSync(CORPUS_JSON)) {
    findings.push(`${toRel(CORPUS_JSON)} — corpus missing; cannot replay the generated tree`);
    return;
  }
  const tmp = mkdtempSync(join(tmpdir(), 'gate-authorship-emit-'));
  try {
    const res = spawnSync(process.execPath, [EMIT_SCRIPT, '--out', tmp], {
      cwd: ROOT,
      encoding: 'utf8',
    });
    if (res.error) {
      findings.push(`${toRel(EMIT_SCRIPT)} — could not spawn emitter (${res.error.message})`);
      return;
    }
    if (res.status !== 0) {
      const tail = (res.stderr ?? '').trim().split('\n').slice(-3).join(' | ');
      findings.push(`${toRel(EMIT_SCRIPT)} — emit replay failed (exit ${res.status})${tail ? `: ${tail}` : ''}`);
      return;
    }

    // Compare each partition root; then the single version file.
    const dirPairs = [
      { committed: REF_DIR, emitted: join(tmp, 'reference'), label: 'reference' },
      { committed: CHANGELOG_DIR, emitted: join(tmp, 'changelog'), label: 'changelog' },
    ];
    for (const { committed, emitted } of dirPairs) {
      const cFiles = new Set(walkFiles(committed));
      const eFiles = new Set(walkFiles(emitted));
      for (const rel of [...new Set([...cFiles, ...eFiles])].sort()) {
        const cAbs = join(committed, rel);
        const eAbs = join(emitted, rel);
        const display = toRel(cAbs);
        if (!cFiles.has(rel)) {
          findings.push(`${display} — emit produced a generated file absent from the committed tree (${REMEDY})`);
        } else if (!eFiles.has(rel)) {
          findings.push(`${display} — committed generated file not reproduced by the emitter — hand-added or stale (${REMEDY})`);
        } else if (Buffer.compare(readFileSync(cAbs), readFileSync(eAbs)) !== 0) {
          findings.push(`${display} — hand-edited generated file (${REMEDY})`);
        }
      }
    }
    // corpus-version.json (single manifest file).
    const emittedVersion = join(tmp, 'corpus-version.json');
    const cHas = existsSync(VERSION_JSON);
    const eHas = existsSync(emittedVersion);
    if (!cHas && eHas) {
      findings.push(`${toRel(VERSION_JSON)} — emit produced the version marker but it is absent from the committed tree (${REMEDY})`);
    } else if (cHas && !eHas) {
      findings.push(`${toRel(VERSION_JSON)} — committed version marker not reproduced by the emitter (${REMEDY})`);
    } else if (cHas && eHas && Buffer.compare(readFileSync(VERSION_JSON), readFileSync(emittedVersion)) !== 0) {
      findings.push(`${toRel(VERSION_JSON)} — hand-edited generated file (${REMEDY})`);
    }
  } finally {
    try {
      rmSync(tmp, { recursive: true, force: true });
    } catch {
      /* best-effort */
    }
  }
}

// ---------------------------------------------------------------------------
// Check 2 — corpus integrity pin (design §8.2 check 2, §6.3). Recompute the
// canonical content hash of the committed corpus.json and compare to the hash
// segment of meta.corpus_version.
// ---------------------------------------------------------------------------
function checkCorpusPin(findings) {
  if (!existsSync(CORPUS_JSON)) {
    findings.push(`${toRel(CORPUS_JSON)} — missing corpus.json (${REMEDY})`);
    return;
  }
  let corpus;
  try {
    corpus = JSON.parse(readFileSync(CORPUS_JSON, 'utf8'));
  } catch (err) {
    findings.push(`${toRel(CORPUS_JSON)} — not valid JSON (${err.message})`);
    return;
  }
  const embedded = String(corpus?.meta?.corpus_version ?? '').split('+')[1];
  if (!embedded) {
    findings.push(`${toRel(CORPUS_JSON)} — meta.corpus_version has no content-hash segment (${REMEDY})`);
    return;
  }
  // Exactly build.mjs's content selection: every section EXCEPT the volatile meta.
  const content = {
    symbols: corpus.symbols,
    guides: corpus.guides,
    adrs: corpus.adrs,
    examples: corpus.examples,
    relations: corpus.relations,
    changelog: corpus.changelog,
    glossary: corpus.glossary,
    index: corpus.index,
  };
  const recomputed = sha256(stableStringify(content)).slice(0, 12);
  if (recomputed !== embedded) {
    findings.push(`${toRel(CORPUS_JSON)} — hand-edited (content hash ${recomputed} != pinned ${embedded}; regenerate with corpus:build)`);
  }
}

// ---------------------------------------------------------------------------
// Check 3 — relations pin (design §8.2 check 3). Recompute sha256 of the
// committed relations.json and compare to meta.relationsSha256.
// ---------------------------------------------------------------------------
function checkRelationsPin(findings) {
  if (!existsSync(CORPUS_JSON)) return; // already reported by check 2
  if (!existsSync(RELATIONS_JSON)) {
    findings.push(`${toRel(RELATIONS_JSON)} — missing relations snapshot (re-run extract-relations.mjs + corpus:build)`);
    return;
  }
  let meta;
  try {
    meta = JSON.parse(readFileSync(CORPUS_JSON, 'utf8')).meta;
  } catch {
    return; // check 2 owns the parse-failure finding
  }
  const pinned = meta?.relationsSha256;
  if (!pinned) {
    findings.push(`${toRel(CORPUS_JSON)} — meta.relationsSha256 missing (regenerate with corpus:build)`);
    return;
  }
  const actual = sha256(readFileSync(RELATIONS_JSON));
  if (actual !== pinned) {
    findings.push(`${toRel(RELATIONS_JSON)} — edited without corpus:build (sha256 ${actual.slice(0, 12)}… != pinned ${String(pinned).slice(0, 12)}…; re-run extract-relations.mjs + corpus:build)`);
  }
}

// ---------------------------------------------------------------------------
// Check 4 — provenance, both directions (design §8.3, 2950-AC3/AC4).
// ---------------------------------------------------------------------------
function checkProvenance(findings) {
  // (a) Inside the partition: every generated page carries all eight keys and
  //     generated: true.
  for (const { dir, audience } of [
    { dir: REF_DIR, audience: 'reference' },
    { dir: CHANGELOG_DIR, audience: 'changelog' },
  ]) {
    for (const rel of walkFiles(dir)) {
      if (!rel.endsWith('.mdx') && !rel.endsWith('.md')) continue;
      const abs = join(dir, rel);
      const display = toRel(abs);
      const keys = parseFrontmatter(readFileSync(abs, 'utf8'));
      if (!keys) {
        findings.push(`${display} — generated ${audience} page has no frontmatter block`);
        continue;
      }
      for (const k of PROVENANCE_KEYS) {
        if (!keys.has(k)) findings.push(`${display} — missing provenance key "${k}"`);
      }
      if (keys.has('generated') && keys.get('generated') !== 'true') {
        findings.push(`${display} — provenance key "generated" must be true (got "${keys.get('generated')}")`);
      }
    }
  }

  // (b) Outside the partition: NO page may carry a `generated` key (absence is
  //     the one-bit boundary — 2950-AC4). Walk docs/published-docs/developers skipping the two
  //     generated dirs and the JSON version marker.
  if (!existsSync(DEVELOPERS_DIR)) return;
  for (const rel of walkFiles(DEVELOPERS_DIR)) {
    if (rel.startsWith('reference/') || rel.startsWith('changelog/')) continue;
    if (rel === 'corpus-version.json') continue;
    if (!rel.endsWith('.mdx') && !rel.endsWith('.md')) continue;
    const abs = join(DEVELOPERS_DIR, rel);
    const keys = parseFrontmatter(readFileSync(abs, 'utf8'));
    if (keys && keys.has('generated')) {
      findings.push(`${toRel(abs)} — hand-authored page carries a "generated" key (boundary violation, 2950-AC4)`);
    }
  }
}

// ---------------------------------------------------------------------------
// Driver.
// ---------------------------------------------------------------------------
function report(findings, okSummary) {
  if (findings.length) {
    for (const f of findings) console.error(f);
    console.error(`gate:authorship: ${findings.length} finding(s) — the generated partition is not a faithful build artifact`);
    process.exit(1);
  }
  console.log(okSummary);
  process.exit(0);
}

const argv = process.argv.slice(2);

if (argv.includes('--print-manifest')) {
  for (const p of MANIFEST) console.log(p);
  process.exit(0);
}

if (argv.includes('--check-provenance')) {
  const findings = [];
  checkProvenance(findings);
  const refCount = walkFiles(REF_DIR).filter((f) => f.endsWith('.mdx') || f.endsWith('.md')).length;
  const logCount = walkFiles(CHANGELOG_DIR).filter((f) => f.endsWith('.mdx') || f.endsWith('.md')).length;
  report(findings, `gate:authorship: provenance OK — ${refCount + logCount} generated page(s) carry all ${PROVENANCE_KEYS.length} keys; no hand-authored page carries a generated flag`);
}

// Default: the full guard — all four checks (design §7.1 "emit replay + integrity
// pins + provenance validation").
const findings = [];
checkEmitReplay(findings);
checkCorpusPin(findings);
checkRelationsPin(findings);
checkProvenance(findings);

const genCount =
  walkFiles(REF_DIR).filter((f) => f.endsWith('.mdx') || f.endsWith('.md')).length +
  walkFiles(CHANGELOG_DIR).filter((f) => f.endsWith('.mdx') || f.endsWith('.md')).length;
report(
  findings,
  `gate:authorship: OK — ${genCount} generated page(s) verified (emit replay byte-exact, corpus + relations pins matched, provenance complete)`,
);
