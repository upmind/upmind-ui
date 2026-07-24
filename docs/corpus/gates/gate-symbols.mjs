#!/usr/bin/env node
// docs/corpus/gates/gate-symbols.mjs — FE-2752 T6 (design §5.5, §7.1)
//
// The symbols drift gate: every DOCUMENTED symbol id and every GLOSSARY referent
// must still resolve against reality. It closes two drift classes with one pass:
//   - 2753-AC1 / 2753-AC4: a documented symbol renamed or removed in
//     `packages/*/src` (docs not regenerated) → RED naming the symbol + its page.
//   - 3003-AC2: a hand-authored `glossary.yaml` referent pointing at a symbol
//     that no longer exists → RED naming the term + the dead referent id.
//
// TWO INPUTS, BOTH READ-ONLY (no second TypeDoc run — design §7.5):
//   1. the committed `docs/corpus/corpus.json` — the DOCUMENTED surface
//      (corpus.symbols) + the compiled glossary (corpus.glossary.terms) +
//      corpus.index (for non-symbol referents).
//   2. `docs/corpus/.reflection.json` — the FRESH TypeDoc reflection artifact
//      produced by `corpus:build` (reused config, entry point `packages/headless`,
//      docs/typedoc.json:4). This is REALITY. The gate derives the live symbol id
//      set from it exactly as build.mjs does, so a resolvable-today symbol never
//      false-REDs and a renamed/removed one always does.
//
// ASYMMETRY (design §5.3): a renamed *machine-derived relation* endpoint is
// pruned at build time; a renamed *hand-authored glossary referent* FAILS CI —
// it encodes human intent and must be corrected by a human. This gate is where
// that intent is kept honest.
//
// Symbol referents (glossary type: symbol) resolve against the FRESH reflection;
// non-symbol referents (adr | guide | example) resolve against `corpus.index`
// (design §5.5, T6 actions) — those documents are ingested read-only and are not
// in the reflection's id space.
//
// Failure-output convention adopted verbatim from agent:ci/docs-corpus-gate.mjs:
//   one finding per line, `<file>:<line-or-block> — <reason>` (2753-AC4); ALL
//   findings print before exit (no fail-fast truncation); fail-closed — an
//   unreadable/absent input is itself a finding, never a silent pass.
//
// Plain node ESM, no runtime deps (matching build.mjs / emit-mdx.mjs siblings).
//
// Usage:
//   node docs/corpus/gates/gate-symbols.mjs                 (real checkout)
//   node docs/corpus/gates/gate-symbols.mjs <root>          (a fixture repo-root:
//        reads <root>/docs/corpus/corpus.json + <root>/docs/corpus/.reflection.json)
//   node docs/corpus/gates/gate-symbols.mjs --corpus <f> --reflection <f>
//        (explicit input pair — the T5/T10 selftests point these at drift fixtures)
//   Exit 0: every documented symbol + every glossary referent resolves.
//   Exit 1: at least one dead symbol or dead referent — all named first.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SELF = 'gate:symbols';
const HEADLESS_PKG = '@upmind-automation/headless';

// --- anchors (cwd-independent) ---------------------------------------------
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url)); // <root>/docs/corpus/gates
const DEFAULT_ROOT = resolve(SCRIPT_DIR, '..', '..', '..'); // <root>

// ---------------------------------------------------------------------------
// args — a fixture repo-root positional (default: the real checkout root) plus
// optional explicit input overrides for the prover's fixture pairs.
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  let root = null;
  let corpusPath = null;
  let reflectionPath = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--corpus') corpusPath = argv[++i] ?? null;
    else if (a === '--reflection') reflectionPath = argv[++i] ?? null;
    else if (!a.startsWith('-') && root === null) root = a;
  }
  const ROOT = root ? resolve(process.cwd(), root) : DEFAULT_ROOT;
  const resolveInput = (v, rel) =>
    v ? (isAbsolute(v) ? v : resolve(process.cwd(), v)) : join(ROOT, rel);
  return {
    ROOT,
    corpusPath: resolveInput(corpusPath, 'docs/corpus/corpus.json'),
    reflectionPath: resolveInput(reflectionPath, 'docs/corpus/.reflection.json'),
  };
}
const { ROOT, corpusPath, reflectionPath } = parseArgs(process.argv.slice(2));

const toRel = (fp) => relative(ROOT, fp).replace(/\\/g, '/') || fp;

// Fail-closed: an input we cannot read is a finding, then exit 1 — never a
// silent pass (design §7 fail-closed posture).
function bail(reason) {
  console.error(`${toRel(corpusPath)} — ${reason}`);
  console.error(`${SELF}: 1 blocking finding (fail-closed).`);
  process.exit(1);
}
function readJson(path, label) {
  if (!existsSync(path)) bail(`${label} not found at ${toRel(path)} — run \`pnpm --filter docs corpus:build\` first`);
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    bail(`${label} at ${toRel(path)} is not valid JSON — ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// Path normalization — copied verbatim from build.mjs so the live symbol id set
// derived here is byte-identical to the set build.mjs emits into corpus.symbols
// (no divergence => no false drift, design §5.3 panel P2-e).
// ---------------------------------------------------------------------------
const TOP_DIRS = ['packages/', 'apps/', 'docs/', 'tests/', 'playgrounds/', 'node_modules/'];
function toRepoRel(fp) {
  let s = String(fp ?? '').replace(/\\/g, '/');
  if (!s) return s;
  if (s.startsWith('/')) s = relative(ROOT, s).replace(/\\/g, '/');
  s = s.replace(/^\.\//, '').replace(/^(?:\.\.\/)+/, '');
  let best = -1;
  for (const t of TOP_DIRS) {
    let from = 0;
    let idx;
    while ((idx = s.indexOf(t, from)) !== -1) {
      if (idx === 0 || s[idx - 1] === '/') {
        if (best === -1 || idx < best) best = idx;
        break;
      }
      from = idx + 1;
    }
  }
  return best > 0 ? s.slice(best) : s;
}

// ---------------------------------------------------------------------------
// The live symbol id set — REALITY, derived from the fresh reflection exactly as
// build.mjs.buildSymbols does (same filter, same id shape `pkg!export`). A
// documented id absent from this set is a renamed/removed export.
// ---------------------------------------------------------------------------
function liveSymbolIds(reflection) {
  const pkg = (reflection.children ?? []).find((c) => c.kind === 2 && c.name === HEADLESS_PKG);
  if (!pkg) bail(`reflection at ${toRel(reflectionPath)} has no ${HEADLESS_PKG} package module — cannot verify symbols`);
  const ids = new Set();
  for (const c of pkg.children ?? []) {
    if (c.flags?.isExternal) continue; // re-exported external decls (xstate, etc.)
    const src = c.sources && c.sources[0];
    if (!src || !src.fileName) continue;
    if (toRepoRel(src.fileName).includes('node_modules')) continue;
    ids.add(`${HEADLESS_PKG}!${c.name}`);
  }
  return ids;
}

// ---------------------------------------------------------------------------
// Doc-page route for a symbol (mirrors emit-mdx.mjs symbolRoute) so a dead
// documented symbol names "the doc page that documents it" (2753-AC4).
// ---------------------------------------------------------------------------
const KIND_DIR = {
  Function: 'functions',
  Class: 'classes',
  Interface: 'interfaces',
  Enum: 'enumerations',
  Variable: 'variables',
  TypeAlias: 'type-aliases',
  '2097152': 'type-aliases',
};
const kebab = (s) =>
  String(s)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
const docPageOf = (sym) =>
  `docs/published-docs/developers/reference/headless/${KIND_DIR[sym.kind] ?? kebab(sym.kind)}/${sym.name}.mdx`;

// ---------------------------------------------------------------------------
// glossary.yaml line locator — points a dead-referent finding at the exact
// source line (best-effort; block form when the file/line is unavailable).
// ---------------------------------------------------------------------------
function glossaryLineIndex() {
  const path = join(ROOT, 'docs/corpus/glossary.yaml');
  if (!existsSync(path)) return null;
  try {
    return readFileSync(path, 'utf8').split('\n');
  } catch {
    return null;
  }
}
function glossaryRef(lines, id) {
  const base = 'docs/corpus/glossary.yaml';
  if (lines) {
    const n = lines.findIndex((l) => l.includes(id));
    if (n !== -1) return `${base}:${n + 1}`;
  }
  return base;
}

// ---------------------------------------------------------------------------
// Run.
// ---------------------------------------------------------------------------
const corpus = readJson(corpusPath, 'corpus.json');
const reflection = readJson(reflectionPath, 'reflection (.reflection.json)');
if (!corpus.symbols || typeof corpus.symbols !== 'object') bail('corpus.symbols is missing or not an object');
const glossaryTerms = corpus.glossary?.terms ?? {};
const index = corpus.index ?? {};

const live = liveSymbolIds(reflection);
const findings = [];

// Check 1 — every documented symbol still resolves in the fresh reflection.
let checkedSymbols = 0;
for (const [id, sym] of Object.entries(corpus.symbols)) {
  checkedSymbols++;
  if (!live.has(id)) {
    findings.push(
      `${docPageOf(sym)} — documented symbol no longer resolves in the fresh TypeDoc reflection ` +
        `(renamed/removed export): ${id}`,
    );
  }
}

// Check 2 — every glossary referent resolves: symbol referents against the fresh
// reflection; adr/guide/example referents against corpus.index (design §5.5).
const glossaryLines = glossaryLineIndex();
const NON_SYMBOL_TYPES = new Set(['adr', 'guide', 'example']);
let checkedReferents = 0;
for (const slug of Object.keys(glossaryTerms).sort()) {
  const term = glossaryTerms[slug];
  for (const ref of term.referents ?? []) {
    checkedReferents++;
    const at = glossaryRef(glossaryLines, ref.id);
    if (ref.type === 'symbol') {
      if (!live.has(ref.id))
        findings.push(
          `${at} — glossary term "${slug}" symbol referent no longer resolves in the fresh ` +
            `TypeDoc reflection (renamed/removed): ${ref.id}`,
        );
    } else if (NON_SYMBOL_TYPES.has(ref.type)) {
      if (!index[ref.id])
        findings.push(
          `${at} — glossary term "${slug}" ${ref.type} referent no longer resolves in ` +
            `corpus.index: ${ref.id}`,
        );
    } else {
      // Unknown referent type — fail-closed (design §7 posture).
      findings.push(
        `${at} — glossary term "${slug}" referent has unknown type "${ref.type}" ` +
          `(expected symbol|adr|guide|example): ${ref.id}`,
      );
    }
  }
}

findings.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
for (const f of findings) console.error(f);

if (findings.length) {
  console.error(
    `${SELF}: ${findings.length} blocking finding(s) — dead documented symbol(s) or glossary ` +
      `referent(s). Fix the source (or run \`pnpm --filter docs corpus:build\`) and re-check.`,
  );
  process.exit(1);
}

console.log(
  `${SELF}: OK — ${checkedSymbols} documented symbol(s) and ${checkedReferents} glossary ` +
    `referent(s) all resolve against the fresh reflection (${live.size} live exports).`,
);
process.exit(0);
