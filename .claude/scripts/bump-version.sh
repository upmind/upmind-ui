#!/usr/bin/env bash
# Set every workspace package.json to one version via npm pkg set.
# types and upmind-ui are independently versioned and excluded.
# Usage: .claude/scripts/bump-version.sh 0.20.13
set -euo pipefail

VERSION="${1:-}"

if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.]+)?$ ]]; then
  echo "usage: $(basename "$0") <semver>" >&2
  exit 2
fi

cd "$(git rev-parse --show-toplevel)"

pnpm -r --include-workspace-root \
  --filter='!@upmind-automation/types' \
  --filter='!@upmind-automation/upmind-ui' \
  exec npm pkg set "version=$VERSION"

echo
git --no-pager diff --stat -- '*package.json'
echo
echo "exempt: @upmind-automation/types, @upmind-automation/upmind-ui"
echo "submodules apps/hosting + apps/velia commit in their own repos"
