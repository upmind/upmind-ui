#!/usr/bin/env node
// docs/corpus/emit-mdx.mjs — FE-2752 T4 (design §6, §8.2)
//
// The MDX emitter: the one adapter that turns the typed, renderer-independent
// `docs/corpus/corpus.json` into the generated developer-docs partition
// (`docs/published-docs/developers/reference/**` +
// `docs/published-docs/developers/changelog/**` +
// `docs/published-docs/developers/corpus-version.json`). Mintlify is a swappable rendering
// target (ADR-026); this file is the only place renderer concerns live.
//
// Pure function of the corpus (design §6.2/§6.3): EVERY byte written is derived
// from `corpus.json` alone. Every volatile frontmatter value — corpus_version,
// built_at, last-verified-against-commit — is COPIED from `corpus.meta`, never
// read from the wall clock or git. Re-emitting the same corpus is byte-identical
// (idempotent), which is what makes the authorship guard's regen-and-compare
// (T9, §8.2) a byte-exact diff with no normalization.
//
// Plain node ESM, no runtime deps (matching build.mjs / extract-relations.mjs).
//
// Usage:
//   node corpus/emit-mdx.mjs                 (run via `pnpm --filter docs corpus:emit`)
//   node corpus/emit-mdx.mjs --out <dir>     (the T9 guard's replay target, §8.2)
//   Paths are anchored to the repo root computed from this file's location, so
//   the emit is correct regardless of the cwd pnpm invokes it with.

import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// --- anchors (cwd-independent) ---------------------------------------------
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url)); // <root>/docs/corpus
const DOCS_DIR = resolve(SCRIPT_DIR, '..'); //                <root>/docs
const CORPUS_IN = join(SCRIPT_DIR, 'corpus.json');

const die = (msg) => {
  console.error(`FAIL (corpus:emit): ${msg}`);
  process.exit(1);
};

// --- args ------------------------------------------------------------------
// `--out <dir>` overrides the write root (the T9 guard replays into a temp dir,
// design §8.2). Default is the committed partition under docs/published-docs/developers.
function parseOut(argv) {
  const i = argv.indexOf('--out');
  if (i === -1) return join(DOCS_DIR, 'published-docs', 'developers');
  const v = argv[i + 1];
  if (!v) die('--out requires a directory argument');
  return resolve(process.cwd(), v);
}
const OUT_DIR = parseOut(process.argv.slice(2));
const REF_ROOT = join(OUT_DIR, 'reference');
const CHANGELOG_ROOT = join(OUT_DIR, 'changelog');
const VERSION_OUT = join(OUT_DIR, 'corpus-version.json');

// ---------------------------------------------------------------------------
// Load the corpus — the ONLY content input (2752-AC5). No TypeDoc, no git, no
// graphify: emit is a pure function of this file.
// ---------------------------------------------------------------------------
if (!existsSync(CORPUS_IN))
  die(`corpus not found at ${toRel(CORPUS_IN)} — run \`pnpm --filter docs corpus:build\` first`);
let corpus;
try {
  corpus = JSON.parse(readFileSync(CORPUS_IN, 'utf8'));
} catch (err) {
  die(`corpus.json is not valid JSON — ${err.message}`);
}
const { meta, symbols, index, relations, changelog } = corpus;
if (!meta || !meta.corpus_version) die('corpus.meta.corpus_version missing — rebuild the corpus');

function toRel(fp) {
  return relative(resolve(DOCS_DIR, '..'), fp).replace(/\\/g, '/');
}

// ---------------------------------------------------------------------------
// Determinism helpers (design §6.3). Sorted-key serialization for JSON, stable
// comparators everywhere — no Map/Object iteration-order dependence.
// ---------------------------------------------------------------------------
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
function sortDeep(v) {
  if (Array.isArray(v)) return v.map(sortDeep);
  if (v && typeof v === 'object') {
    const out = {};
    for (const k of Object.keys(v).sort()) out[k] = sortDeep(v[k]);
    return out;
  }
  return v;
}
const stableJson = (v) => JSON.stringify(sortDeep(v), null, 2) + '\n';
const kebab = (s) =>
  String(s)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

// TypeDoc ReflectionKind → reference sub-directory (mirrors the VitePress tree,
// §2.1). build.mjs stores the kind name where KIND_NAME maps it and the raw
// numeric otherwise; TypeDoc 0.28's TypeAlias is 2097152 (unmapped upstream).
const KIND_DIR = {
  Function: 'functions',
  Class: 'classes',
  Interface: 'interfaces',
  Enum: 'enumerations',
  Variable: 'variables',
  TypeAlias: 'type-aliases',
  '2097152': 'type-aliases',
};
const kindDir = (kind) => KIND_DIR[kind] ?? kebab(kind);
// Reference route for a symbol, relative to the partition root; namespace-free
// (the FE-2951 namespace is applied at publish by FE-2949, design §8.4).
const symbolRoute = (s) => `reference/headless/${kindDir(s.kind)}/${s.name}`;

// ---------------------------------------------------------------------------
// VitePress-markdown → Mintlify-MDX transform (design §6.1, thin). Applied to
// ingested prose (TSDoc bodies). A no-op on prose that carries neither VitePress
// links nor blockquote callouts; exercised by the T5 fixture guides.
// ---------------------------------------------------------------------------
const CALLOUT_MAP = {
  important: 'Note',
  note: 'Note',
  info: 'Info',
  tip: 'Tip',
  warning: 'Warning',
  caution: 'Warning',
  danger: 'Warning',
};

// (1) Rewrite relative `./x.md` links to extensionless Mintlify routes; leave
//     external (scheme-bearing) links untouched.
function rewriteLinks(md) {
  return md.replace(/\]\((?!\w+:\/\/)([^)\s]+?)\.md(#[^)]*)?\)/g, (_m, p, anchor) => `](${p}${anchor ?? ''})`);
}
// (2) Map blockquote callouts (`> **Important:** …`) to semantic components.
function rewriteCallouts(md) {
  const lines = md.split('\n');
  const out = [];
  for (let i = 0; i < lines.length; ) {
    const m = /^>\s*\*\*([A-Za-z]+):?\*\*\s*(.*)$/.exec(lines[i]);
    const comp = m && CALLOUT_MAP[m[1].toLowerCase()];
    if (comp) {
      const body = [m[2]];
      i++;
      while (i < lines.length && /^>/.test(lines[i])) {
        body.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      out.push(`<${comp}>`, body.join('\n').trim(), `</${comp}>`);
    } else {
      out.push(lines[i]);
      i++;
    }
  }
  return out.join('\n');
}
// (3) Retitle/label code fences — a bare opening fence gets a `text` language so
//     the emitted MDX always carries a fence info string (§6.1 code titles).
function labelFences(md) {
  const lines = md.split('\n');
  let open = false;
  for (let i = 0; i < lines.length; i++) {
    const f = /^(`{3,})(.*)$/.exec(lines[i]);
    if (!f) continue;
    if (!open && !f[2].trim()) lines[i] = `${f[1]}text`;
    open = !open;
  }
  return lines.join('\n');
}
const transformBody = (md) => labelFences(rewriteCallouts(rewriteLinks(md)));

// ---------------------------------------------------------------------------
// Provenance frontmatter — exactly eight keys, fixed order (design §6.2,
// 2950-AC3). Every volatile value is copied from corpus.meta. Hand-authored
// pages carry NO `generated` key (2950-AC4) — never emitted here.
// ---------------------------------------------------------------------------
const yamlStr = (v) => `"${String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
function frontmatter({ id, audience, module, status }) {
  return [
    '---',
    'generated: true',
    `corpus_version: ${yamlStr(meta.corpus_version)}`,
    `built_at: ${yamlStr(meta.built_at)}`,
    `id: ${yamlStr(id)}`,
    `audience: ${audience}`,
    `module: ${yamlStr(module)}`,
    `status: ${status}`,
    `last-verified-against-commit: ${yamlStr(meta.source_commit)}`,
    '---',
    '',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Related section — rendered from the corpus.relations edges touching the
// page's id (design §6.1, 2752-AC7). A hard requirement on EVERY emitted page:
// the `## Related` heading is always present, even when no edge touches the id.
// ---------------------------------------------------------------------------
const RELATION_ARROW = { out: '→', in: '←' };
function resolveEndpoint(id) {
  const s = symbols[id];
  if (s) return { label: s.name, href: `/${symbolRoute(s)}` };
  const ix = index[id];
  return { label: (ix && ix.title) || id, href: null };
}
function relatedItems(ids) {
  const want = new Set(ids);
  const seen = new Set();
  const items = [];
  for (const e of relations.edges) {
    const fromMe = want.has(e.from);
    const toMe = want.has(e.to);
    if (!fromMe && !toMe) continue;
    const dir = fromMe ? 'out' : 'in';
    const other = fromMe ? e.to : e.from;
    if (want.has(other)) continue; // skip self/intra-page edges
    const key = `${e.relation}|${dir}|${other}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({ relation: e.relation, dir, other });
  }
  items.sort((a, b) => cmp(a.relation, b.relation) || cmp(a.dir, b.dir) || cmp(a.other, b.other));
  return items;
}
function renderRelated(ids) {
  const items = relatedItems(ids);
  const lines = ['## Related', ''];
  if (!items.length) {
    lines.push('_No related symbols recorded in the corpus relations graph._', '');
    return lines.join('\n');
  }
  for (const it of items) {
    const { label, href } = resolveEndpoint(it.other);
    const target = href ? `[${label}](${href})` : `\`${label}\``;
    lines.push(`- \`${it.relation}\` ${RELATION_ARROW[it.dir]} ${target}`);
  }
  lines.push('');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Page builders. Each returns { relPath, content }; relPath is POSIX, relative
// to OUT_DIR. Nothing is written until every page passes the ENFORCE gate.
// ---------------------------------------------------------------------------
function symbolPage(s) {
  const status = s.tsdoc && s.tsdoc.trim() ? 'generated' : 'generated-stub';
  const parts = [
    frontmatter({ id: s.id, audience: 'reference', module: s.module, status }),
    `# ${s.name}`,
    '',
    `\`${s.kind}\`${s.module ? ` · module \`${s.module}\`` : ''} · \`${s.sourceFile}:${s.sourceLine}\``,
    '',
    '## Signature',
    '',
    '```ts',
    s.signature,
    '```',
    '',
  ];
  if (s.tsdoc && s.tsdoc.trim()) {
    parts.push('## Description', '', transformBody(s.tsdoc).trim(), '');
  }
  if (Array.isArray(s.lessons) && s.lessons.length) {
    parts.push('## Lessons (hard-won)', '');
    for (const l of [...s.lessons].sort(cmp)) parts.push(`- ${transformBody(l).trim()}`);
    parts.push('');
  }
  parts.push(renderRelated([s.id]));
  return { relPath: `${symbolRoute(s)}.mdx`, content: parts.join('\n').replace(/\n{3,}/g, '\n\n') };
}

function changelogPages() {
  const byModule = {};
  for (const [id, entries] of Object.entries(changelog?.bySymbol ?? {})) {
    if (!entries || !entries.length) continue;
    const mod = (symbols[id] && symbols[id].module) || 'root';
    (byModule[mod] ??= []).push(id);
  }
  const pages = [];
  for (const mod of Object.keys(byModule).sort()) {
    const ids = byModule[mod].sort(cmp);
    const parts = [
      frontmatter({ id: `changelog:headless/${mod}`, audience: 'changelog', module: mod, status: 'generated' }),
      `# Changelog — \`${mod}\``,
      '',
    ];
    for (const id of ids) {
      const s = symbols[id];
      parts.push(`## ${s ? s.name : id}`, '');
      const entries = [...changelog.bySymbol[id]].sort(
        (a, b) => cmp(b.date, a.date) || cmp(a.commit, b.commit),
      );
      for (const e of entries) {
        parts.push(`- \`${e.commit.slice(0, 8)}\` ${e.date} — ${e.subject}${e.breaking ? ' **(breaking)**' : ''}`);
      }
      parts.push('');
    }
    parts.push(renderRelated(ids));
    pages.push({ relPath: `changelog/headless/${mod}.mdx`, content: parts.join('\n').replace(/\n{3,}/g, '\n\n') });
  }
  return pages;
}

// ---------------------------------------------------------------------------
// ENFORCE gate (design §6.1) — the emitter refuses to write a page that
// violates ADR-026 decision 11's shape rules (heading hierarchy, semantic
// callouts, code-fence languages, link extensions, image alt text). Findings
// print in the gate format (`<file> — <reason>`); all findings before exit.
// ---------------------------------------------------------------------------
function enforce(relPath, mdx, findings) {
  const body = mdx.replace(/^---\n[\s\S]*?\n---\n/, ''); // skip frontmatter
  const push = (why) => findings.push(`${relPath} — ${why}`);

  // Heading hierarchy: first heading is h1, no descending jump > 1 level.
  let prev = 0;
  let sawH1 = false;
  let inFence = false;
  for (const line of body.split('\n')) {
    if (/^`{3,}/.test(line)) inFence = !inFence;
    if (inFence) continue;
    const h = /^(#{1,6})\s+\S/.exec(line);
    if (!h) continue;
    const level = h[1].length;
    if (!sawH1) {
      if (level !== 1) push(`first heading is h${level}, expected h1`);
      sawH1 = true;
    } else if (level > prev + 1) {
      push(`heading level jumps h${prev}→h${level}`);
    }
    prev = level;
  }
  if (!sawH1) push('page has no h1 heading');

  // Semantic callouts: no raw blockquote callout survived the transform.
  if (/^>\s*\*\*(Important|Note|Info|Tip|Warning|Caution|Danger):?\*\*/im.test(body))
    push('unconverted blockquote callout (should be a semantic component)');

  // Link extensions: no `.md` link route survived the transform.
  const badLink = /\]\((?!\w+:\/\/)[^)\s]+?\.md(#[^)]*)?\)/.exec(body);
  if (badLink) push(`unrewritten VitePress link "${badLink[0]}"`);

  // Image alt text: no empty-alt images.
  if (/!\[\s*\]\(/.test(body)) push('image with empty alt text');

  // Code-fence languages: every opening fence carries an info string.
  let open = false;
  for (const line of body.split('\n')) {
    const f = /^(`{3,})(.*)$/.exec(line);
    if (!f) continue;
    if (!open && !f[2].trim()) push('code fence with no language');
    open = !open;
  }
}

// ---------------------------------------------------------------------------
// Assemble, ENFORCE, then write (fail-closed before any byte lands).
// ---------------------------------------------------------------------------
const pages = [];
for (const id of Object.keys(symbols).sort()) pages.push(symbolPage(symbols[id]));
for (const p of changelogPages()) pages.push(p);

const findings = [];
const relSeen = new Map();
for (const { relPath, content } of pages) {
  if (relSeen.has(relPath)) findings.push(`${relPath} — duplicate output path (also from ${relSeen.get(relPath)})`);
  relSeen.set(relPath, relPath);
  enforce(relPath, content, findings);
}
if (findings.length) {
  for (const f of findings) console.error(f);
  die(`${findings.length} emit-time ENFORCE violation(s) — nothing written`);
}

// Hard-assert every write target sits inside the partition (design §6/§9 —
// "emitter also hard-asserts its own write-root"). A path escaping the
// reference/**, changelog/**, corpus-version.json partition is a bug → fail.
function assertInPartition(absPath) {
  const abs = resolve(absPath);
  const inRef = abs === REF_ROOT || abs.startsWith(REF_ROOT + '/');
  const inLog = abs === CHANGELOG_ROOT || abs.startsWith(CHANGELOG_ROOT + '/');
  const isVersion = abs === VERSION_OUT;
  if (!inRef && !inLog && !isVersion) die(`refusing to write outside the partition: ${abs}`);
}

// Clean the machine-owned partition first so the committed tree equals a fresh
// emit exactly (no orphaned pages) — this is what makes the T9 guard's
// `diff -r` byte-exact. Only the three manifest paths are touched; hand-authored
// siblings (learn/**, build/**, contribute/**) are never removed.
rmSync(REF_ROOT, { recursive: true, force: true });
rmSync(CHANGELOG_ROOT, { recursive: true, force: true });
rmSync(VERSION_OUT, { force: true });

let written = 0;
for (const { relPath, content } of pages.sort((a, b) => cmp(a.relPath, b.relPath))) {
  const abs = join(OUT_DIR, relPath);
  assertInPartition(abs);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content.endsWith('\n') ? content : content + '\n');
  written++;
}

// The FE-2949 canary marker (design §6.4, 2753-AC5) — emitted atomically with
// the tree; every value copied from corpus.meta.
assertInPartition(VERSION_OUT);
writeFileSync(
  VERSION_OUT,
  stableJson({ corpus_version: meta.corpus_version, built_at: meta.built_at, commit: meta.source_commit }),
);

console.log(`corpus:emit: consumed ${toRel(CORPUS_IN)} (only content input) — ${meta.corpus_version}`);
console.log(`corpus:emit: wrote ${written} page(s) + corpus-version.json into ${toRel(OUT_DIR)}/`);
