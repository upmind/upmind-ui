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
//   node docs/corpus/gates/gate-authorship.mjs --pages <dir>   (FE-3271: no check 1;
//        check 4(a) reads <dir>/reference + <dir>/changelog; empty/missing = fail-closed)
//   node docs/corpus/gates/gate-authorship.mjs --check-preview --sub <dir> --remote <r>
//        --branch <b> --base <ref> --lease-out <file>   (FE-3271: preview-branch check
//        only; writes PREVIEW_LEASE_SHA=<sha|none> on exit 0)
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
  writeFileSync,
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

const toRel = (fp) => {
  const r = relative(ROOT, fp).replace(/\\/g, '/');
  return r.startsWith('../') ? fp : r;
};

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
function checkProvenance(findings, { refDir = REF_DIR, changelogDir = CHANGELOG_DIR } = {}) {
  // (a) Inside the partition: every generated page carries all eight keys and
  //     generated: true.
  for (const { dir, audience } of [
    { dir: refDir, audience: 'reference' },
    { dir: changelogDir, audience: 'changelog' },
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
// `--pages <dir>` (FE-3271 B4): the fresh emit that check 4(a) reads instead of
// the committed partition. Fail-closed on a missing dir or an empty reference.
// ---------------------------------------------------------------------------
const isPage = (f) => f.endsWith('.mdx') || f.endsWith('.md');

function resolvePages(argv, findings) {
  const i = argv.indexOf('--pages');
  if (i === -1) return null;
  const arg = argv[i + 1];
  if (!arg || arg.startsWith('-')) {
    findings.push(`--pages — no directory given (fail-closed)`);
    return { refDir: null, changelogDir: null };
  }
  const dir = resolve(process.cwd(), arg);
  const refDir = join(dir, 'reference');
  if (!existsSync(dir)) {
    findings.push(`${dir} — --pages directory not found (fail-closed)`);
  } else if (!existsSync(refDir)) {
    findings.push(`${refDir} — --pages directory has no reference/ (fail-closed)`);
  } else if (!walkFiles(refDir).some((f) => f.endsWith('.mdx'))) {
    findings.push(`${refDir} — --pages reference directory has zero .mdx files (fail-closed)`);
  } else {
    return { refDir, changelogDir: join(dir, 'changelog') };
  }
  return { refDir: null, changelogDir: null };
}

const countPages = (dirs) => dirs.reduce((n, d) => n + (d ? walkFiles(d).filter(isPage).length : 0), 0);

// ---------------------------------------------------------------------------
// `--check-preview` (FE-3271 B2): the MR check on the `mintlify-docs` preview
// branch. Reads only git state in --sub and --remote, never the working tree.
// ---------------------------------------------------------------------------
const DOCS_BOT_EMAIL = 'docs-bot@upmind.com';
const PARTITION = ['developers/reference', 'developers/changelog', 'developers/corpus-version.json'];
const PREVIEW_NS = 'refs/remotes/corpus-preview';
const PREVIEW_REMEDY =
  'revert the hand-edit on the preview branch, or delete the preview branch so the next push re-creates it';

const inPartition = (p) =>
  p === 'developers/corpus-version.json' || p.startsWith('developers/reference/') || p.startsWith('developers/changelog/');

function flag(argv, name) {
  const i = argv.indexOf(name);
  return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null;
}

function git(sub, args) {
  const res = spawnSync('git', ['-C', sub, ...args], { encoding: 'utf8' });
  const detail = (res.error?.message ?? res.stderr ?? '').trim().split('\n').slice(-2).join(' | ');
  return { status: res.error ? -1 : res.status, out: (res.stdout ?? '').trim(), detail };
}

const lsRemoteHead = (sub, remote, ref) => git(sub, ['ls-remote', '--exit-code', '--heads', remote, `refs/heads/${ref}`]);
const why = (r) => `exit ${r.status}${r.detail ? `: ${r.detail}` : ''}`;

function checkPreview(argv) {
  const findings = [];
  const sub = flag(argv, '--sub');
  const remote = flag(argv, '--remote');
  const branch = flag(argv, '--branch');
  const base = flag(argv, '--base');
  const leaseOut = flag(argv, '--lease-out');
  for (const [name, value] of [['--sub', sub], ['--remote', remote], ['--branch', branch], ['--base', base], ['--lease-out', leaseOut]]) {
    if (!value) findings.push(`${name} — required by --check-preview (fail-closed)`);
  }
  if (findings.length) return report(findings);

  const subDir = resolve(process.cwd(), sub);
  const leasePath = resolve(process.cwd(), leaseOut);
  if (!existsSync(join(subDir, '.git'))) {
    return report([`${join(subDir, '.git')} — missing .git in --sub; cannot read preview history (fail-closed)`]);
  }

  const head = lsRemoteHead(subDir, remote, branch);
  if (head.status === 2) {
    writeFileSync(leasePath, 'PREVIEW_LEASE_SHA=none\n');
    console.log(`gate:authorship: first push — no preview branch yet (${branch} absent on ${remote})`);
    process.exit(0);
  }
  if (head.status !== 0) return report([`${remote} — cannot list ${branch} on the remote (${why(head)}) (fail-closed)`]);
  const baseHead = lsRemoteHead(subDir, remote, base);
  if (baseHead.status !== 0) return report([`${base} — unknown --base ref on ${remote} (${why(baseHead)}) (fail-closed)`]);

  const baseRef = `${PREVIEW_NS}/${base}`;
  const branchRef = `${PREVIEW_NS}/${branch}`;
  const fetched = git(subDir, ['fetch', '--quiet', '--no-tags', remote, `+refs/heads/${base}:${baseRef}`, `+refs/heads/${branch}:${branchRef}`]);
  if (fetched.status !== 0) return report([`${remote} — fetch of ${base} and ${branch} failed (${why(fetched)}) (fail-closed)`]);
  const branchSha = git(subDir, ['rev-parse', '--verify', `${branchRef}^{commit}`]);
  if (branchSha.status !== 0) return report([`${branch} — unknown ref after fetch (${why(branchSha)}) (fail-closed)`]);

  const log = git(subDir, ['log', '--format=%H%x09%ae', `${baseRef}..${branchRef}`]);
  if (log.status !== 0) return report([`${branch} — cannot read ${base}..${branch} history (${why(log)}) (fail-closed)`]);
  let anchor = log.out
    .split('\n')
    .map((l) => l.split('\t'))
    .find(([, email]) => email === DOCS_BOT_EMAIL)?.[0];
  if (!anchor) {
    const mb = git(subDir, ['merge-base', baseRef, branchRef]);
    if (mb.status !== 0) return report([`${branch} — no merge-base with ${base} (${why(mb)}) (fail-closed)`]);
    anchor = mb.out;
  }

  const diff = git(subDir, ['diff', '--name-only', anchor, branchRef, '--', ...PARTITION]);
  if (diff.status !== 0) return report([`${branch} — cannot diff the partition (${why(diff)}) (fail-closed)`]);
  for (const path of diff.out.split('\n').filter(Boolean)) {
    const by = git(subDir, ['log', '-1', '--format=%h %ae "%s"', `${anchor}..${branchRef}`, '--', path]);
    findings.push(
      `${path} — hand-edit in the generated partition on ${branch} after ${anchor.slice(0, 12)}, by commit ${by.out || 'unknown'} (${PREVIEW_REMEDY})`,
    );
  }

  const tree = git(subDir, ['ls-tree', '-r', '--name-only', branchRef, '--', 'developers/']);
  if (tree.status !== 0) return report([`${branch} — cannot list developers/ (${why(tree)}) (fail-closed)`]);
  for (const path of tree.out.split('\n').filter(Boolean)) {
    if (inPartition(path) || !isPage(path)) continue;
    const shown = git(subDir, ['show', `${branchRef}:${path}`]);
    if (shown.status !== 0) {
      findings.push(`${path} — unreadable on ${branch} (${why(shown)}) (fail-closed)`);
      continue;
    }
    const keys = parseFrontmatter(shown.out);
    if (keys && keys.has('generated')) {
      findings.push(`${path} — hand-authored page on ${branch} carries a "generated" key (boundary violation, 2950-AC4)`);
    }
  }

  if (findings.length) return report(findings);
  writeFileSync(leasePath, `PREVIEW_LEASE_SHA=${branchSha.out}\n`);
  console.log(
    `gate:authorship: preview OK — ${branch} partition equals ${anchor.slice(0, 12)}; no hand-authored page on it carries a generated flag`,
  );
  process.exit(0);
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

if (argv.includes('--check-preview')) checkPreview(argv);

const pagesFindings = [];
const pages = resolvePages(argv, pagesFindings);
const provenanceDirs = pages ?? { refDir: REF_DIR, changelogDir: CHANGELOG_DIR };

if (argv.includes('--check-provenance')) {
  const findings = [...pagesFindings];
  if (!pagesFindings.length) checkProvenance(findings, provenanceDirs);
  const genCount = countPages([provenanceDirs.refDir, provenanceDirs.changelogDir]);
  report(findings, `gate:authorship: provenance OK — ${genCount} generated page(s) carry all ${PROVENANCE_KEYS.length} keys; no hand-authored page carries a generated flag`);
}

// Default: the full guard — all four checks (design §7.1 "emit replay + integrity
// pins + provenance validation"). With --pages, check 1 does not run and check
// 4(a) reads the fresh emit (FE-3271 B4).
const findings = [...pagesFindings];
if (!pages) checkEmitReplay(findings);
checkCorpusPin(findings);
checkRelationsPin(findings);
if (!pagesFindings.length) checkProvenance(findings, provenanceDirs);

const genCount = countPages([provenanceDirs.refDir, provenanceDirs.changelogDir]);
report(
  findings,
  pages
    ? `gate:authorship: OK — ${genCount} fresh generated page(s) verified (corpus + relations pins matched, provenance complete)`
    : `gate:authorship: OK — ${genCount} generated page(s) verified (emit replay byte-exact, corpus + relations pins matched, provenance complete)`,
);
