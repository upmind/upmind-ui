#!/usr/bin/env bash
set -euo pipefail

RESULTS_DIR="tests/Playwright/e2e/reports/allure-results"
REPORT_DIR="tests/Playwright/e2e/reports/allure-report"
HISTORY_DIR="tests/Playwright/e2e/reports/.allure-history"

if [ ! -d "$RESULTS_DIR" ] || [ -z "$(ls -A "$RESULTS_DIR" 2>/dev/null)" ]; then
  echo "No results found at $RESULTS_DIR — run tests first." >&2
  exit 1
fi

mkdir -p "$HISTORY_DIR"

# Allure 3 doesn't have a --clean flag, so wipe the output folder ourselves.
# This avoids stale v2 / previous-run files lingering in the report.
rm -rf "$REPORT_DIR"

# --config is required — without it Allure 3 falls back to a v2-style report.
npx --no-install allure generate \
  --config ./allurerc.mjs \
  --output "$REPORT_DIR" \
  "$RESULTS_DIR"

# Results cleared BEFORE test runs (in package.json scripts), not here.
# Keeping results after generate allows re-generation without re-running.
