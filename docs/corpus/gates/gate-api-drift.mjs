#!/usr/bin/env node
// docs/corpus/gates/gate-api-drift.mjs — FE-2752 T7 (design §7.1, §9; 2753-AC1/AC4).
//
// The API-drift gate: does the documented API surface still match reality?
// It answers that by a three-way comparison —
//
//   FRESH      the `symbols` section rebuilt from the fresh TypeDoc reflection
//              (`docs/corpus/.reflection.json`) that `corpus:build` produced
//              this pipeline — the ground truth of what `packages/*/src`
//              exports RIGHT NOW.
//   COMMITTED  the `symbols` section of the checked-in `docs/corpus/corpus.json`
//              — what the corpus CLAIMS the API is.
//   EMITTED    the per-symbol pages under `docs/published-docs/developers/reference/**` — the
//              `id` (frontmatter) + `## Signature` fence of what is published.
//
// Any add / removal / signature or kind change between FRESH and COMMITTED, and
// any EMITTED page whose id no longer resolves in FRESH (a stale page) or whose
// signature has drifted, is a finding. A renamed export with un-regenerated docs
// therefore REDs, naming both the drifted symbol and the stale page (2753-AC1).
//
// NO second TypeDoc run (design T7 / §7.1): the gate CONSUMES `corpus:build`'s
// reflection artifact and reuses `build.mjs`'s exported `buildSymbols` mapping,
// so exactly one place absorbs any reflection-shape change (design §9) — a
// hand-rolled second mapping here would itself manufacture false drift.
//
// CI wiring note (for T11): `corpus:build` must publish `docs/corpus/.reflection.json`
// as the artifact this job consumes and must NOT clobber the checked-out
// `docs/corpus/corpus.json` (that file stays the COMMITTED view the diff needs).
// `gate:api-drift needs: [corpus:build]` (design §7.1). Freshness of the corpus
// hash / emitted-tree bytes is `gate:authorship`'s job (§8.2); this gate owns
// only the corpus↔code API surface.
//
// Plain node ESM, no runtime deps (matching build.mjs / emit-mdx.mjs so CI runs
// it with bare `node`, no workspace install).
//
// Contract:
//   node docs/corpus/gates/gate-api-drift.mjs            (default root = repo root)
//   node docs/corpus/gates/gate-api-drift.mjs <root>     (fixture tree root)
//   node docs/corpus/gates/gate-api-drift.mjs --root <r>
// Output one finding per line: `<file>:<line-or-block> — <reason>` (paths
// relative to <root>). Exit 0 no drift. Exit 1 at least one finding — ALL are
// printed first. Fail-closed: a missing / unreadable reflection, corpus, or
// reference tree resolves to a finding, never a silent pass.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSymbols } from '../build.mjs';

const SELF = 'gate:api-drift';
const HEADLESS_PKG = '@upmind-automation/headless'; // build.mjs's entry package (§2.1/§5.1)

// --- anchors + args --------------------------------------------------------
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url)); // <root>/docs/corpus/gates
const DEFAULT_ROOT = resolve(SCRIPT_DIR, '..', '..', '..'); // <root>

// Optional root override: a positional `<root>` or `--root <dir>` retargets the
// whole check onto a fixture tree (the T5/T10 drift fixtures). Default = repo root.
function parseRoot(argv) {
  const i = argv.indexOf('--root');
  const flag = i !== -1 ? argv[i + 1] : null;
  const positional = argv.find((a, n) => !a.startsWith('-') && argv[n - 1] !== '--root');
  return resolve(process.cwd(), flag ?? positional ?? DEFAULT_ROOT);
}
const ROOT = parseRoot(process.argv.slice(2));

const REFLECTION_PATH = join(ROOT, 'docs/corpus/.reflection.json');
const CORPUS_PATH = join(ROOT, 'docs/corpus/corpus.json');
const REF_TREE = join(ROOT, 'docs/published-docs/developers/reference');

const rel = (abs) => relative(ROOT, abs).replace(/\\/g, '/') || abs;
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
// Compare signatures/kinds whitespace-insensitively — the emitter collapses
// blank runs, so a byte diff there would be noise, not drift.
const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

// --- fail-closed exit (unreadable input → RED, never a silent pass) --------
function failClosed(file, reason) {
  process.stdout.write(`${SELF}: RED — fail-closed (cannot verify API drift).\n\n`);
  process.stdout.write(`${file} — ${reason}\n`);
  process.exit(1);
}

function readJson(path, label) {
  if (!existsSync(path))
    failClosed(rel(path), `${label} not found — run \`pnpm --filter docs corpus:build\` first (fail-closed)`);
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    return failClosed(rel(path), `${label} is not valid JSON — ${err.message} (fail-closed)`);
  }
}

// --- emitted-page parsing --------------------------------------------------
function walkMdx(dir, out = []) {
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walkMdx(full, out);
    else if (name.endsWith('.mdx')) out.push(full);
  }
  return out;
}

const frontmatterBlock = (text) => {
  const m = /^---\n([\s\S]*?)\n---/.exec(text);
  return m ? m[1] : '';
};
function frontmatterId(text) {
  const m = /^id:\s*(.+?)\s*$/m.exec(frontmatterBlock(text));
  return m ? m[1].replace(/^"|"$/g, '') : null;
}
// The signature is the first fenced code block after the `## Signature` heading
// (emit-mdx.mjs §6.1 symbolPage layout).
function signatureFromPage(text) {
  const idx = text.indexOf('\n## Signature');
  if (idx === -1) return null;
  const m = /```[A-Za-z]*\n([\s\S]*?)\n```/.exec(text.slice(idx));
  return m ? m[1] : null;
}
function lineOf(text, re) {
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) if (re.test(lines[i])) return i + 1;
  return 1;
}

// ---------------------------------------------------------------------------
// Load the two JSON inputs (fail-closed on either) + validate the reflection
// carries the headless package module before handing it to buildSymbols (whose
// own guard would exit with a build-flavoured message — reframe it as a gate
// fail-closed finding instead).
// ---------------------------------------------------------------------------
const reflection = readJson(REFLECTION_PATH, 'fresh TypeDoc reflection (docs/corpus/.reflection.json)');
const corpus = readJson(CORPUS_PATH, 'committed corpus (docs/corpus/corpus.json)');

if (!Array.isArray(reflection.children) || !reflection.children.some((c) => c.kind === 2 && c.name === HEADLESS_PKG))
  failClosed(rel(REFLECTION_PATH), `reflection has no ${HEADLESS_PKG} package module (fail-closed)`);

const committed = corpus.symbols;
if (!committed || typeof committed !== 'object' || Array.isArray(committed))
  failClosed(rel(CORPUS_PATH), 'corpus.json has no `symbols` section (fail-closed)');

// FRESH — reuse build.mjs's mapping so the comparison is against build.mjs's own
// output shape, not a re-derivation (design §9).
const { symbols: fresh } = buildSymbols(reflection);

// ---------------------------------------------------------------------------
// Diff. All findings collected, then printed sorted before a single exit.
// ---------------------------------------------------------------------------
const findings = [];
const add = (file, loc, reason) => findings.push({ file, loc: String(loc), reason });

const freshIds = Object.keys(fresh);
const committedIds = Object.keys(committed);
const freshSet = new Set(freshIds);
const committedSet = new Set(committedIds);
const REGEN = 'run `pnpm --filter docs corpus:build && pnpm --filter docs corpus:emit`';

// Removed / renamed: documented in the corpus, gone from source.
for (const id of committedIds) {
  if (freshSet.has(id)) continue;
  const s = committed[id];
  add(
    s?.sourceFile ?? 'docs/corpus/corpus.json',
    s?.sourceLine ?? 'symbols',
    `removed or renamed export still documented: ${id} — no longer exported from packages/*/src (${REGEN})`,
  );
}

// Added: exported by source, absent from the committed corpus.
for (const id of freshIds) {
  if (committedSet.has(id)) continue;
  const s = fresh[id];
  add(s.sourceFile, s.sourceLine, `exported symbol missing from the committed corpus: ${id} — corpus not regenerated (${REGEN})`);
}

// Signature / kind drift on symbols present in both.
for (const id of freshIds) {
  if (!committedSet.has(id)) continue;
  const f = fresh[id];
  const c = committed[id];
  if (norm(f.kind) !== norm(c.kind))
    add(f.sourceFile, f.sourceLine, `kind drift: ${id} — corpus "${c.kind}" vs source "${f.kind}" (${REGEN})`);
  if (norm(f.signature) !== norm(c.signature))
    add(
      f.sourceFile,
      f.sourceLine,
      `signature drift: ${id} — corpus ${JSON.stringify(c.signature)} vs source ${JSON.stringify(f.signature)} (${REGEN})`,
    );
}

// Emitted reference tree: every page must document a live symbol with the live
// signature. A page whose id no longer resolves in FRESH is a stale page.
if (!existsSync(REF_TREE)) {
  add(rel(REF_TREE), 'tree', `emitted reference tree not found — cannot verify emitted API against source (fail-closed)`);
} else {
  for (const abs of walkMdx(REF_TREE)) {
    const relPath = rel(abs);
    let text;
    try {
      text = readFileSync(abs, 'utf8');
    } catch (err) {
      add(relPath, '1', `unreadable emitted page — ${err.message}`);
      continue;
    }
    const id = frontmatterId(text);
    if (!id) continue; // defensive: symbol pages always carry an `id` (emit §6.2)
    if (!freshSet.has(id)) {
      add(relPath, lineOf(text, /^id:/), `stale page documents ${id} which no longer exists in packages/*/src — delete or regenerate (${REGEN})`);
      continue;
    }
    const pageSig = signatureFromPage(text);
    if (pageSig != null && norm(pageSig) !== norm(fresh[id].signature))
      add(
        relPath,
        lineOf(text, /^## Signature/),
        `stale page signature for ${id} — page ${JSON.stringify(pageSig)} vs source ${JSON.stringify(fresh[id].signature)} (${REGEN})`,
      );
  }
}

// ---------------------------------------------------------------------------
// Report + exit.
// ---------------------------------------------------------------------------
if (findings.length === 0) {
  console.log(
    `${SELF}: OK — ${freshIds.length} source symbol(s) match the committed corpus and emitted reference tree; no API drift.`,
  );
  process.exit(0);
}

process.stdout.write(
  `${SELF}: RED — ${findings.length} API-drift finding(s). The documented API surface ` +
    `(corpus + emitted reference tree) has drifted from packages/*/src. Regenerate with ` +
    `\`pnpm --filter docs corpus:build && pnpm --filter docs corpus:emit\` and commit.\n\n`,
);
findings.sort((a, b) => cmp(a.file, b.file) || cmp(a.loc, b.loc) || cmp(a.reason, b.reason));
for (const f of findings) process.stdout.write(`${f.file}:${f.loc} — ${f.reason}\n`);
process.exit(1);
