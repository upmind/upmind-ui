#!/usr/bin/env node
// docs/corpus/glossary-resolve.mjs — FE-3003 3003p-AC2 (pull/resolve face)
//
// The pull half of the discovery channel: an agent (or a skill) that hits an
// unfamiliar term calls this on demand. Reads the slim `docs/corpus/glossary.json`
// (never a second glossary — `corpus.glossary.terms` + `corpus.index` are the only
// inputs, design §5.5/§5.6), matches a term or alias, and expands each referent
// through `corpus.index` to a living (kind, module, repo-relative path).
//
// Precedence (plan panel P2-1): an exact term-slug (or canonical term-name) match
// wins deterministically over an alias match, even when the input also collides
// with another term's alias. A genuine ALIAS tie (the input is a shared alias of
// two or more terms, with no slug/name match) prints every tied match and warns —
// it never silently picks one.
//
// Referents must resolve in `corpus.index` (gate:symbols already enforces this at
// CI time, 3003-AC2) — an absent id here is a corpus-integrity failure, not a
// resolver bug, and is reported loudly rather than silently dropped.
//
// Plain node ESM, no runtime deps (matching the docs/corpus/*.mjs siblings).
//
// Usage:
//   node docs/corpus/glossary-resolve.mjs <term-or-alias>
//   node docs/corpus/glossary-resolve.mjs --corpus <file> <term-or-alias>  (fixture override)
//
// Exit codes:
//   0 — resolved (a single deterministic match, or an alias tie printed with a warning)
//   1 — no term or alias matches the input
//   2 — corpus-integrity failure: a matched referent id does not resolve in corpus.index

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyReferents, moduleDocsFor, norm, parseCorpusArgs } from './glossary-lib.mjs';

const SELF = 'glossary-resolve';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url)); // <root>/docs/corpus
const ROOT = resolve(SCRIPT_DIR, '..', '..'); // <root>
const DEFAULT_GLOSSARY_PATH = join(SCRIPT_DIR, 'glossary.json'); // slim projection of corpus.json (FE-3003 W5)

const toRel = (fp) => relative(ROOT, fp).replace(/\\/g, '/') || fp;

function fail(msg, code) {
  console.error(`${SELF}: ${msg}`);
  process.exit(code);
}

function loadCorpus(corpusPath) {
  if (!existsSync(corpusPath))
    fail(`corpus not found at ${toRel(corpusPath)} — run \`pnpm --filter docs corpus:build\` first`, 1);
  let corpus;
  try {
    corpus = JSON.parse(readFileSync(corpusPath, 'utf8'));
  } catch (err) {
    fail(`${toRel(corpusPath)} is not valid JSON — ${err.message}`, 1);
  }
  return corpus;
}

// Case-insensitive equality, tolerant of the slug/name spacing difference
// (e.g. slug "payment-gateway" vs canonical term "payment gateway").
const normSlug = (s) => norm(s).replace(/[\s_]+/g, '-');

function findMatches(terms, input) {
  const wantExact = norm(input);
  const wantSlug = normSlug(input);
  const primary = [];
  const alias = [];
  for (const [slug, term] of Object.entries(terms)) {
    const isPrimary = normSlug(slug) === wantSlug || norm(term.term) === wantExact;
    if (isPrimary) {
      primary.push(slug);
      continue;
    }
    if ((term.aliases ?? []).some((a) => norm(a) === wantExact || normSlug(a) === wantSlug)) alias.push(slug);
  }
  return { primary, alias };
}

function renderTerm(slug, term, index) {
  const lines = [];
  lines.push(`## ${term.term} (${term.kind})  [slug: ${slug}]`);
  if (term.aliases?.length) lines.push(`aliases: ${term.aliases.join(', ')}`);
  lines.push('');
  lines.push(term.definition);
  lines.push('');
  lines.push('referents:');
  const { resolved, unresolved } = classifyReferents(term.referents, index);
  for (const { ref, entry } of resolved) lines.push(`  - ${ref.type} ${ref.id} -> ${entry.path}`);

  // Also surface the module docs/ set for any referent that lives in a module —
  // the pull face of the same push the inject hook does (operator ruling
  // 2026-08-19). Derived live via the shared moduleDocsFor, deduped across
  // referents that share a module. A term whose referents are all cross-cutting
  // (an ADR, a non-module symbol) adds nothing here — by design.
  const seen = new Set();
  const docs = [];
  for (const { entry } of resolved) {
    const info = moduleDocsFor(entry.path, ROOT);
    if (info && !seen.has(info.relDir)) {
      seen.add(info.relDir);
      docs.push(info);
    }
  }
  if (docs.length) {
    lines.push('');
    lines.push('module docs (read before changing the module):');
    for (const info of docs) {
      lines.push(`  - ${info.moduleName}: ${info.files.map((f) => `${info.relDir}/${f}`).join(', ')}`);
    }
  }
  return { text: lines.join('\n'), unresolved };
}

function main() {
  const { corpusPath, positional, error } = parseCorpusArgs(process.argv.slice(2), DEFAULT_GLOSSARY_PATH);
  if (error) fail(error, 1);
  const input = positional[0];
  if (!input) fail('usage: glossary-resolve.mjs [--corpus <file>] <term-or-alias>', 1);

  const corpus = loadCorpus(corpusPath);
  const terms = corpus.glossary?.terms ?? {};
  const index = corpus.index ?? {};

  const { primary, alias } = findMatches(terms, input);
  const winners = primary.length ? primary : alias;

  if (!winners.length) fail(`no term or alias matches "${input}"`, 1);

  if (winners.length > 1) {
    const detail = primary.length
      ? `matches ${winners.length} terms by canonical name/slug`
      : `is a shared alias of ${winners.length} terms`;
    console.error(
      `${SELF}: WARN — "${input}" ${detail} ` +
        `(${winners.join(', ')}); printing all, none silently picked (plan panel P2-1).`,
    );
  }

  const unresolvedAll = [];
  for (const slug of winners) {
    const { text, unresolved } = renderTerm(slug, terms[slug], index);
    console.log(text);
    console.log('');
    unresolvedAll.push(...unresolved.map((id) => `${slug}: ${id}`));
  }

  if (unresolvedAll.length) {
    fail(
      `corpus-integrity failure — referent id(s) do not resolve in corpus.index: ` +
        unresolvedAll.join(', '),
      2,
    );
  }
  process.exit(0);
}

main();
