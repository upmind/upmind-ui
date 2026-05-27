#!/usr/bin/env bash
# verify-gcs.sh — Compare local dist files against a GCS bucket to find missing uploads.
#
# Usage:
#   bash scripts/verify-gcs.sh --bucket upmind-cart [--prefix production] [--dist dist]
#
# Examples:
#   # Check production bucket against local build
#   bash scripts/verify-gcs.sh --bucket upmind-cart --prefix production
#
#   # Check staging
#   bash scripts/verify-gcs.sh --bucket upmind-cart-staging --prefix staging
#
#   # Check with a custom dist directory
#   bash scripts/verify-gcs.sh --bucket upmind-cart --prefix production --dist /path/to/dist

set -euo pipefail

BUCKET=""
PREFIX=""
DIST_DIR="dist"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --bucket)  BUCKET="$2";   shift 2 ;;
    --prefix)  PREFIX="$2";   shift 2 ;;
    --dist)    DIST_DIR="$2"; shift 2 ;;
    *)         echo "Unknown argument: $1" >&2; exit 1 ;;
  esac
done

if [[ -z "${BUCKET}" ]]; then
  echo "ERROR: --bucket is required" >&2
  exit 1
fi

if [[ ! -d "${DIST_DIR}" ]]; then
  echo "ERROR: dist directory '${DIST_DIR}' does not exist" >&2
  exit 1
fi

if [[ -n "${PREFIX}" ]]; then
  GCS_URL="gs://${BUCKET}/${PREFIX}"
else
  GCS_URL="gs://${BUCKET}"
fi

LOCAL_FILES=$(mktemp)
REMOTE_FILES=$(mktemp)
trap "rm -f ${LOCAL_FILES} ${REMOTE_FILES}" EXIT

echo "🔍 Verifying GCS bucket against local dist..."
echo ""
echo "  Local     ${DIST_DIR}/"
echo "  Remote    ${GCS_URL}/"
echo ""

# Build local file list (excluding HTML and firebase.json, same as deploy-gcs.sh)
find "${DIST_DIR}" -type f \
  ! -name "*.html" \
  ! -name "firebase.json" \
  | sed "s|^${DIST_DIR}/||" \
  | sort > "${LOCAL_FILES}"

LOCAL_COUNT=$(wc -l < "${LOCAL_FILES}" | tr -d ' ')
echo "  📁 ${LOCAL_COUNT} local files"

# List remote files
gcloud storage ls -r "${GCS_URL}/**" | sed "s|^${GCS_URL}/||" | sort > "${REMOTE_FILES}"

REMOTE_COUNT=$(wc -l < "${REMOTE_FILES}" | tr -d ' ')
echo "  ☁️  ${REMOTE_COUNT} remote files"
echo ""

# comm -23: lines in LOCAL_FILES not in REMOTE_FILES (missing from GCS)
MISSING=$(comm -23 "${LOCAL_FILES}" "${REMOTE_FILES}")

if [[ -n "${MISSING}" ]]; then
  MISSING_COUNT=$(echo "${MISSING}" | wc -l | tr -d ' ')
  echo "❌ ${MISSING_COUNT} files missing from GCS:"
  echo ""
  echo "${MISSING}"
  echo ""
  exit 1
else
  echo "✅ All ${LOCAL_COUNT} local files exist in GCS."
fi
