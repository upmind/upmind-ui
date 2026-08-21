#!/usr/bin/env node
// docs/corpus/glossary-inject.mjs — FE-3003 3003p-AC3/AC5 (push/inject face)
//
// The push half of the discovery channel. Modelled on the existing graphify
// `PreToolUse` hooks in `monorepo/.claude/settings.json` (guarded
// `additionalContext` JSON, same mechanism) — NOT the SessionStart plain-stdout
// digest `inject-laws.sh` uses. Operator resolution (2026-07-24, plan OQ-1):
// push keys off what the agent TOUCHES — the file/module/term appearing in its
// current tool call — not a whole-session digest. Wired as a `PreToolUse`
// command hook; Claude Code pipes the tool-call payload (`tool_name`,
// `tool_input`, ...) to this process's stdin.
//
// Guards (plan panel P1-3, all three closed here):
//   1. corpus-absent / unreadable / unparseable / unreadable stdin -> degrade
//      silently: exit 0, empty stdout. Never throws — mirrors
//      `inject-laws.sh`'s `[ ! -d "$RULES_DIR" ]` guard and the graphify hook's
//      `[ -f graphify-out/graph.json ] ... || true`.
//   2. Output contract: when (and only when) a match is found, print exactly
//      one line of `{"hookSpecificOutput":{"hookEventName":"PreToolUse",
//      "additionalContext":"..."}}` — the same shape the graphify PreToolUse
//      hooks already emit. No match -> no stdout at all (a no-op hook).
//   3. Firing context: this is wired into `monorepo/.claude/settings.json`,
//      which only loads for sessions whose cwd is a monorepo worktree (plan
//      OQ-1 note) — same scope as the graphify hooks it mirrors.
//
// Bounded emission (plan §3.11 narrowing discipline / 3003p-AC5): at most
// MAX_TERMS_PER_INJECT terms, each digest line truncated to MAX_DEFINITION_CHARS.
// A file-path hit (the agent is reading/editing the exact file a referent
// resolves to) ranks above a term/alias text mention.
//
// "Task assignment" as a second matching input (plan OQ-1) has no wire format
// in the current Claude Code PreToolUse payload — this pass matches on tool-call
// content only (file path / grep-glob pattern / bash command); left as a
// documented, not fabricated, extension point.
//
// Plain node ESM, no runtime deps (matching the docs/corpus/*.mjs siblings).
//
// Usage (as a hook): node docs/corpus/glossary-inject.mjs   (reads JSON from stdin)
// Usage (fixture):   node docs/corpus/glossary-inject.mjs --corpus <file>   (stdin as above)

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyReferents, escapeRegExp, moduleDocsFor, norm, parseCorpusArgs } from './glossary-lib.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url)); // <root>/docs/corpus
const DEFAULT_GLOSSARY_PATH = join(SCRIPT_DIR, 'glossary.json'); // slim projection of corpus.json (FE-3003 W5)
const SESSION_STATE_DIR = join(tmpdir(), 'upmind-glossary-inject-sessions');

const MAX_TERMS_PER_INJECT = 3;
const MAX_DEFINITION_CHARS = 160;
const MAX_DOC_FILES = 8;
const MAX_STDIN_BYTES = 1_048_576; // 1 MB, measured in BYTES; big enough that a real Write/Edit payload still parses (its file_path must inject), small enough to skip a runaway payload without ever parsing it
// A session id becomes part of a filesystem path; restrict it to a safe charset
// so an untrusted payload can never traverse out of the session-state dir.
const SESSION_ID_RE = /^[\w-]+$/;

const FILE_TOOLS = new Set(['Read', 'Edit', 'Write', 'NotebookEdit']);

function readStdinJson() {
  try {
    const raw = readFileSync(0, 'utf8');
    if (!raw.trim()) return null;
    // Bounded in BYTES (not UTF-16 code units): a normal Write/Edit payload
    // carries real file content and must still parse so its file_path injects;
    // only a genuinely huge payload is skipped, never parsed. Never throws.
    if (Buffer.byteLength(raw, 'utf8') > MAX_STDIN_BYTES) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Per-session dedup so a repeatedly-touched term is only injected once per
// Claude Code session (plan panel P2-1 fast-follow). Best-effort: any read/
// write failure just disables dedup for this call, it never blocks emission.
function loadInjectedSlugs(sessionId) {
  if (!sessionId) return new Set();
  try {
    const raw = readFileSync(join(SESSION_STATE_DIR, `${sessionId}.json`), 'utf8');
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function saveInjectedSlugs(sessionId, slugs) {
  if (!sessionId) return;
  try {
    mkdirSync(SESSION_STATE_DIR, { recursive: true });
    writeFileSync(join(SESSION_STATE_DIR, `${sessionId}.json`), JSON.stringify([...slugs]));
  } catch {
    /* best-effort only */
  }
}

function loadCorpus(corpusPath) {
  if (!existsSync(corpusPath)) return null;
  try {
    return JSON.parse(readFileSync(corpusPath, 'utf8'));
  } catch {
    return null;
  }
}

function touchedFilePath(toolName, toolInput) {
  if (!FILE_TOOLS.has(toolName)) return '';
  return String(toolInput?.file_path ?? toolInput?.notebook_path ?? '').replace(/\\/g, '/');
}

// Path-triggered module-docs pointer: when a tool touches a file inside a module
// that carries its own `docs/` set, surface that set so the agent reads it
// BEFORE designing changes to the module (the recurring miss behind scope /
// `.as('self')`-vs-`.for('client', id)` confusion). Derivation lives in
// glossary-lib.moduleDocsFor (shared with the pull face so the two can't drift);
// this wrapper only formats the one-line pointer. Gated behind the same
// corpus-present contract as the term digest (see main).
function moduleDocsPointer(filePath) {
  const info = moduleDocsFor(filePath, process.cwd());
  if (!info) return null;
  const shown = info.files.slice(0, MAX_DOC_FILES);
  const more = info.files.length > shown.length ? `, +${info.files.length - shown.length} more` : '';
  const text = `module "${info.moduleName}" has its own docs — read before designing changes to it: ${shown.join(', ')}${more} (in ${info.relDir}/)`;
  return { key: `mod:${info.relDir}`, text };
}

// Bash/Grep/Glob text signal only (never FILE_TOOLS — plan panel P2-1: a file
// path is matched exclusively via the referent-path hit below, never as text).
function touchedText(toolName, toolInput) {
  const ti = toolInput ?? {};
  if (toolName === 'Grep' || toolName === 'Glob') return [ti.pattern, ti.path].filter(Boolean).join(' ');
  if (toolName === 'Bash') return String(ti.command ?? '');
  return '';
}

// A single common word (`system`, `client`, `order`, ...) matched anywhere in
// a Bash command/Grep pattern is noise (P2-1 repro: `curl .../system/status`).
// Multi-word candidates ("payment gateway", "tanstack query") are a strong
// enough signal to keep substring matching; single-word candidates require an
// exact whole-token match so a word embedded in a path/URL never counts.
function mentionsPhrase(text, tokens, phrase) {
  const p = norm(phrase);
  if (!p) return false;
  if (p.includes(' ')) return new RegExp(`\\b${escapeRegExp(p)}\\b`, 'i').test(text);
  return tokens.includes(p);
}

// Rank: an exact referent-file hit first, then a term/alias/slug text mention.
// Each group sorted by slug for a deterministic, bounded selection.
function matchTerms(terms, index, toolName, toolInput) {
  const filePath = touchedFilePath(toolName, toolInput);
  const text = touchedText(toolName, toolInput);
  const tokens = text ? text.split(/\s+/).map((t) => norm(t).replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')).filter(Boolean) : [];
  const pathHits = [];
  const textHits = [];
  for (const [slug, term] of Object.entries(terms)) {
    if (filePath) {
      const isPathHit = (term.referents ?? []).some((ref) => {
        const p = index[ref.id]?.path;
        return p && (filePath === p || filePath.endsWith(`/${p}`));
      });
      if (isPathHit) {
        pathHits.push(slug);
        continue;
      }
    }
    if (text) {
      const candidates = [term.term, slug, ...(term.aliases ?? [])];
      if (candidates.some((c) => mentionsPhrase(text, tokens, c))) textHits.push(slug);
    }
  }
  pathHits.sort();
  textHits.sort();
  return [...pathHits, ...textHits];
}

function digestLine(slug, term, index) {
  const { resolved, unresolved } = classifyReferents(term.referents, index);
  if (unresolved.length) {
    // Never silently drop a corpus-integrity gap — surface it on stderr without
    // failing the hook (a hook must never throw; gate:symbols is the CI stop).
    console.error(`glossary-inject: term "${slug}" has unresolved referent id(s): ${unresolved.join(', ')}`);
  }
  const paths = [...new Set(resolved.map(({ entry }) => entry.path))];
  const aliasPart = term.aliases?.length ? ` [${term.aliases.join(', ')}]` : '';
  const rawDef = String(term.definition ?? '');
  const def = rawDef.length > MAX_DEFINITION_CHARS ? `${rawDef.slice(0, MAX_DEFINITION_CHARS - 1)}…` : rawDef;
  const refPart = paths.length ? ` (${paths.join(', ')})` : '';
  return `${term.term}${aliasPart}: ${def}${refPart}`;
}

function main() {
  const { corpusPath } = parseCorpusArgs(process.argv.slice(2), DEFAULT_GLOSSARY_PATH);

  const payload = readStdinJson();
  if (!payload || !payload.tool_name) process.exit(0);
  // Sanitise the session id before it becomes part of a filesystem path (W6):
  // an unsafe value disables dedup rather than traversing outside the state dir.
  const sessionId = SESSION_ID_RE.test(String(payload.session_id ?? '')) ? payload.session_id : null;

  const corpus = loadCorpus(corpusPath);
  const terms = corpus?.glossary?.terms;
  const index = corpus?.index;
  if (!terms || !index) process.exit(0);

  const alreadyInjected = loadInjectedSlugs(sessionId);

  // Push 1 — the touched module's own docs, keyed off the file path (once per
  // module per session). Independent of any term match: an agent opening a
  // module file is pointed at that module's docs even when no term fires.
  const docs = moduleDocsPointer(touchedFilePath(payload.tool_name, payload.tool_input));
  const emitDocs = docs && !alreadyInjected.has(docs.key);

  // Push 2 — the bounded glossary term digest (once per term per session).
  const candidates = matchTerms(terms, index, payload.tool_name, payload.tool_input);
  const slugs = candidates.filter((slug) => !alreadyInjected.has(slug)).slice(0, MAX_TERMS_PER_INJECT);

  if (!emitDocs && !slugs.length) process.exit(0);

  const parts = [];
  if (emitDocs) parts.push(docs.text);
  if (slugs.length) parts.push(`glossary: ${slugs.map((slug) => digestLine(slug, terms[slug], index)).join(' | ')}`);
  const additionalContext = parts.join('\n');
  console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext } }));

  const injected = new Set([...alreadyInjected, ...slugs]);
  if (emitDocs) injected.add(docs.key);
  saveInjectedSlugs(sessionId, injected);
  process.exit(0);
}

main();
