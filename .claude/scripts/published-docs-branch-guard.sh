#!/usr/bin/env bash
# Blocks commits/pushes to `main` in the docs/published-docs (mintlify-docs)
# submodule. `main` is the live published Mintlify target — work goes to
# `develop`, or a feature branch with an MR into develop.
#
# Used two ways, both reading the same check:
#   1. Claude Code PreToolUse(Bash) hook — tool call arrives as JSON on stdin.
#   2. git pre-push/pre-commit hook inside the submodule — no stdin, so it
#      checks unconditionally (it only ever runs for that repo).
#
# `git commit --no-verify` bypasses the git-hook side. This is a guard rail
# against the accident, not a wall; real enforcement is server-side.

set -uo pipefail

SUBMODULE="docs/published-docs"
PROTECTED="main"

deny() {
  echo "BLOCKED: $SUBMODULE is on '$PROTECTED'." >&2
  echo "mintlify-docs commits go to 'develop', or a feature branch with an MR into develop — never '$PROTECTED'." >&2
  echo "Fix: git -C $SUBMODULE checkout develop" >&2
  exit 2
}

current_branch() {
  git -C "$1" rev-parse --abbrev-ref HEAD 2>/dev/null
}

# --- git-hook mode: invoked from inside the submodule, nothing on stdin.
if [ "${1:-}" = "--git-hook" ]; then
  [ "$(git rev-parse --abbrev-ref HEAD 2>/dev/null)" = "$PROTECTED" ] && deny
  exit 0
fi

# --- Claude PreToolUse mode: tool call JSON on stdin.
command=$(jq -r '.tool_input.command // empty' 2>/dev/null)
[ -z "$command" ] && exit 0

# Only inspect git writes that could reach the submodule.
#
# `commit`/`push` must be a git SUBCOMMAND — space-separated, on the same
# shell segment as `git`. Matching the bare word instead also fires on
# `pre-commit` / `pre-push` (the hyphen is a word boundary), which blocks
# harmless commands that merely name the hook files.
echo "$command" | grep -Eq '(^|[;&|(]|[[:space:]])git[[:space:]]+([^;&|]*[[:space:]]+)?(commit|push)([[:space:]]|$)' || exit 0
echo "$command" | grep -q 'published-docs' || exit 0

# Resolve the LIVE branch rather than parsing the command — this catches
# `cd published-docs && git commit`, `git -C published-docs push`, and a
# detached HEAD sitting on main, which command-parsing all miss.
root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
[ -d "$root/$SUBMODULE" ] || exit 0
[ "$(current_branch "$root/$SUBMODULE")" = "$PROTECTED" ] && deny

exit 0
