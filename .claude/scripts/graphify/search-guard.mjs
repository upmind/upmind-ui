#!/usr/bin/env node
// search-guard.mjs — close the one door graphify's strict mode leaves open.
//
// `graphify hook-guard read --strict` denies the first cold **Read/Glob** of an
// indexed source file per session. It has no `--strict` for the search guard, so
// a shell `grep`/`rg`/`find` over source is only ever nudged — and that is the
// door agents actually walk through (observed: an agent ran `grep -rn` twice
// after a truncated query, and found callers the query had not surfaced).
//
// This guard mirrors graphify's own semantics exactly. It does NOT invent a
// policy:
//   * reuses graphify's `cache/last_query_stamp` — fresh stamp, no block
//   * reuses graphify's `cache/hook_sessions/<sid>.denied` marker via O_EXCL, so
//     a session is denied at most ONCE and an agent can never be stranded
//   * honours GRAPHIFY_HOOK_STRICT (0/off = kill switch, unset = on here)
//     and GRAPHIFY_HOOK_STRICT_TTL (default 1800s)
//
// Deliberately narrow, because the last hand-rolled guard in this repo used a
// loose regex and denied a `grep` over `.claude/settings.json` — config, not
// source. It only fires when ALL of these hold:
//   1. the command is a recursive content/name search (grep, rg, ag, ack, find)
//   2. it targets indexed SOURCE (a source extension, or a workspace code dir)
//   3. no graphify query has run recently in this project
//   4. this session has not already been denied
// Anything else — git, ls, a search over docs/config/node_modules, a piped
// search of command output — passes untouched. Every error path allows.
//
// Contract: reads a Claude Code PreToolUse payload on stdin, writes a
// hookSpecificOutput JSON to stdout, always exits 0. Never exit-code blocking.

import { readFileSync, statSync, mkdirSync, openSync, closeSync } from 'node:fs'
import { join } from 'node:path'

const ALLOW = ''
const out = (o) => {
  if (o) process.stdout.write(JSON.stringify(o))
  process.exit(0)
}

// --- payload ---------------------------------------------------------------
let payload = {}
try {
  payload = JSON.parse(readFileSync(0, 'utf8') || '{}')
} catch {
  out(ALLOW)
}
const command = String(payload?.tool_input?.command ?? '')
const sessionId = String(payload?.session_id ?? '')
if (!command) out(ALLOW)

// --- kill switch -----------------------------------------------------------
const strictEnv = String(process.env.GRAPHIFY_HOOK_STRICT ?? '')
  .trim()
  .toLowerCase()
if (['0', 'false', 'no', 'off'].includes(strictEnv)) out(ALLOW)
if (process.env.GRAPHIFY_SKIP_HOOK) out(ALLOW)

// --- 1. is this a source search at all? ------------------------------------
// Strip quotes so a *pattern* containing "grep" or ".ts" cannot trip us; we
// only want to reason about the command words and the paths being searched.
const unquoted = command.replace(/'[^']*'|"[^"]*"/g, ' ')
const SEARCH_CMD = /(^|[|;&]\s*|\(\s*)(grep|egrep|fgrep|rg|ag|ack|find)\b/
if (!SEARCH_CMD.test(unquoted)) out(ALLOW)

// A search of piped stdin is not a tree walk — let it through.
if (/\|\s*(grep|egrep|fgrep|rg|ag|ack)\b/.test(unquoted) && !/(^|[;&]\s*)(grep|egrep|fgrep|rg|ag|ack|find)\b/.test(unquoted))
  out(ALLOW)

// --- 2. does it target indexed source? -------------------------------------
const SOURCE_EXT = /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs|vue|svelte|py|go|rs|java|kt|rb|cs|php|swift)\b/
const CODE_DIR = /(^|[\s"'=/])(packages|apps|src|lib|server|app)\//
const looksLikeSource = SOURCE_EXT.test(command) || CODE_DIR.test(unquoted)
if (!looksLikeSource) out(ALLOW)

// Never block a search that is clearly about config, deps, or history.
const NOT_SOURCE = /(node_modules|\.git\/|graphify-out|dist\/|\.nuxt|coverage|package\.json|tsconfig|\.gitignore|settings\.json|\.mcp\.json|pnpm-lock)/
if (NOT_SOURCE.test(command)) out(ALLOW)

// --- 3. has graphify oriented us recently? ---------------------------------
const outDir = process.env.GRAPHIFY_OUT || 'graphify-out'
const graph = join(outDir, 'graph.json')
try {
  statSync(graph) // no graph in this project -> nothing to enforce
} catch {
  out(ALLOW)
}

const ttl = Number(process.env.GRAPHIFY_HOOK_STRICT_TTL ?? 1800)
try {
  const stamp = statSync(join(outDir, 'cache', 'last_query_stamp'))
  if ((Date.now() - stamp.mtimeMs) / 1000 < ttl) out(ALLOW)
} catch {
  /* no stamp yet -> not oriented */
}

// --- 4. claim the one-time deny for this session ---------------------------
// Same O_EXCL claim graphify uses, in the same directory, so read and search
// share one budget: whichever door the agent tries first spends the session's
// single deny.
const sid = sessionId.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 64)
if (!sid) out(ALLOW) // cannot bound the deny -> never block
try {
  const dir = join(outDir, 'cache', 'hook_sessions')
  mkdirSync(dir, { recursive: true })
  closeSync(openSync(join(dir, `${sid}.denied`), 'wx'))
} catch {
  out(ALLOW) // already denied this session, or unwritable -> allow
}

out({
  hookSpecificOutput: {
    hookEventName: 'PreToolUse',
    permissionDecision: 'deny',
    permissionDecisionReason:
      'graphify strict mode: this project has a knowledge graph that already ' +
      'holds the relationships you are about to grep for, including cross-package ' +
      'callers a text search will miss. Run `graphify query "<your question>"` ' +
      '(or `graphify explain` / `graphify path` / `graphify affected "<symbol>"`) ' +
      'FIRST, then re-issue this search — it will be allowed. If the query output ' +
      'is truncated, raise it with `--budget 8000` or narrow it with ' +
      '`--context call` rather than falling back to grep. This block fires at ' +
      'most once per session. Apply the same rule in any subagent prompt that ' +
      'explores code.',
  },
})
