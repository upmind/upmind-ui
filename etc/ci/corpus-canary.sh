#!/bin/sh
# Freshness canary: check the live site's corpus_version against the build.
#
# Skips when MINTLIFY_LLMS_URL is unset, so it stays dormant until the live site
# exists. Run locally against any URL to test the parse.
#
# Env:
#   MINTLIFY_LLMS_URL          live llms.txt URL. Unset = skip.
#   CORPUS_VERSION_FILE        built version file (default: the emitted one)
#   DOCS_CANARY_SLACK_WEBHOOK  optional; posts an alert on a mismatch
set -eu

LLMS_URL="${MINTLIFY_LLMS_URL:-}"
if [ -z "${LLMS_URL}" ]; then
  echo "[canary] MINTLIFY_LLMS_URL unset; skipping freshness check."
  exit 0
fi

version_file="${CORPUS_VERSION_FILE:-docs/published-docs/developers/corpus-version.json}"
built=$(jq -r '.corpus_version' "${version_file}")
# NOTE: placeholder parse. Confirm it against the real llms.txt format once the URL exists.
live=$(curl -fsSL "${LLMS_URL}" | grep -oiE 'corpus_version[":= ]+[0-9A-Za-z._-]+' | grep -oE '[0-9A-Za-z._-]+$' | head -1 || true)
echo "[canary] built=${built} live=${live}"

if [ "${built}" != "${live}" ]; then
  echo "[canary] live corpus_version (${live}) lags the build (${built})."
  if [ -n "${DOCS_CANARY_SLACK_WEBHOOK:-}" ]; then
    curl -sf -X POST -H 'Content-type: application/json' \
      --data "{\"text\":\"Docs freshness canary: live corpus_version ${live} lags build ${built} (${CI_PIPELINE_URL:-local}).\"}" \
      "${DOCS_CANARY_SLACK_WEBHOOK}" || echo "[canary] Slack post failed (non-fatal)."
  fi
  exit 1
fi
echo "[canary] live corpus_version matches the build."
