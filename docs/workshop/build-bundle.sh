#!/usr/bin/env bash
# Assemble the Contabo workshop handover bundle.
#
# Run from the monorepo root:
#   ./docs/workshop/build-bundle.sh                  # writes to ./workshop-bundle/
#   ./docs/workshop/build-bundle.sh ../my-bundle     # custom output path
#
# Produces a folder containing every artefact the team needs to run the workshop
# without referencing this monorepo. Tarball it after for distribution:
#   tar -czf workshop-bundle.tar.gz workshop-bundle
#
# The output folder is named `workshop-bundle` so when the team extracts the
# tarball inside their prototype repo, the loading prompt's `workshop-bundle/`
# paths resolve immediately with no rename step.

set -euo pipefail

BUNDLE="${1:-./workshop-bundle}"
ROOT="$(git rev-parse --show-toplevel)"

# Safety: refuse to overwrite a non-bundle directory
if [[ -d "${BUNDLE}" && ! -f "${BUNDLE}/01-workshop-plan.md" ]]; then
  echo "Error: ${BUNDLE} exists and does not look like a previous bundle (missing 01-workshop-plan.md)." >&2
  echo "Refusing to overwrite. Delete it manually or choose a different path." >&2
  exit 1
fi

rm -rf "${BUNDLE}"
mkdir -p "${BUNDLE}"/{02-module-foundations,04-sdd,06-initiator/templates/.claude,07-references/recordings}

echo "Building bundle at ${BUNDLE}"

# --- 01: workshop plan ----------------------------------------------------------
cp "${ROOT}/docs/workshop/contabo.md" "${BUNDLE}/01-workshop-plan.md"

# --- 02: module foundations -----------------------------------------------------
MODULES=(
  session client brand system
  productCatalogue productCategories product
  basket basketProduct
  paymentDetails payment invoices
)
for m in "${MODULES[@]}"; do
  src="${ROOT}/packages/headless/src/modules/${m}/docs/foundation.md"
  if [[ ! -f "${src}" ]]; then
    echo "  ! Missing module foundation doc: ${src}" >&2
    exit 1
  fi
  cp "${src}" "${BUNDLE}/02-module-foundations/${m}.md"
done

# --- 03: foundations chapter ----------------------------------------------------
cp "${ROOT}/docs/workshop/foundations.md" "${BUNDLE}/03-foundations-chapter.md"

# --- 04: SDDs -------------------------------------------------------------------
cp "${ROOT}/docs/workshop/sdd/"*.md "${BUNDLE}/04-sdd/"

# --- 05: build-your-own-core ----------------------------------------------------
cp "${ROOT}/docs/workshop/build-your-own-core.md" "${BUNDLE}/05-build-your-own-core.md"

# --- Loading prompt (Day-1 paste-this file) --------------------------------------
cp "${ROOT}/docs/workshop/LOADING_PROMPT.md" "${BUNDLE}/LOADING_PROMPT.md"

# --- Feedback / retro prompt -----------------------------------------------------
cp "${ROOT}/docs/workshop/feedback-prompt.md" "${BUNDLE}/feedback-prompt.md"

# --- 06: initiator (all three layers + a small README pointing at the right one)
cp "${ROOT}/docs/workshop/_initiator/generic.md"     "${BUNDLE}/06-initiator/generic.md"
cp "${ROOT}/docs/workshop/_initiator/cursor.md"      "${BUNDLE}/06-initiator/cursor.md"
cp "${ROOT}/docs/workshop/_initiator/claude-code.md" "${BUNDLE}/06-initiator/claude-code.md"

# Templates dropped by the Claude Code loading prompt as step 0
cp "${ROOT}/docs/workshop/_initiator/templates/CLAUDE.md"              "${BUNDLE}/06-initiator/templates/CLAUDE.md"
cp "${ROOT}/docs/workshop/_initiator/templates/.claude/settings.json"  "${BUNDLE}/06-initiator/templates/.claude/settings.json"

# Inline initiator README (kept in sync with bundle-manifest.md "Initiator README")
cat > "${BUNDLE}/06-initiator/README.md" <<'INITIATOR_README'
# Workshop initiator — which file to use

This folder contains three layered variants of the same workshop kickoff prompt.
**Use the one that matches your agent tooling.** Don't manually combine them.

| Your agent | File to use |
| --- | --- |
| Cursor | `cursor.md` |
| Claude Code | `claude-code.md` |
| Aider / Codex / GitHub Copilot Workspace / Anthropic API direct / anything else | `generic.md` |

The variants are **additive** — `cursor.md` builds on `generic.md`, and
`claude-code.md` builds on `cursor.md`. You feed your agent just **one** file as
the initial system prompt; that file tells the agent to read its base layer(s)
before continuing.

## What this initiator does

1. Runs a **Kickoff Interview** to capture your team's stack, conventions, and
   architecture choices (sections 4 / 5 / 6 of `generic.md`).
2. Loads the **module foundation docs** (`../02-module-foundations/`),
   **Foundations chapter** (`../03-foundations-chapter.md`), and **per-feature
   SDDs** (`../04-sdd/`).
3. Drives the **build sequence** (8 features, scaffold → panel) with validation
   at each step.

See `generic.md` for the full operating principles, validation checklist, and
pacing.
INITIATOR_README

# --- 07: references -------------------------------------------------------------
cp "${ROOT}/docs/workshop/references/fixture-index.md" "${BUNDLE}/07-references/fixture-index.md"
cp "${ROOT}/docs/workshop/references/fixture-format.md" "${BUNDLE}/07-references/fixture-format.md"
cp "${ROOT}/.agent/rules/docs-modules.md"              "${BUNDLE}/07-references/canonical-rule.md"

RECORDINGS_SRC="${ROOT}/tests/fixtures/recordings"
if [[ -d "${RECORDINGS_SRC}" ]]; then
  cp -R "${RECORDINGS_SRC}/." "${BUNDLE}/07-references/recordings/"
else
  echo "  ! Recordings dir not found at ${RECORDINGS_SRC} — bundle ships without fixtures" >&2
fi

# --- Verification ---------------------------------------------------------------
echo
echo "Bundle assembled. Verification:"
TOTAL_FILES=$(find "${BUNDLE}" -type f | wc -l | tr -d ' ')
MODULE_COUNT=$(find "${BUNDLE}/02-module-foundations" -name "*.md" | wc -l | tr -d ' ')
SDD_COUNT=$(find "${BUNDLE}/04-sdd" -name "*.md" | wc -l | tr -d ' ')
RECORDING_COUNT=$(find "${BUNDLE}/07-references/recordings" -name "*.json" 2>/dev/null | wc -l | tr -d ' ')
TEMPLATE_CLAUDE_MD=$([[ -f "${BUNDLE}/06-initiator/templates/CLAUDE.md" ]] && echo "yes" || echo "MISSING")
TEMPLATE_SETTINGS=$([[ -f "${BUNDLE}/06-initiator/templates/.claude/settings.json" ]] && echo "yes" || echo "MISSING")

echo "  total files:           ${TOTAL_FILES}"
echo "  module foundations:    ${MODULE_COUNT}  (expected 12)"
echo "  SDDs:                  ${SDD_COUNT}  (expected 8)"
echo "  recordings:            ${RECORDING_COUNT}  (expected ≥ 90)"
echo "  CLAUDE.md template:    ${TEMPLATE_CLAUDE_MD}"
echo "  settings.json template:${TEMPLATE_SETTINGS}"
echo

[[ "${MODULE_COUNT}" == "12" ]] || { echo "FAIL: expected 12 module foundations, got ${MODULE_COUNT}" >&2; exit 1; }
[[ "${SDD_COUNT}" == "8" ]]     || { echo "FAIL: expected 8 SDDs, got ${SDD_COUNT}" >&2; exit 1; }
[[ "${TEMPLATE_CLAUDE_MD}" == "yes" ]] || { echo "FAIL: CLAUDE.md template missing" >&2; exit 1; }
[[ "${TEMPLATE_SETTINGS}" == "yes" ]]  || { echo "FAIL: settings.json template missing" >&2; exit 1; }

echo "Bundle ready at: ${BUNDLE}"
echo "Next: tar -czf $(basename "${BUNDLE}").tar.gz $(basename "${BUNDLE}")"
