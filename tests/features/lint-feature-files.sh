#!/usr/bin/env bash
#
# lint-feature-files.sh — guard `.feature` files against imperative drift.
#
# Per ADR 020 Phase B (docs/adr/020-gherkin-test-planning.md) and the style
# guide (tests/features/10-feature-style.md), `.feature` files are a
# *declarative planning artefact* the product team reviews — they describe
# WHAT a user is trying to achieve, never HOW the UI is driven. The single
# largest failure mode of Gherkin adoption is "imperative drift": scenarios
# that start declarative and decay into UI scripts full of selectors, URLs and
# click/type/fill/press mechanics. This is a dumb, fast grep — no AST parsing —
# that mechanically fails a `.feature` file the moment that drift appears.
#
# Usage:
#   bash tests/features/lint-feature-files.sh                 # lint all features
#   bash tests/features/lint-feature-files.sh path/a.feature  # lint given files (lint-staged)
#
# Exit status: 0 when every scanned file is clean, 1 when any file has a
# banned pattern (the offending file:line and rule are printed).
#
# Portability: POSIX ERE only. Word boundaries are emulated with [^[:alnum:]_]
# rather than \b so the same patterns behave identically under GNU grep (CI),
# BSD grep (macOS) and busybox grep (Alpine).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
# The .feature specs live alongside this linter, grouped by flow, plus any
# package-colocated features under packages/*/src/** (e.g. __tests__/,
# __fixtures__/ — FE-2976 T18).
FEATURES_DIR="${SCRIPT_DIR}"
PACKAGES_DIR="${REPO_ROOT}/packages"
STYLE_GUIDE="tests/features/10-feature-style.md"

# --- Banned-pattern rules ----------------------------------------------------
# Each entry is "human label|POSIX-ERE regex". Matched case-insensitively
# against NON-COMMENT lines (Gherkin line comments start with '#', which are
# skipped so the id-selector rule below does not fire on them).
#
# The verb rules deliberately encode the AC's "as imperatives" qualifier:
#   - click / fill / press match as whole words (leading boundary catches the
#     -s/-ed/-ing forms) — the boundary keeps "fulfill", "WordPress" and
#     "express" from tripping the check.
#   - "type" only trips in verb position (preceded by a subject/pronoun) so the
#     legitimate domain noun "product type" / "card type" is left alone.
RULES=(
  "Playwright / testid selector (getByTestId, data-testid, data-test-key)|getbytestid|data-testid|data-test-key"
  "CSS attribute selector (e.g. [role=…])|\[[a-z][a-z0-9_-]*[~^\$*|]?="
  "CSS id selector (e.g. #promo-input)|#[a-z][a-z0-9_-]*"
  "CSS class selector (e.g. .promo-input)|\.[a-z][a-z0-9_]*-[a-z0-9_-]+"
  "Hard-coded URL (http://, https://, /order/)|https?://|/order/"
  "Imperative verb 'click'|(^|[^[:alnum:]_])click"
  "Imperative verb 'fill'|(^|[^[:alnum:]_])fill"
  "Imperative verb 'press'|(^|[^[:alnum:]_])press"
  "Imperative verb 'type'|(^|[^[:alnum:]_])(i|we|you|they|to|then|when|and|user|users|customer|customers|visitor|visitors|guest|guests)[[:space:]]+type"
)

# --- Collect target files ----------------------------------------------------
files=()
if [ "$#" -gt 0 ]; then
  for f in "$@"; do
    case "$f" in
      *.feature) [ -f "$f" ] && files+=("$f") ;;
    esac
  done
else
  while IFS= read -r f; do files+=("$f"); done < <(
    { find "${FEATURES_DIR}" -type f -name '*.feature'
      find "${PACKAGES_DIR}" -type f -path '*/src/*' -name '*.feature' -not -path '*/node_modules/*'
    } | sort -u
  )
fi

if [ "${#files[@]}" -eq 0 ]; then
  echo "lint:features — no .feature files to check."
  exit 0
fi

# --- Scan --------------------------------------------------------------------
violations=0
for file in "${files[@]}"; do
  # Number every line, then drop Gherkin comment lines (first non-space is '#')
  # so the '#' id-selector rule never fires on a legitimate comment.
  scan="$(grep -n '' "${file}" | grep -vE '^[0-9]+:[[:space:]]*#' || true)"
  [ -n "${scan}" ] || continue

  for rule in "${RULES[@]}"; do
    label="${rule%%|*}"
    regex="${rule#*|}"
    matches="$(printf '%s\n' "${scan}" | grep -iE "${regex}" || true)"
    if [ -n "${matches}" ]; then
      echo "✖ ${file}"
      echo "    rule: ${label}"
      printf '%s\n' "${matches}" | sed 's/^/    /'
      violations=$((violations + 1))
    fi
  done
done

# --- Report ------------------------------------------------------------------
if [ "${violations}" -gt 0 ]; then
  echo ""
  echo "✖ ${violations} imperative-drift violation(s) found in .feature files."
  echo "  .feature files are declarative specs, not UI scripts — describe WHAT"
  echo "  the user wants, not HOW the UI is driven. See ${STYLE_GUIDE}."
  exit 1
fi

echo "✔ lint:features — ${#files[@]} .feature file(s) are declarative and clean."
