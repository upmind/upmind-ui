#!/usr/bin/env bash
# serial-test-guard.sh — PreToolUse(Bash) hook: NEVER two test/type-check
# processes at once on this machine.
#
# Receipt (2026-08-24): two background agents each running the full labs
# vitest suite plus vue-tsc crashed the operator's machine, twice. Memory
# notes did not stop it (agents ignore prose); this hook does. It DENIES any
# Bash command that would start vitest / vue-tsc / nuxt typecheck while one
# already runs, and denies uncapped vitest suite runs outright.
#
# Contract (Claude Code hooks): payload JSON on stdin; exit 2 = deny, with
# the reason on stderr; exit 0 = allow. Fail OPEN on parse trouble — this is
# a machine-safety rail, not a correctness gate.

set -u

payload="$(cat 2>/dev/null || true)"
[ -n "$payload" ] || exit 0

if command -v jq >/dev/null 2>&1; then
  cmd="$(printf '%s' "$payload" | jq -r '.tool_input.command // empty' 2>/dev/null)"
else
  cmd="$(printf '%s' "$payload" | grep -oE '"command"[[:space:]]*:[[:space:]]*"(\\.|[^"\\])*"' | head -n1)"
fi
[ -n "$cmd" ] || exit 0

# Only test/type-check launchers are in scope.
if ! printf '%s' "$cmd" | grep -qE 'vitest|vue-tsc|nuxt[[:space:]]+typecheck|type-check|pnpm[^|;&]*[[:space:]]test(:[a-z]+)?([[:space:]]|$)'; then
  exit 0
fi

# Rule 1: one runner at a time. Deny while any test/type-check process lives.
# Match REAL runner processes (node_modules binaries), not shells whose
# command text merely mentions the words — pgrep -f reads whole cmdlines and
# would otherwise match this hook's own caller.
if pgrep -f 'node_modules/.*(vitest|vue-tsc)' >/dev/null 2>&1 \
  || pgrep -f 'node_modules/.*nuxt.*typecheck' >/dev/null 2>&1; then
  echo "serial-test-guard: DENIED — a vitest/vue-tsc/typecheck process is already running. Parallel suite runs crash this machine (receipt 2026-08-24). Wait for it to finish, then run ONE suite at a time." >&2
  exit 2
fi

# Rule 2: vitest suite runs must cap workers. Single-file runs are exempt
# (a path argument containing a filename with .spec/.test), as is vue-tsc.
if printf '%s' "$cmd" | grep -qE 'vitest|pnpm[^|;&]*[[:space:]]test(:[a-z]+)?([[:space:]]|$)'; then
  if ! printf '%s' "$cmd" | grep -qE '(maxWorkers|max-workers|poolOptions)' \
    && ! printf '%s' "$cmd" | grep -qE '\.(spec|test)\.[a-z]+'; then
    echo "serial-test-guard: DENIED — full suite run without a worker cap. Append '--maxWorkers=2' (or run a single spec file). Uncapped parallel workers crash this machine (receipt 2026-08-24)." >&2
    exit 2
  fi
fi

exit 0
