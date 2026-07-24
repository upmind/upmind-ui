#!/usr/bin/env node
// docs/corpus/build.mjs — FE-2752 T3 (design §5.1-§5.6, §6.3)
//
// The corpus builder: the one place that turns the existing TypeDoc pipeline +
// the committed graphify relations snapshot + git history + the hand-authored
// glossary into the typed, renderer-independent `docs/corpus/corpus.json` that
// is the product (ADR-026). Everything downstream (the three drift gates, the
// MDX emitter, in-repo factory agents, the FE-3003 channel) reads this file.
//
// Reused, never re-invented (design §4): symbols come from the existing
// `docs/typedoc.json` reflection (no new extractor); relations come from the
// committed `relations.json` snapshot (no graphify in CI); the changelog is
// derived from git history (no CHANGELOG.md exists). No renderer markup ever
// enters the corpus (2752-AC5) — all renderer concerns live in emit-mdx.mjs.
//
// Plain node ESM, no runtime deps (matching the extract-relations.mjs sibling):
// the glossary YAML is parsed by a purpose-built reader below so CI needs no
// yaml package, and a malformed entry fails the build loudly (design §5.5).
//
// Determinism (design §6.3): the output is a pure function of the checkout +
// inputs, serialized with sorted keys, and obeys the fixed-point meta rule —
// an unchanged content hash preserves the committed `meta` block verbatim so a
// no-change rebuild is byte-identical (the authorship guard, T9, depends on it).
//
// Usage: node corpus/build.mjs   (run via `pnpm --filter docs corpus:build`)
//   Paths are anchored to the repo root computed from this file's location, so
//   the build is correct regardless of the cwd pnpm invokes it with.

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// --- anchors (cwd-independent) ---------------------------------------------
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url)); // <root>/docs/corpus
const DOCS_DIR = resolve(SCRIPT_DIR, '..'); //                <root>/docs
const ROOT = resolve(DOCS_DIR, '..'); //                      <root>
const CORPUS_DIR = SCRIPT_DIR;

const SCHEMA_MAJOR = 1; // bump only on a reflection-shape break (design §9)
const HEADLESS_PKG = '@upmind-automation/headless';

const TYPEDOC_OPTIONS = join(DOCS_DIR, 'typedoc.json');
const REFLECTION_OUT = join(CORPUS_DIR, '.reflection.json'); // gates reuse this
const RELATIONS_IN = join(CORPUS_DIR, 'relations.json');
const GLOSSARY_IN = join(CORPUS_DIR, 'glossary.yaml');
const CORPUS_OUT = join(CORPUS_DIR, 'corpus.json');
const ADR_DIR = join(DOCS_DIR, 'adr');
const GUIDE_GLOB_ROOT = join(DOCS_DIR, '@upmind-automation');

const die = (msg) => {
  console.error(`FAIL (corpus:build): ${msg}`);
  process.exit(1);
};

// ---------------------------------------------------------------------------
// Path normalization (design §5.3 panel P2-e). TypeDoc source filenames and
// graphify source_file must be one repo-relative form before any join or any
// `file:` id is emitted — otherwise the (sourceFile, normLabel) join key and
// the `file:<sourceFile>` id space diverge silently.
// ---------------------------------------------------------------------------
// Monorepo top-level source dirs (pnpm-workspace.yaml). Any leading path noise
// before the first of these — an absolute prefix, a `./`/`../` prefix, or a
// git-worktree prefix like `worktrees/<name>/` that TypeDoc emits when its
// basePath is the git common dir — is collapsed away, so TypeDoc-derived paths
// and graphify's repo-relative source_file share one id space. In a plain CI
// checkout the prefix is absent and this is a no-op.
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

// Normalize a symbol/graphify label to a join key: lowercase, drop any
// trailing call-parens graphify appends to callable nodes (e.g. "doReject()").
const normLabelKey = (v) =>
  String(v ?? '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/\(.*\)$/, '');

// Deterministic serialization: sorted keys everywhere, arrays in order, the
// exact formatting of JSON.stringify(x, null, 2) + trailing newline. The
// content hash and the written file both flow through this one function so the
// fixed-point rule (design §6.3) holds byte-for-byte.
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

// Module dir for a repo-relative source path (design SymbolEntry.module).
function deriveModule(repoRel) {
  const m = /packages\/headless\/src\/modules\/([^/]+)\//.exec(repoRel);
  if (m) return m[1];
  const m2 = /packages\/([^/]+)\/src\/modules\/([^/]+)\//.exec(repoRel);
  if (m2) return m2[2];
  return '';
}

// ---------------------------------------------------------------------------
// 1. TypeDoc reflection (design §5.1). CRITICAL: `--disableSources false`
//    overrides the config's `disableSources: true` (docs/typedoc.json:14) —
//    SymbolEntry.sourceFile/sourceLine, the changelog join, and the id bridge
//    all need source locations. Additive CLI flags only; no config fork.
//    Markdown output is redirected to a throwaway dir so the corpus build never
//    churns the committed VitePress tree (predocs still owns that emit).
// ---------------------------------------------------------------------------
function resolveTypedocBin() {
  const candidates = [
    join(DOCS_DIR, 'node_modules', '.bin', 'typedoc'),
    join(ROOT, 'node_modules', '.bin', 'typedoc'),
  ];
  return candidates.find((p) => existsSync(p)) ?? null;
}

function runTypedoc() {
  if (!existsSync(TYPEDOC_OPTIONS)) die(`typedoc config not found at ${TYPEDOC_OPTIONS}`);
  const bin = resolveTypedocBin();
  const throwaway = mkdtempSync(join(tmpdir(), 'corpus-typedoc-'));
  const args = [
    '--options',
    TYPEDOC_OPTIONS,
    '--json',
    REFLECTION_OUT,
    '--disableSources',
    'false', // <- panel P2-a fix (load-bearing, design §5.1)
    '--out',
    throwaway,
  ];
  const res = bin
    ? spawnSync(bin, args, { cwd: DOCS_DIR, encoding: 'utf8' })
    : spawnSync('npx', ['typedoc', ...args], { cwd: DOCS_DIR, encoding: 'utf8' });
  try {
    rmSync(throwaway, { recursive: true, force: true });
  } catch {
    /* best-effort */
  }
  if (res.error) die(`could not launch typedoc — ${res.error.message}`);
  if (res.status !== 0) {
    process.stderr.write(res.stderr ?? '');
    die(`typedoc exited ${res.status}`);
  }
  if (!existsSync(REFLECTION_OUT)) die(`typedoc produced no reflection at ${REFLECTION_OUT}`);
  console.log(`corpus:build: consumed TypeDoc reflection ${toRepoRel(REFLECTION_OUT)}`);
  return JSON.parse(readFileSync(REFLECTION_OUT, 'utf8'));
}

// ---------------------------------------------------------------------------
// 2. Symbols (design §5.1). Reconstruct a plain-text signature + verbatim
//    TSDoc from the reflection. No renderer markup.
// ---------------------------------------------------------------------------
const KIND_NAME = {
  2: 'Module',
  4: 'Namespace',
  8: 'Enum',
  16: 'EnumMember',
  32: 'Variable',
  64: 'Function',
  128: 'Class',
  256: 'Interface',
  512: 'Constructor',
  1024: 'Property',
  2048: 'Method',
  4194304: 'TypeAlias',
};

function typeToString(t, depth = 0) {
  if (!t || depth > 4) return 'unknown';
  switch (t.type) {
    case 'intrinsic':
      return t.name ?? 'unknown';
    case 'literal':
      return typeof t.value === 'string' ? JSON.stringify(t.value) : String(t.value);
    case 'reference': {
      const args = (t.typeArguments ?? []).map((a) => typeToString(a, depth + 1));
      return `${t.name}${args.length ? `<${args.join(', ')}>` : ''}`;
    }
    case 'array':
      return `${typeToString(t.elementType, depth + 1)}[]`;
    case 'union':
      return (t.types ?? []).map((x) => typeToString(x, depth + 1)).join(' | ');
    case 'intersection':
      return (t.types ?? []).map((x) => typeToString(x, depth + 1)).join(' & ');
    case 'tuple':
      return `[${(t.elements ?? []).map((x) => typeToString(x, depth + 1)).join(', ')}]`;
    case 'reflection':
      return 'object';
    case 'query':
      return `typeof ${typeToString(t.queryType, depth + 1)}`;
    case 'indexedAccess':
      return `${typeToString(t.objectType, depth + 1)}[${typeToString(t.indexType, depth + 1)}]`;
    default:
      return t.name ?? t.type ?? 'unknown';
  }
}

const renderComment = (comment) => {
  if (!comment || !Array.isArray(comment.summary)) return null;
  const text = comment.summary.map((p) => p.text ?? '').join('').trim();
  return text.length ? text : null;
};

const getComment = (c) =>
  c.comment ?? (c.signatures && c.signatures[0] && c.signatures[0].comment) ?? null;

function buildSignature(c) {
  const name = c.name;
  if ((c.kind === 64 || c.kind === 2048) && c.signatures && c.signatures[0]) {
    const sig = c.signatures[0];
    const params = (sig.parameters ?? [])
      .map((p) => `${p.flags?.isRest ? '...' : ''}${p.name}: ${typeToString(p.type)}`)
      .join(', ');
    return `${name}(${params}): ${typeToString(sig.type)}`;
  }
  if (c.kind === 32) return `${name}: ${typeToString(c.type)}`;
  if (c.kind === 4194304) return `type ${name} = ${typeToString(c.type)}`;
  return `${KIND_NAME[c.kind] ?? 'Symbol'} ${name}`;
}

function extractLessons(comment) {
  if (!comment || !Array.isArray(comment.blockTags)) return [];
  const lessons = [];
  for (const tag of comment.blockTags) {
    if (tag.tag === '@lessons' || tag.tag === '@lesson') {
      const text = (tag.content ?? []).map((p) => p.text ?? '').join('').trim();
      if (text) lessons.push(text);
    }
  }
  return lessons;
}

export function buildSymbols(reflection) {
  const pkg = (reflection.children ?? []).find((c) => c.kind === 2 && c.name === HEADLESS_PKG);
  if (!pkg) die(`reflection has no ${HEADLESS_PKG} package module`);
  const symbols = {};
  // Join map for the id bridge (design §5.3 step 2): (sourceFile, normLabel) -> SymbolId.
  const symbolByFileName = new Map();
  for (const c of pkg.children ?? []) {
    if (c.flags?.isExternal) continue; // re-exported external decls (xstate, etc.)
    const src = c.sources && c.sources[0];
    if (!src || !src.fileName) continue;
    const sourceFile = toRepoRel(src.fileName);
    if (sourceFile.includes('node_modules')) continue;
    const id = `${HEADLESS_PKG}!${c.name}`;
    const comment = getComment(c);
    symbols[id] = {
      id,
      name: c.name,
      kind: KIND_NAME[c.kind] ?? String(c.kind),
      module: deriveModule(sourceFile),
      sourceFile,
      sourceLine: typeof src.line === 'number' ? src.line : 0,
      signature: buildSignature(c),
      tsdoc: renderComment(comment),
      lessons: extractLessons(comment),
    };
    const key = `${sourceFile} ${normLabelKey(c.name)}`;
    if (!symbolByFileName.has(key)) symbolByFileName.set(key, id);
  }
  return { symbols, symbolByFileName };
}

// ---------------------------------------------------------------------------
// 3. Guides + ADRs — ingested index entries, not prose copies (design §5.2).
// ---------------------------------------------------------------------------
function walkMd(dir, out) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walkMd(full, out);
    else if (name.endsWith('.md')) out.push(full);
  }
  return out;
}

const headingsOf = (md) =>
  md
    .split('\n')
    .filter((l) => /^#{1,6}\s+\S/.test(l))
    .map((l) => l.replace(/^#{1,6}\s+/, '').trim());

const titleOf = (md, fallback) => {
  const m = /^#\s+(.+)$/m.exec(md);
  return m ? m[1].trim() : fallback;
};

function buildAdrs() {
  const adrs = {};
  const byNumber = new Map();
  const files = existsSync(ADR_DIR)
    ? readdirSync(ADR_DIR)
        .filter((f) => f.endsWith('.md'))
        .sort()
    : [];
  for (const f of files) {
    const base = f.replace(/\.md$/, '');
    const id = `adr:${base}`;
    const md = readFileSync(join(ADR_DIR, f), 'utf8');
    adrs[id] = {
      id,
      title: titleOf(md, base),
      path: toRepoRel(join(ADR_DIR, f)),
      headings: headingsOf(md),
      crossRefs: [],
    };
    const num = /^(\d{3})/.exec(base);
    if (num) byNumber.set(num[1], id);
  }
  // Resolve ADR-NNN cross-references to sibling ADR ids that actually exist.
  for (const id of Object.keys(adrs)) {
    const md = readFileSync(join(ROOT, adrs[id].path), 'utf8');
    const refs = new Set();
    for (const m of md.matchAll(/\bADR-(\d{3})\b/g)) {
      const target = byNumber.get(m[1]);
      if (target && target !== id) refs.add(target);
    }
    adrs[id].crossRefs = [...refs].sort();
  }
  return adrs;
}

function buildGuides() {
  const guides = {};
  const files = walkMd(GUIDE_GLOB_ROOT, []).filter((f) => /-guide\.md$/.test(basename(f)));
  for (const full of files.sort()) {
    const rel = toRepoRel(full);
    const id = `guide:${rel.replace(/\.md$/, '')}`;
    const md = readFileSync(full, 'utf8');
    guides[id] = {
      id,
      title: titleOf(md, basename(rel, '.md')),
      path: rel,
      headings: headingsOf(md),
      crossRefs: [],
    };
  }
  return guides;
}

// ---------------------------------------------------------------------------
// 4. Relations — committed snapshot + id bridge + prune (design §5.3).
// ---------------------------------------------------------------------------
function buildRelations(symbolByFileName) {
  if (!existsSync(RELATIONS_IN))
    die(
      `relations snapshot not found at ${toRepoRel(RELATIONS_IN)} — run ` +
        `extract-relations.mjs first (T2).`,
    );
  const raw = readFileSync(RELATIONS_IN);
  const relationsSha256 = sha256(raw);
  let snapshot;
  try {
    snapshot = JSON.parse(raw.toString('utf8'));
  } catch (err) {
    die(`relations.json is not valid JSON — ${err.message}`);
  }
  const nodes = snapshot.nodes ?? {};
  const rawEdges = Array.isArray(snapshot.edges) ? snapshot.edges : [];

  const fileExists = new Map();
  const exists = (repoRel) => {
    if (!fileExists.has(repoRel)) fileExists.set(repoRel, existsSync(join(ROOT, repoRel)));
    return fileExists.get(repoRel);
  };

  // Bridge a graphify slug to a CorpusId (design §5.3 steps 1-2). Returns null
  // for an unbridgeable slug (no node / no source_file) -> caller prunes.
  const bridge = (slug) => {
    const node = nodes[slug];
    if (!node || !node.sourceFile) return null;
    const sourceFile = toRepoRel(node.sourceFile);
    const key = `${sourceFile} ${normLabelKey(node.normLabel ?? node.label)}`;
    const symId = symbolByFileName.get(key);
    if (symId) return { id: symId, isSymbol: true, sourceFile };
    return { id: `file:${sourceFile}`, isSymbol: false, sourceFile };
  };

  const edges = [];
  const fileIndex = {};
  let prunedCount = 0;
  for (const e of rawEdges) {
    const from = bridge(e.from);
    const to = bridge(e.to);
    // Prune dead-endpoint edges (design §5.3 staleness): unbridgeable, or the
    // endpoint's file no longer exists in the checkout.
    if (!from || !to || !exists(from.sourceFile) || !exists(to.sourceFile)) {
      prunedCount++;
      continue;
    }
    edges.push({
      from: from.id,
      to: to.id,
      relation: e.relation,
      granularity: from.isSymbol && to.isSymbol ? 'symbol' : 'file',
      confidence: typeof e.confidence === 'number' ? e.confidence : 0,
      sourceFile: toRepoRel(e.sourceFile),
    });
    // Every FileId on a surviving edge must resolve in corpus.index (design §5.3 step 1).
    for (const ep of [from, to]) {
      if (!ep.isSymbol && !fileIndex[ep.id]) {
        fileIndex[ep.id] = {
          kind: 'file',
          path: ep.sourceFile,
          module: deriveModule(ep.sourceFile),
          title: basename(ep.sourceFile),
        };
      }
    }
  }

  const byCodePoint = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
  edges.sort(
    (a, b) =>
      byCodePoint(a.from, b.from) ||
      byCodePoint(a.to, b.to) ||
      byCodePoint(a.relation, b.relation) ||
      byCodePoint(a.sourceFile, b.sourceFile),
  );

  // sourcedAt: the graphify snapshot is time-less (relations.json carries no
  // clock, by design §5.3). Read the GRAPH_REPORT date when the local artifact
  // is present; "" otherwise — deterministic in CI where graphify-out is absent.
  let sourcedAt = '';
  const report = join(ROOT, 'graphify-out', 'GRAPH_REPORT.md');
  if (existsSync(report)) {
    const m = /(\d{4}-\d{2}-\d{2})/.exec(readFileSync(report, 'utf8'));
    if (m) sourcedAt = m[1];
  }

  return { section: { edges, prunedCount, sourcedAt }, relationsSha256, fileIndex };
}

// ---------------------------------------------------------------------------
// 5. Symbol-keyed changelog — one bounded git-log pass, empty-seed rule
//    (design §5.4). Window starts at the newest post-plan `docs-v*` tag above
//    the legacy floor; `{}` until one exists.
// ---------------------------------------------------------------------------
const LEGACY_FLOOR = [0, 0, 3]; // docs-v0.0.3 and below are VitePress-era, not anchors

const git = (args) => {
  const r = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' });
  return r.status === 0 ? r.stdout : null;
};

function parseDocsVersion(tag) {
  const m = /^docs-v(\d+(?:\.\d+)*)$/.exec(tag);
  if (!m) return null;
  return m[1].split('.').map((n) => Number(n));
}
function cmpVersion(a, b) {
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    if (d) return d;
  }
  return 0;
}

function resolveSourceCommit() {
  return (git(['rev-parse', 'HEAD']) ?? '').trim();
}

function buildChangelog(symbols) {
  const bySymbol = {};
  const tagsOut = git(['tag', '-l', 'docs-v*']);
  if (tagsOut == null) return bySymbol; // no git -> empty seed
  let windowStart = null;
  let windowVer = LEGACY_FLOOR;
  for (const tag of tagsOut.split('\n').map((t) => t.trim()).filter(Boolean)) {
    const ver = parseDocsVersion(tag);
    if (!ver || cmpVersion(ver, LEGACY_FLOOR) <= 0) continue; // legacy floor excluded
    if (cmpVersion(ver, windowVer) > 0) {
      windowVer = ver;
      windowStart = tag;
    }
  }
  if (!windowStart) return bySymbol; // empty seed until a post-plan tag exists

  const source = resolveSourceCommit();
  if (!source) return bySymbol;
  // Symbols indexed by their source file for the in-memory join.
  const symbolsByFile = new Map();
  for (const s of Object.values(symbols)) {
    if (!symbolsByFile.has(s.sourceFile)) symbolsByFile.set(s.sourceFile, []);
    symbolsByFile.get(s.sourceFile).push(s.id);
  }
  const REC = '';
  const log = git([
    'log',
    `${windowStart}..${source}`,
    '--no-merges',
    '--name-only',
    `--format=${REC}%H%x1f%aI%x1f%s%x1f%b`,
    '--',
    'packages/*/src',
  ]);
  if (log == null) return bySymbol;
  for (const block of log.split(REC).slice(1)) {
    const [header, ...fileLines] = block.split('\n');
    const [commit, date, subject, body = ''] = header.split('');
    const breaking = /!:/.test(subject) || /BREAKING CHANGE/.test(body);
    const entry = { commit, date, subject, breaking };
    for (const f of fileLines.map((l) => l.trim()).filter(Boolean)) {
      const rel = toRepoRel(f);
      const ids = symbolsByFile.get(rel);
      if (!ids) continue;
      for (const id of ids) (bySymbol[id] ??= []).push(entry);
    }
  }
  return bySymbol;
}

// ---------------------------------------------------------------------------
// 6. Glossary — compile glossary.yaml, fail on malformed entries (design §5.5).
//    Purpose-built reader for the documented format (no yaml dep in CI).
// ---------------------------------------------------------------------------
function parseGlossary() {
  if (!existsSync(GLOSSARY_IN)) die(`glossary source not found at ${toRepoRel(GLOSSARY_IN)}`);
  const rel = toRepoRel(GLOSSARY_IN);
  const bad = (line, why) => die(`${rel}:${line} — malformed glossary entry (${why})`);

  const lines = readFileSync(GLOSSARY_IN, 'utf8').split('\n');
  const terms = {};
  let i = 0;
  const isTop = (l) => /^[A-Za-z0-9][\w-]*:\s*$/.test(l);
  const parseFlowList = (s) => {
    const t = s.trim();
    if (t === '[]' || t === '') return [];
    if (!t.startsWith('[') || !t.endsWith(']')) return null;
    const inner = t.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(',').map((x) => x.trim().replace(/^["']|["']$/g, ''));
  };

  while (i < lines.length) {
    const raw = lines[i];
    if (!raw.trim() || raw.trimStart().startsWith('#')) {
      i++;
      continue;
    }
    if (!isTop(raw)) bad(i + 1, `expected a top-level "<slug>:" key, got "${raw.trim()}"`);
    const slug = raw.slice(0, raw.indexOf(':')).trim();
    i++;
    const entry = { term: null, kind: null, aliases: [], definition: null, referents: [] };
    // Consume the indented body of this entry.
    while (i < lines.length) {
      const l = lines[i];
      if (l.trim() === '' || l.trimStart().startsWith('#')) {
        i++;
        continue;
      }
      if (!/^\s+\S/.test(l)) break; // dedent -> next top-level entry
      const keyIndent = l.length - l.trimStart().length;
      const line = l.trim();
      const kv = /^([a-z]+):\s*(.*)$/.exec(line);
      if (!kv) bad(i + 1, `expected "<field>: <value>", got "${line}"`);
      const [, field, rest] = kv;
      if (field === 'term') {
        entry.term = rest.replace(/^["']|["']$/g, '').trim() || null;
        i++;
      } else if (field === 'kind') {
        const v = rest.trim();
        if (v !== 'domain' && v !== 'system') bad(i + 1, `kind must be domain|system, got "${v}"`);
        entry.kind = v;
        i++;
      } else if (field === 'aliases') {
        const list = parseFlowList(rest);
        if (list == null) bad(i + 1, `aliases must be a flow list [a, b], got "${rest}"`);
        entry.aliases = list;
        i++;
      } else if (field === 'definition') {
        // Folded block scalar (>- / >) or an inline value. Continuation lines
        // are only those indented DEEPER than the "definition:" key — a sibling
        // field at the same indent (e.g. "referents:") ends the block.
        if (rest.startsWith('>') || rest.startsWith('|')) {
          i++;
          const buf = [];
          while (i < lines.length) {
            const cl = lines[i];
            if (cl.trim() === '') {
              i++;
              continue;
            }
            if (cl.length - cl.trimStart().length <= keyIndent) break;
            buf.push(cl.trim());
            i++;
          }
          entry.definition = buf.join(' ').trim() || null;
        } else {
          entry.definition = rest.replace(/^["']|["']$/g, '').trim() || null;
          i++;
        }
      } else if (field === 'referents') {
        i++;
        while (i < lines.length && /^\s*-\s*\{/.test(lines[i])) {
          const m = /\{\s*type:\s*([a-z]+)\s*,\s*id:\s*(.+?)\s*\}/.exec(lines[i]);
          if (!m) bad(i + 1, `referent must be "{ type: <t>, id: <id> }", got "${lines[i].trim()}"`);
          const type = m[1];
          const id = m[2].replace(/^["']|["']$/g, '').trim();
          if (!['symbol', 'guide', 'adr', 'example'].includes(type))
            bad(i + 1, `referent type must be symbol|guide|adr|example, got "${type}"`);
          if (!id) bad(i + 1, `referent id is empty`);
          entry.referents.push({ type, id });
          i++;
        }
      } else {
        bad(i + 1, `unknown field "${field}"`);
      }
    }
    if (!entry.term) bad(i, `term "${slug}" is missing required field "term"`);
    if (!entry.kind) bad(i, `term "${slug}" is missing required field "kind"`);
    if (!entry.definition) bad(i, `term "${slug}" is missing required field "definition"`);
    if (!entry.referents.length) bad(i, `term "${slug}" has no referents`);
    terms[slug] = entry;
  }
  if (!Object.keys(terms).length) die(`${rel} — no glossary terms parsed`);
  return { terms };
}

// ---------------------------------------------------------------------------
// Assemble + fixed-point meta + write (design §5.6, §6.3).
// ---------------------------------------------------------------------------
function buildIndex({ symbols, guides, adrs, examples, glossary, fileIndex }) {
  const index = { ...fileIndex };
  for (const s of Object.values(symbols))
    index[s.id] = { kind: 'symbol', path: s.sourceFile, module: s.module, title: s.name };
  for (const g of Object.values(guides))
    index[g.id] = { kind: 'guide', path: g.path, module: '', title: g.title };
  for (const a of Object.values(adrs))
    index[a.id] = { kind: 'adr', path: a.path, module: '', title: a.title };
  for (const [id, e] of Object.entries(examples))
    index[id] = { kind: 'example', path: e.sourceFile ?? '', module: '', title: e.title };
  for (const [slug, t] of Object.entries(glossary.terms))
    index[slug] = { kind: 'term', path: toRepoRel(GLOSSARY_IN), module: '', title: t.term };
  return index;
}

function main() {
  const reflection = runTypedoc();
  const { symbols, symbolByFileName } = buildSymbols(reflection);
  const adrs = buildAdrs();
  const guides = buildGuides();
  const examples = {}; // FE-2754 seam — near-empty at first (design §5, §7.1)
  const {
    section: relations,
    relationsSha256,
    fileIndex,
  } = buildRelations(symbolByFileName);
  const changelog = { bySymbol: buildChangelog(symbols) };
  const glossary = parseGlossary();
  const index = buildIndex({ symbols, guides, adrs, examples, glossary, fileIndex });

  const content = { symbols, guides, adrs, examples, relations, changelog, glossary, index };
  const contentHash = sha256(stableStringify(content)).slice(0, 12);
  const corpusVersion = `${SCHEMA_MAJOR}+${contentHash}`;

  const counts = {
    symbols: Object.keys(symbols).length,
    guides: Object.keys(guides).length,
    adrs: Object.keys(adrs).length,
    examples: Object.keys(examples).length,
    relationEdges: relations.edges.length,
    relationsPruned: relations.prunedCount,
    changelogSymbols: Object.keys(changelog.bySymbol).length,
    glossaryTerms: Object.keys(glossary.terms).length,
    indexEntries: Object.keys(index).length,
  };

  // Fixed-point meta rule (design §6.3): if the committed corpus already carries
  // this content hash, preserve its meta block verbatim -> byte-identical output.
  let meta;
  let reusedMeta = false;
  if (existsSync(CORPUS_OUT)) {
    try {
      const committed = JSON.parse(readFileSync(CORPUS_OUT, 'utf8'));
      const seg = String(committed?.meta?.corpus_version ?? '').split('+')[1];
      if (seg === contentHash && committed.meta) {
        meta = committed.meta;
        reusedMeta = true;
      }
    } catch {
      /* fall through to a fresh stamp */
    }
  }
  if (!meta) {
    meta = {
      corpus_version: corpusVersion,
      built_at: new Date().toISOString(),
      source_commit: resolveSourceCommit(),
      relationsSha256,
      counts,
    };
  }

  const corpus = { meta, ...content };
  writeFileSync(CORPUS_OUT, stableStringify(corpus));

  console.log(`corpus:build: wrote ${toRepoRel(CORPUS_OUT)} (${corpusVersion})`);
  console.log(
    `corpus:build: relations.prunedCount=${relations.prunedCount} ` +
      `(${relations.edges.length} edges kept)`,
  );
  console.log(
    `corpus:build: counts ${Object.entries(counts)
      .map(([k, v]) => `${k}=${v}`)
      .join(' ')}${reusedMeta ? ' [meta fixed-point: preserved]' : ''}`,
  );
}

// Run the build only when invoked directly as a script. Importing this module
// (gate-api-drift.mjs reuses `buildSymbols` so a single mapping layer absorbs
// any TypeDoc reflection-shape change — design §9) must not trigger a build.
const invokedDirectly = (() => {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return realpathSync(entry) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
})();
if (invokedDirectly) main();
