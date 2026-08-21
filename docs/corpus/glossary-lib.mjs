// docs/corpus/glossary-lib.mjs — shared helpers for glossary-inject.mjs /
// glossary-resolve.mjs (ultra-review MR !504 P3-8: the norm/escapeRegExp +
// referent-resolution logic had already drifted between the two scripts).
//
// Plain node ESM, no runtime deps (matching the docs/corpus/*.mjs siblings).

import { existsSync, readdirSync } from 'node:fs';
import { basename, relative, resolve } from 'node:path';

export const norm = (s) => String(s ?? '').trim().toLowerCase();

export const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Resolves a term's `referents` array through `corpus.index`, splitting into
// referents that resolve (each paired with its index entry) and the ids of
// any that don't. An unresolved id is a corpus-integrity gap, not something
// either caller should ever silently drop.
export function classifyReferents(referents, index) {
  const resolved = [];
  const unresolved = [];
  for (const ref of referents ?? []) {
    const entry = index[ref.id];
    if (entry) resolved.push({ ref, entry });
    else unresolved.push(ref.id);
  }
  return { resolved, unresolved };
}

// Derive a module's own `docs/` set from a file path that lives inside a
// `.../modules/<name>/` directory (operator ruling 2026-08-19 — the recurring
// miss behind scope / `.as('self')`-vs-`.for('client', id)` confusion). Shared
// by both discovery faces: the push hook (glossary-inject) keys it off the
// touched file path, the pull CLI (glossary-resolve) keys it off each referent
// path. Read LIVE from the folder — never a hand-listed path, so it cannot
// drift. Returns null when the path is not inside a module, the module has no
// `docs/` dir, or that dir holds no `.md` files. Never throws.
//   baseDir — the root a relative filePath resolves against (the hook passes its
//   cwd; the resolver passes the repo root). An absolute filePath ignores it.
export function moduleDocsFor(filePath, baseDir) {
  if (!filePath) return null;
  const norm = String(filePath).replace(/\\/g, '/');
  const m = norm.match(/^(.*\/modules\/[^/]+)\//);
  if (!m) return null;
  const base = baseDir ?? process.cwd();
  const docsDir = resolve(base, m[1], 'docs');
  let files;
  try {
    if (!existsSync(docsDir)) return null;
    files = readdirSync(docsDir).filter((f) => f.endsWith('.md')).sort();
  } catch {
    return null;
  }
  if (!files.length) return null;
  const relDir = relative(base, docsDir).replace(/\\/g, '/') || docsDir;
  return { moduleName: basename(m[1]), relDir, files };
}

// Shared CLI parse for both faces: pulls `--corpus <file>` (resolved against
// cwd) and returns the remaining positional args. A `--corpus` with no value is
// reported via `error` rather than silently becoming cwd (which surfaced as a
// misleading "not valid JSON / EISDIR"); the caller decides how to surface it —
// the resolve CLI fails loudly, the inject hook stays silent and never throws.
export function parseCorpusArgs(argv, defaultCorpusPath) {
  let corpusPath = defaultCorpusPath;
  let error = null;
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--corpus') {
      const val = argv[++i];
      if (val == null) {
        error = '--corpus requires a file path';
        continue;
      }
      corpusPath = resolve(process.cwd(), val);
    } else {
      positional.push(argv[i]);
    }
  }
  return { corpusPath, positional, error };
}
