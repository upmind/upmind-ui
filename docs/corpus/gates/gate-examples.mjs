#!/usr/bin/env node
// docs/corpus/gates/gate-examples.mjs — FE-2752 T8 (design §7.1, §9; 2753-AC1/AC4)
//
// The examples drift gate: does every documented code snippet still compile
// against the REAL workspace packages? It materializes two snippet sources into
// one throwaway TypeScript project and runs a single `vue-tsc --noEmit` pass:
//
//   1. `corpus.examples[*].code` — the FE-2754 seam (design §5, ExampleEntry).
//      Near-empty today (`{}`); population is FE-2754's own later work.
//   2. Marked fenced snippets inside the markdown sources `corpus.guides`/
//      `corpus.adrs` already ingest (design §5.2) — a snippet opts in with a
//      `<!-- corpus-example -->` marker on the line immediately before a fenced
//      ```ts/```tsx/```js/```jsx/```vue block (convention introduced here;
//      distinct from `agent:ci/docs-corpus-gate.mjs`'s unrelated
//      `capability-proof` EXECUTE marker — that gate proves a snippet RUNS
//      against a recorded fixture stack; this one only proves a snippet
//      TYPE-CHECKS against real exports, no execution, no fixtures). No guide
//      or ADR uses the marker yet, so today this source also contributes zero
//      — an honest no-op seam, same status as `corpus.examples`.
//
// Empty-set is GREEN, always printing the compiled-snippet count (currently 0
// + 0) — the gate is ready before FE-2754's content lands (design §9 "Snippet
// needs a running app to compile" row; the executable-capability-proof job is
// explicitly docs-corpus-gate's, not duplicated here).
//
// REAL WORKSPACE PACKAGES, ALWAYS — even against a fixture. `<root>`/`--root`
// (below) only relocates where `corpus.json` (the SNIPPETS) is read from; the
// six workspace packages' `src/` (the PACKAGES snippets import against) are
// always resolved from this script's OWN real repo location, never from the
// fixture tree — a fixture supplies a broken snippet, never a fake package.
//
// WHY THE TEMP PROJECT LIVES INSIDE THE REPO TREE (`docs/corpus/.gate-examples-tmp-*`,
// always removed before exit), not `os.tmpdir()` (verified empirically, not
// assumed): a snippet importing `@upmind-automation/headless` pulls that
// package's ENTIRE `src/` into the compiled program (mapped straight to real
// source, not `dist`, exactly like `apps/cart/tsconfig.json` already does for
// the same reason), so the program needs headless's own ambient devDependency
// types (`@types/google.maps`, `@types/mercadopago-sdk-js`) — pnpm's isolated
// linking puts those ONLY under `packages/headless/node_modules/@types`, never
// hoisted to the repo root. `typeRoots` (below) is pointed at every package's
// own `node_modules/@types` to reach them regardless of the temp dir's exact
// depth. Separately, `vue-app.json`'s bare-name type reference `"vite/client"`
// (a subpath, not a whole `@types` package) only resolves via Node's ordinary
// ancestor `node_modules` walk — which requires the temp project to sit
// somewhere under the real repo tree; `os.tmpdir()` (no repo ancestor) 404s on
// it every time. Both requirements are satisfied by materializing here.
//
// Plain node ESM, no runtime deps (matching build.mjs / emit-mdx.mjs / the
// sibling gates) — `vue-tsc` itself is the one external process this gate runs.
//
// Contract:
//   node docs/corpus/gates/gate-examples.mjs                 (real checkout)
//   node docs/corpus/gates/gate-examples.mjs <root>          (a fixture repo-root:
//        reads <root>/docs/corpus/corpus.json; packages still resolve for real)
//   node docs/corpus/gates/gate-examples.mjs --root <root>
//   node docs/corpus/gates/gate-examples.mjs --corpus <file> (explicit corpus.json)
//   Output one finding per line: `<file> — <reason>` (2753-AC4: names the
//   example id + file). All findings print before exit. Exit 0: every
//   materialized snippet compiles clean (prints the count, incl. 0). Exit 1: at
//   least one snippet fails to type-check. Fail-closed: an unreadable corpus.json
//   or an unspawnable `vue-tsc` is itself a finding, never a silent pass.

import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SELF = 'gate:examples';

// --- anchors -----------------------------------------------------------------
// WORKSPACE_ROOT is ALWAYS this script's real repo location — never overridden
// by a fixture `<root>` (see header: packages must stay real).
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url)); // <root>/docs/corpus/gates
const WORKSPACE_ROOT = resolve(SCRIPT_DIR, '..', '..', '..'); // <root>

// --- args --------------------------------------------------------------------
function parseArgs(argv) {
  let root = null;
  let corpusPath = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--root') root = argv[++i] ?? null;
    else if (a === '--corpus') corpusPath = argv[++i] ?? null;
    else if (!a.startsWith('-') && root === null) root = a;
  }
  const corpusRoot = root ? resolve(process.cwd(), root) : WORKSPACE_ROOT;
  const resolvedCorpusPath = corpusPath
    ? isAbsolute(corpusPath)
      ? corpusPath
      : resolve(process.cwd(), corpusPath)
    : join(corpusRoot, 'docs/corpus/corpus.json');
  return { corpusRoot, corpusPath: resolvedCorpusPath };
}
const { corpusRoot, corpusPath: CORPUS_PATH } = parseArgs(process.argv.slice(2));

const toRel = (fp, base = WORKSPACE_ROOT) => relative(base, fp).replace(/\\/g, '/') || fp;

function die(msg) {
  console.error(`${SELF}: FAIL — ${msg}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// The six real workspace packages (mirrors apps/cart/tsconfig.json's own
// paths+include shape — the established "app code importing straight from
// workspace src" pattern already proven to work in CI, reused rather than
// reinvented, design §4 ethos).
// ---------------------------------------------------------------------------
const WORKSPACE_PACKAGES = [
  { name: '@upmind-automation/types', dir: 'types' },
  { name: '@upmind-automation/i18n', dir: 'i18n' },
  { name: '@upmind-automation/headless', dir: 'headless' },
  { name: '@upmind-automation/icons', dir: 'icons' },
  { name: '@upmind-automation/upmind-ui', dir: 'ui' },
  { name: '@upmind-automation/client-vue', dir: 'client-vue' },
];

// Every real package's own committed tsconfig(.build).json + the app-level
// vue-app.json this project extends may each declare ambient `types` (ADR-026
// "reuse, don't reinvent" ethos, mirrors build.mjs's own reuse posture) — union
// them so a future workspace-package devDependency change never needs an edit
// here. Read live, never hardcoded (except vue-app.json's own two: vite/client,
// jsdom — inherited automatically via `extends`, included here for completeness
// of typeRoots reasoning only).
function readAmbientTypes(tsconfigAbsPath) {
  if (!existsSync(tsconfigAbsPath)) return [];
  try {
    const json = JSON.parse(readFileSync(tsconfigAbsPath, 'utf8'));
    const t = json?.compilerOptions?.types;
    return Array.isArray(t) ? t.map((x) => String(x).replace(/^@types\//, '')) : [];
  } catch {
    return [];
  }
}
function collectAmbientTypes() {
  const seen = new Set();
  for (const t of readAmbientTypes(join(WORKSPACE_ROOT, 'tsconfig/vue-app.json'))) seen.add(t);
  for (const { dir } of WORKSPACE_PACKAGES) {
    for (const file of ['tsconfig.build.json', 'tsconfig.json']) {
      for (const t of readAmbientTypes(join(WORKSPACE_ROOT, 'packages', dir, file))) seen.add(t);
    }
  }
  return [...seen].sort();
}

// ---------------------------------------------------------------------------
// Load corpus.json (fail-closed: missing/unparseable/wrong-shape is a finding,
// never a silent pass).
// ---------------------------------------------------------------------------
if (!existsSync(CORPUS_PATH))
  die(`corpus not found at ${toRel(CORPUS_PATH, corpusRoot)} — run \`pnpm --filter docs corpus:build\` first`);
let corpus;
try {
  corpus = JSON.parse(readFileSync(CORPUS_PATH, 'utf8'));
} catch (err) {
  die(`${toRel(CORPUS_PATH, corpusRoot)} is not valid JSON — ${err.message}`);
}
if (!corpus.examples || typeof corpus.examples !== 'object' || Array.isArray(corpus.examples))
  die(`${toRel(CORPUS_PATH, corpusRoot)} — corpus.examples is missing or not an object`);

// ---------------------------------------------------------------------------
// Snippet materialization, source 1 — corpus.examples (design §5, ExampleEntry).
// ---------------------------------------------------------------------------
const LANG_EXT = { ts: 'ts', typescript: 'ts', tsx: 'tsx', js: 'js', javascript: 'js', jsx: 'jsx', vue: 'vue' };
const slugify = (s) =>
  String(s)
    .replace(/^(example|guide|adr):/, '')
    .replace(/[^A-Za-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80) || 'snippet';

function materializeExamples(findings) {
  const out = [];
  for (const id of Object.keys(corpus.examples).sort()) {
    const entry = corpus.examples[id];
    const origin = entry?.sourceFile ? `${entry.sourceFile}` : toRel(CORPUS_PATH, corpusRoot);
    const ext = LANG_EXT[String(entry?.lang ?? '').toLowerCase()];
    if (!ext) {
      findings.push(`${origin} — example '${id}' has non-type-checkable lang "${entry?.lang}" (expected ts|tsx|js|jsx|vue)`);
      continue;
    }
    if (typeof entry?.code !== 'string' || !entry.code.trim()) {
      findings.push(`${origin} — example '${id}' has no code to materialize`);
      continue;
    }
    out.push({ id, origin, ext, code: entry.code, file: `examples/${slugify(id)}.${ext}` });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Snippet materialization, source 2 — marked fenced snippets inside the
// markdown `corpus.guides`/`corpus.adrs` already ingest (design §5.2). Marker:
// a `<!-- corpus-example -->` comment line immediately preceding a fenced code
// block. Best-effort: a doc whose source file is no longer on disk is skipped
// (staleness is that section's own referential concern, not this gate's —
// `corpus.guides`/`corpus.adrs` store a path into the real file, never a copy).
// ---------------------------------------------------------------------------
const MARKER_RE = /^<!--\s*corpus-example\s*-->\s*$/;
const FENCE_OPEN_RE = /^`{3,}([A-Za-z0-9]*)\s*$/;

function scanMarkedSnippets(docId, absPath, findings) {
  const out = [];
  let text;
  try {
    text = readFileSync(absPath, 'utf8');
  } catch {
    return out; // best-effort — see header note
  }
  const lines = text.split('\n');
  let n = 0;
  for (let i = 0; i < lines.length; i++) {
    if (!MARKER_RE.test(lines[i].trim())) continue;
    let j = i + 1;
    while (j < lines.length && lines[j].trim() === '') j++; // tolerate one blank line
    const open = j < lines.length ? FENCE_OPEN_RE.exec(lines[j].trim()) : null;
    const origin = `${toRel(absPath, corpusRoot)}:${i + 1}`;
    if (!open) {
      findings.push(`${origin} — corpus-example marker not immediately followed by a fenced code block`);
      continue;
    }
    const lang = open[1].toLowerCase();
    const ext = LANG_EXT[lang];
    const close = lines.findIndex((l, k) => k > j && /^`{3,}\s*$/.test(l.trim()));
    if (close === -1) {
      findings.push(`${origin} — fenced code block after corpus-example marker never closes`);
      continue;
    }
    n++;
    const id = `${docId}#${n}`;
    if (!ext) {
      findings.push(`${origin} — marked snippet '${id}' has non-type-checkable fence language "${lang || '(none)'}" (expected ts|tsx|js|jsx|vue)`);
      i = close;
      continue;
    }
    out.push({ id, origin, ext, code: lines.slice(j + 1, close).join('\n'), file: `marked/${slugify(id)}.${ext}` });
    i = close;
  }
  return out;
}

function materializeMarked(findings) {
  const out = [];
  const docSets = [corpus.guides, corpus.adrs].filter((s) => s && typeof s === 'object');
  for (const set of docSets) {
    for (const docId of Object.keys(set).sort()) {
      const entry = set[docId];
      if (!entry?.path) continue;
      const abs = join(corpusRoot, entry.path);
      if (!existsSync(abs)) continue; // best-effort — see header note
      out.push(...scanMarkedSnippets(docId, abs, findings));
    }
  }
  return out;
}

const findings = [];
const materialized = [...materializeExamples(findings), ...materializeMarked(findings)];

// Empty-set is green (design §9 seam) — but a malformed entry above is still a
// real finding, so check findings first even when nothing compiled.
if (materialized.length === 0) {
  if (findings.length) {
    for (const f of findings) console.error(f);
    console.error(`${SELF}: ${findings.length} blocking finding(s) (no snippets were type-checkable).`);
    process.exit(1);
  }
  console.log(`${SELF}: OK — 0 example snippet(s) to type-check (empty-set; the FE-2754 seam is not yet populated).`);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Materialize into a temp project ANCHORED INSIDE the repo tree (see header
// for why) and run one `vue-tsc --noEmit` pass against the real packages.
// ---------------------------------------------------------------------------
function resolveVueTscBin() {
  const candidates = [
    join(WORKSPACE_ROOT, 'node_modules', '.bin', 'vue-tsc'),
    join(WORKSPACE_ROOT, 'docs', 'node_modules', '.bin', 'vue-tsc'),
  ];
  return candidates.find((p) => existsSync(p)) ?? null;
}

function runTypeCheck() {
  mkdirSync(join(WORKSPACE_ROOT, 'docs/corpus'), { recursive: true });
  const tmp = mkdtempSync(join(WORKSPACE_ROOT, 'docs/corpus', '.gate-examples-tmp-'));
  try {
    const byFile = new Map(); // relPath (posix, from tmp) -> snippet
    for (const s of materialized) {
      const abs = join(tmp, s.file);
      mkdirSync(dirname(abs), { recursive: true });
      writeFileSync(abs, s.code.endsWith('\n') ? s.code : `${s.code}\n`);
      byFile.set(s.file, s);
    }

    const paths = {};
    for (const { name, dir } of WORKSPACE_PACKAGES)
      paths[name] = [join(WORKSPACE_ROOT, 'packages', dir, 'src', 'index.ts')];

    // typeRoots: every workspace package's own node_modules/@types (pnpm's
    // isolated linking scopes each package's ambient devDependency types to its
    // own node_modules — see header) plus the repo root's. The plain (non-@types)
    // root node_modules dir is ALSO required: a subpath type reference like
    // vue-app.json's "vite/client" resolves against the real `vite` package
    // there, not under an `@types` directory — dropping this entry silently
    // breaks that resolution (verified empirically; do not remove).
    const typeRoots = [join(WORKSPACE_ROOT, 'node_modules', '@types'), join(WORKSPACE_ROOT, 'node_modules')];
    for (const { dir } of WORKSPACE_PACKAGES) typeRoots.push(join(WORKSPACE_ROOT, 'packages', dir, 'node_modules', '@types'));

    const tsconfig = {
      extends: join(WORKSPACE_ROOT, 'tsconfig', 'vue-app.json'),
      compilerOptions: {
        types: collectAmbientTypes(),
        typeRoots,
        baseUrl: tmp,
        paths,
      },
      include: ['examples/**/*', 'marked/**/*'],
    };
    const tsconfigPath = join(tmp, 'tsconfig.json');
    writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));

    const bin = resolveVueTscBin();
    if (!bin) {
      findings.push(`${toRel(join(WORKSPACE_ROOT, 'node_modules/.bin/vue-tsc'))} — vue-tsc not found; run \`pnpm install\` first`);
      return;
    }
    const res = spawnSync(bin, ['-p', tsconfigPath, '--noEmit'], { cwd: tmp, encoding: 'utf8' });
    if (res.error) {
      findings.push(`${SELF} — could not execute vue-tsc: ${res.error.message}`);
      return;
    }

    const DIAG_RE = /^(.+?)\((\d+),(\d+)\):\s*error\s*(TS\d+):\s*(.+)$/;
    const raw = `${res.stdout ?? ''}${res.stderr ?? ''}`;
    let matched = false;
    for (const line of raw.split('\n')) {
      const m = DIAG_RE.exec(line.trim());
      if (!m) continue;
      matched = true;
      const [, file, ln, col, code, message] = m;
      const relFile = file.replace(/\\/g, '/').replace(/^\.\//, '');
      const snippet = byFile.get(relFile);
      if (snippet) {
        findings.push(
          `${snippet.origin} — example '${snippet.id}' fails vue-tsc type-check against real workspace packages: ${code} ${message} (${relFile}:${ln}:${col})`,
        );
      } else {
        // A diagnostic outside any materialized snippet file (e.g. a real,
        // pre-existing error in a workspace package's own source) — surfaced
        // honestly, never swallowed (fail-closed posture).
        findings.push(`${relFile}:${ln}:${col} — vue-tsc ${code}: ${message}`);
      }
    }
    if (res.status !== 0 && !matched) {
      const tail = raw.trim().split('\n').slice(-5).join(' | ');
      findings.push(`${SELF} — vue-tsc exited ${res.status} with no parseable diagnostic${tail ? `: ${tail}` : ''}`);
    }
  } finally {
    try {
      rmSync(tmp, { recursive: true, force: true });
    } catch {
      /* best-effort */
    }
  }
}

runTypeCheck();

// ---------------------------------------------------------------------------
// Report + exit (2753-AC4 convention: `<file> — <reason>`, all findings first).
// ---------------------------------------------------------------------------
findings.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
for (const f of findings) console.error(f);

if (findings.length) {
  console.error(`${SELF}: ${findings.length} blocking finding(s) — ${materialized.length} snippet(s) materialized.`);
  process.exit(1);
}

console.log(`${SELF}: OK — ${materialized.length} example snippet(s) compiled clean against real workspace packages.`);
process.exit(0);
