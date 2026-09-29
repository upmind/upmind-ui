#!/usr/bin/env bash
# PreToolUse(Bash): refuse a SECOND concurrent vitest.
#
# Caps bound one run (~2.5GB). Nothing bounded how many run at once — agent
# seats, the IDE extension and a hand-typed command can each start one, and
# concurrent capped runs still exhaust the box.
# Receipt: 2026-08-28, ~50GB resident, hard crash, twice in one day.
#
# A hook cannot hold a lock across the command's life, so it does the one thing
# it can do reliably: refuse to START a run while another is live. The agent
# retries; nothing is silently skipped.

set -uo pipefail

[ -n "${CI:-}" ] && exit 0
[ -n "${GITLAB_CI:-}" ] && exit 0

payload=$(cat)
cmd=$(printf '%s' "$payload" | python3 -c 'import json,sys
try: print(json.load(sys.stdin).get("tool_input",{}).get("command",""))
except Exception: print("")' 2>/dev/null)

# Only guard commands that actually start a test run.
printf '%s' "$cmd" | grep -qE '(^|[^a-z-])vitest( |$)|test:unit|test:integration|pnpm +(-r +)?test' || exit 0
# ...but never guard a command that merely reads about them.
printf '%s' "$cmd" | grep -qE '^\s*(cat|grep|rg|head|tail|ls|find|git) ' && exit 0

# Operator ruling 2026-09-25: one run per project, and no limit across
# projects. A run is its MAIN vitest process — titled "node (vitest)", or a
# CLI still named vitest.mjs — never its workers ("node (vitest 1)",
# forks.js). Its project is its working directory.
project="${CLAUDE_PROJECT_DIR:-$PWD}"

mains=$(ps -Ao pid=,command= 2>/dev/null |
  awk '$2 == "node" && ($3 == "(vitest)" || $3 ~ /vitest\.mjs$/) { print $1 }')

live=0
here=0
for pid in $mains; do
  live=$((live + 1))
  cwd=$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p')
  case "$cwd" in "$project" | "$project"/*) here=$((here + 1)) ;; esac
done

if [ "$here" -gt 0 ]; then
  holders=$(pgrep -fl "node.*vitest" 2>/dev/null | head -3 | sed 's/^/    /')
  cat >&2 <<MSG
DENIED: a vitest run is already in progress in this project ($live on the
machine; the limit is one per project).

Running two test suites at once has hard-crashed this machine twice
(2026-08-28, ~50GB resident). Worker caps bound ONE run; they do not
bound how many start.

Already running:
$holders

Simply RE-RUN your command in a moment. This guard allows it the instant the
other run finishes.

Do NOT write a wait loop that polls for vitest. A shell command containing the
word "vitest" MATCHES ITSELF under `pgrep -f vitest`, so the loop waits on its
own process and never exits. This guard is the only thing that needs to check.

Do not work around this by changing the command — serialise instead.
MSG
  exit 2
fi

exit 0
