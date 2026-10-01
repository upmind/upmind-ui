#!/usr/bin/env bash
#
# Single entry point for the Playwright e2e suite.
#
#   1. Frees the test port and the payment app's preview port.
#   2. Starts the test-mode cart server (vite --mode test) on that port.
#   3. Waits until it is actually serving.
#   4. Runs the suite for the requested browser.
#   5. Always shuts the server down and frees both ports on exit.
#
# Usage: run-e2e.sh [chrome|firefox|safari|all] [extra playwright args...]
#        (default browser: chrome)
#   e.g. run-e2e.sh chrome checkout/billing-details/standalone-billing.spec.ts
#        run-e2e.sh chrome --grep "@free-trials"
#
set -euo pipefail

BROWSER="${1:-chrome}"
TEST_PORT=4000
BASE_URL="http://qa-automation.local:${TEST_PORT}/"
ROOT="$(git -C "$(dirname "${BASH_SOURCE[0]}")" rev-parse --show-toplevel)"

# Free the payment preview port too: Playwright silently reuses a stale server.
PAYMENT_PREVIEW_PORT=4020
PORTS=("${TEST_PORT}" "${PAYMENT_PREVIEW_PORT}")

free_port() {
  local port="$1"
  local pids
  pids="$(lsof -ti "tcp:${port}" || true)"
  if [ -n "${pids}" ]; then
    echo "  killing ${port}: ${pids//$'\n'/ }"
    kill -9 ${pids} 2>/dev/null || true
    sleep 1
  fi
}

# Opt-in video capture. Playwright has no native --video flag, so intercept it
# here, set PW_VIDEO (read by playwright.config.ts), and strip it from the args
# forwarded to Playwright (which would otherwise reject the unknown option).
ARGS=()
for arg in "${@:2}"; do
  if [ "${arg}" = "--video" ]; then
    export PW_VIDEO=1
  else
    ARGS+=("${arg}")
  fi
done

# 1. Free every port the suite serves on, so we never reuse a stale/wrong build.
echo "▶ freeing ports ${PORTS[*]} ..."
for port in "${PORTS[@]}"; do
  free_port "${port}"
done

# 2. Start the test-mode cart server on the correct port. (Invoke vite
#    directly — `pnpm start:test -- --port` leaks a stray `--` that vite
#    ignores, booting on the 5173 default.)
echo "▶ starting test server (vite --mode test) on ${TEST_PORT} ..."
( cd "${ROOT}/apps/cart" && exec pnpm exec vite --mode test --port "${TEST_PORT}" --strictPort ) &
SERVER_PID=$!

cleanup() {
  echo "▶ shutting down test server and payment preview ..."
  kill -9 "${SERVER_PID}" 2>/dev/null || true
  for port in "${PORTS[@]}"; do
    free_port "${port}"
  done
}
trap cleanup EXIT

# 3. Wait until it is actually serving (cold vite can take a while).
echo "▶ waiting for ${BASE_URL} ..."
for i in $(seq 1 120); do
  if curl -sf -o /dev/null "${BASE_URL}"; then
    echo "  ✓ server ready after ${i}s"
    break
  fi
  if [ "${i}" -eq 120 ]; then
    echo "✗ test server did not come up on ${TEST_PORT} within 120s" >&2
    exit 1
  fi
  sleep 1
done

# 4. Run the suite. The server is already up, so Playwright reuses it.
echo "▶ running e2e suite (browser: ${BROWSER}) ..."
rm -rf "${ROOT}/tests/Playwright/e2e/reports/allure-results/"* 2>/dev/null || true
cd "${ROOT}"
# Playwright ORs multiple path filters, so the default /e2e-tests filter must
# be dropped when the caller passes their own path (otherwise the whole suite
# runs). Flag-only extras (e.g. --grep, --video) keep the default.
DEFAULT_FILTER="/e2e-tests"
for arg in ${ARGS[@]+"${ARGS[@]}"}; do
  [ "${arg#-}" = "${arg}" ] && DEFAULT_FILTER="" && break
done
case "${BROWSER}" in
  all|all-browsers) pnpm playwright test ${DEFAULT_FILTER} ${ARGS[@]+"${ARGS[@]}"} ;;
  *)                pnpm playwright test ${DEFAULT_FILTER} --project="${BROWSER}" ${ARGS[@]+"${ARGS[@]}"} ;;
esac
