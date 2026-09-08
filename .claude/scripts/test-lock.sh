#!/usr/bin/env bash
# Serialise every vitest run on this machine.
#
# WHY: caps bound ONE run (~2.5GB). Nothing bounded how MANY run at once.
# Agent seats, the IDE extension and a hand-typed command can each start one,
# and 8 concurrent capped runs still exhaust the box. Receipt: 2026-08-28,
# ~50GB, hard crash, twice.
#
# Atomic by mkdir — not "test -d then mkdir", which races.
# Stale-safe: a lock whose holder is dead is taken, never a permanent deadlock.
# CI: no-op — a CI box runs one job and has its own memory.

set -uo pipefail

[ -n "${CI:-}" ] && exec "$@"
[ -n "${GITLAB_CI:-}" ] && exec "$@"

LOCK_DIR="${TMPDIR:-/tmp}/upmind-vitest.lock"
WAIT_SECONDS="${UPMIND_TEST_LOCK_WAIT:-1800}"
waited=0

while true; do
  if mkdir "$LOCK_DIR" 2>/dev/null; then
    echo $$ > "$LOCK_DIR/pid"
    break
  fi

  holder=$(cat "$LOCK_DIR/pid" 2>/dev/null || echo "")

  # Stale: no pid recorded, or the recorded pid is gone.
  if [ -z "$holder" ] || ! kill -0 "$holder" 2>/dev/null; then
    echo "[test-lock] clearing stale lock (holder ${holder:-unknown} is gone)" >&2
    rm -rf "$LOCK_DIR"
    continue
  fi

  if [ "$waited" -ge "$WAIT_SECONDS" ]; then
    echo "[test-lock] timed out after ${WAIT_SECONDS}s waiting for pid $holder" >&2
    exit 1
  fi

  [ "$((waited % 30))" -eq 0 ] && \
    echo "[test-lock] waiting — pid $holder is running tests (${waited}s)" >&2
  sleep 2
  waited=$((waited + 2))
done

# Release on any exit path a trap can see. SIGKILL is covered by stale-detect.
trap 'rm -rf "$LOCK_DIR"' EXIT INT TERM HUP

"$@"
