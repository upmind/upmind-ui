#!/usr/bin/env bash
set -euo pipefail

BUCKET="${ALLURE_GCS_BUCKET:-REPLACE_ME_BUCKET_NAME}"
PREFIX="${ALLURE_GCS_PREFIX:-allure}"

if [ "$BUCKET" = "REPLACE_ME_BUCKET_NAME" ]; then
  echo "ALLURE_GCS_BUCKET is not set." >&2
  echo "Add to your shell profile (e.g. ~/.zshrc):" >&2
  echo "  export ALLURE_GCS_BUCKET=<bucket-name>" >&2
  exit 1
fi

if ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud CLI not found." >&2
  echo "Install: brew install --cask google-cloud-sdk" >&2
  echo "Docs:    https://cloud.google.com/sdk/docs/install" >&2
  exit 1
fi

if [ -z "${GOOGLE_APPLICATION_CREDENTIALS:-}" ]; then
  echo "GOOGLE_APPLICATION_CREDENTIALS is not set." >&2
  echo "Export it pointing at your service-account key, e.g.:" >&2
  echo '  export GOOGLE_APPLICATION_CREDENTIALS="$(git rev-parse --show-toplevel)/tests/Playwright/e2e/support/secrets/google.json"' >&2
  exit 1
fi

if [ ! -f "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
  echo "Service-account key file not found: $GOOGLE_APPLICATION_CREDENTIALS" >&2
  exit 1
fi

# Activate the service account so gcloud storage commands authenticate.
gcloud auth activate-service-account \
  --key-file="$GOOGLE_APPLICATION_CREDENTIALS" --quiet >/dev/null

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

BRANCH_RAW="$(git rev-parse --abbrev-ref HEAD)"
BRANCH="$(echo "$BRANCH_RAW" | tr '/' '-' | tr '[:upper:]' '[:lower:]')"
USER_NAME="${USER:-unknown}"
TIMESTAMP="$(date -u +%Y-%m-%dT%H-%M-%SZ)"

RESULTS_DIR="tests/Playwright/e2e/reports/allure-results"
REPORT_DIR="tests/Playwright/e2e/reports/allure-report"

if [ ! -d "$REPORT_DIR" ] || [ -z "$(ls -A "$REPORT_DIR" 2>/dev/null)" ]; then
  echo "No report found at $REPORT_DIR." >&2
  echo "Run tests first:  pnpm test:chrome" >&2
  exit 1
fi

GCS_TARGET="gs://${BUCKET}/${PREFIX}/local/${BRANCH}/${USER_NAME}/${TIMESTAMP}"

echo "Packaging allure-results for future portability…"
TAR_PATH="$(mktemp -t allure-results.XXXXXX).tar.gz"
tar -czf "$TAR_PATH" -C "$RESULTS_DIR" .

echo "Uploading report to ${GCS_TARGET}/report/"
gcloud storage rsync "$REPORT_DIR" "${GCS_TARGET}/report" \
  --recursive --quiet

echo "Uploading raw results archive…"
gcloud storage cp "$TAR_PATH" "${GCS_TARGET}/results.tar.gz" --quiet
rm -f "$TAR_PATH"

echo "Refreshing landing index…"
node tests/allure/allure-index.mjs

echo ""
echo "Done:"
echo "  Report: https://storage.googleapis.com/${BUCKET}/${PREFIX}/local/${BRANCH}/${USER_NAME}/${TIMESTAMP}/report/index.html"
echo "  Index:  https://storage.googleapis.com/${BUCKET}/index.html"
