#!/usr/bin/env bash
# Installs the branch guard as a git hook inside the docs/published-docs
# submodule. Git hooks are never cloned, so this re-runs from the monorepo's
# `prepare` script on every `pnpm install` — a fresh clone is guarded before
# anyone can commit.
#
# Writes into the submodule's real hooks dir (resolved via `git rev-parse
# --git-path hooks`, which follows the .git-file indirection submodules use).

set -uo pipefail

SUBMODULE="docs/published-docs"
GUARD=".claude/scripts/published-docs-branch-guard.sh"

root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
[ -e "$root/$SUBMODULE/.git" ] || exit 0   # submodule not initialised — nothing to guard

hooks_dir=$(git -C "$root/$SUBMODULE" rev-parse --git-path hooks 2>/dev/null) || exit 0
case "$hooks_dir" in
  /*) ;;                                    # already absolute
  *) hooks_dir="$root/$SUBMODULE/$hooks_dir" ;;
esac
mkdir -p "$hooks_dir" || exit 0

for hook in pre-commit pre-push; do
  cat > "$hooks_dir/$hook" <<EOF
#!/usr/bin/env bash
# Installed by $GUARD (monorepo prepare). Do not edit here — edit the source.
exec bash "$root/$GUARD" --git-hook
EOF
  chmod +x "$hooks_dir/$hook"
done

echo "[published-docs] branch guard installed (pre-commit, pre-push)"
