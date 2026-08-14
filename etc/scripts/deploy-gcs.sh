#!/usr/bin/env bash
# deploy-gcs.sh — Upload built app assets to a GCS bucket.
#
# Usage:
#   bash etc/scripts/deploy-gcs.sh --bucket upmind-cart --prefix production [--dist dist] [--dry-run] [--show-progress] [--skip-verify]
#
# Environment variables (all optional, pulled from CI automatically):
#   GOOGLE_APPLICATION_CREDENTIALS  Path to GCP service account JSON
#   CI_COMMIT_SHORT_SHA             Short git commit SHA (falls back to git)
#   CI_COMMIT_TAG                   Git tag (falls back to "local")
#   CI_PIPELINE_ID                  Pipeline ID (falls back to "local")
#
# The script uses `gcloud storage cp` (GA) rather than the legacy `gsutil`.
# If `gcloud` is not installed it falls back to `gsutil`.

set -euo pipefail

# Defaults
BUCKET=""
PREFIX=""
DIST_DIR="dist"
DRY_RUN=false
SHOW_PROGRESS=false
SKIP_VERIFY=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --bucket)         BUCKET="$2";        shift 2 ;;
    --prefix)         PREFIX="$2";        shift 2 ;;
    --dist)           DIST_DIR="$2";      shift 2 ;;
    --show-progress)  SHOW_PROGRESS=true; shift   ;;
    --dry-run)        DRY_RUN=true;       shift   ;;
    --skip-verify)    SKIP_VERIFY=true;   shift   ;;
    *)                echo "Unknown argument: $1" >&2; exit 1 ;;
  esac
done

if [[ -z "${BUCKET}" ]]; then
  echo "ERROR: --bucket is required" >&2
  exit 1
fi

# Metadata
COMMIT_SHA="${CI_COMMIT_SHORT_SHA:-$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")}"
DEPLOY_TAG="${CI_COMMIT_TAG:-local}"
PIPELINE_ID="${CI_PIPELINE_ID:-local}"
DEPLOY_DATE="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

if [[ -n "${PREFIX}" ]]; then
  GCS_URL="gs://${BUCKET}/${PREFIX}"
else
  GCS_URL="gs://${BUCKET}"
fi

cat <<EOF
GCS Asset Deploy

Bucket    ${BUCKET}
Prefix    ${PREFIX:-/}
Source    ${DIST_DIR}/
Commit    ${COMMIT_SHA}
Tag       ${DEPLOY_TAG}
Pipeline  ${PIPELINE_ID}
Date      ${DEPLOY_DATE}
Dry run   ${DRY_RUN}

EOF

if [[ -n "${GOOGLE_APPLICATION_CREDENTIALS:-}" ]]; then
  echo "🔑 Authenticating with service account credentials."
  gcloud auth activate-service-account --key-file="${GOOGLE_APPLICATION_CREDENTIALS}" --quiet
fi

if command -v gcloud &>/dev/null; then
  UPLOAD_TOOL="gcloud"
elif command -v gsutil &>/dev/null; then
  UPLOAD_TOOL="gsutil"
else
  echo "ERROR: Neither 'gcloud' nor 'gsutil' is installed." >&2
  exit 1
fi

echo "ℹ️  Using upload tool: ${UPLOAD_TOOL}"

# Exclude index/HTML files - those go to Firebase only

if [[ "${DRY_RUN}" == "true" ]]; then
  count=$(find "${DIST_DIR}" -type f ! -name "*.html" ! -name "firebase.json" | wc -l | tr -d ' ')
  if [[ "${SHOW_PROGRESS}" == "true" ]]; then
    echo ""
    echo "[DRY RUN] ${count} files that would be uploaded from ${DIST_DIR}/ to ${GCS_URL}:"
    find "${DIST_DIR}" -type f \
      ! -name "*.html" \
      ! -name "firebase.json" \
      | sed "s|^${DIST_DIR}/||" \
      | sort
  else
    echo ""
    echo "[DRY RUN] ${count} files would be uploaded from ${DIST_DIR}/ to ${GCS_URL}."
    echo "  Use --show-progress to list all files."
  fi
  echo ""
  echo "[DRY RUN] Complete. No files uploaded."
  exit 0
fi

# Upload assets
#
# Strategy: stage files into two temp dirs based on file extension so we can
# batch-upload each group with the correct Cache-Control headers.
#
# Uses `gcloud storage cp` (not rsync) for reliable batch uploads with
# built-in checksum verification. Skips existing files (--no-clobber).
#
# Cache-Control headers:
#   - Cacheable assets (JS/CSS/fonts/images): immutable, 1 year
#   - Everything else (e.g. manifest.json, favicons): 1 day

echo "⬆️  Uploading assets to ${GCS_URL}/..."

CUSTOM_META="deploy-tag=${DEPLOY_TAG},commit-sha=${COMMIT_SHA},pipeline-id=${PIPELINE_ID},deploy-date=${DEPLOY_DATE}"

# Stage files into two separate temp dirs based on cache policy
STAGE_IMMUTABLE=$(mktemp -d)
STAGE_OTHER=$(mktemp -d)
trap "rm -rf ${STAGE_IMMUTABLE} ${STAGE_OTHER}" EXIT

file_count=0
while IFS= read -r file; do
  rel="${file#${DIST_DIR}/}"
  target_dir="${STAGE_OTHER}"

  if echo "${rel}" | grep -qE '\.(js|css|woff2?|ttf|eot|png|jpg|jpeg|gif|webp|svg|ico|map)$'; then
    target_dir="${STAGE_IMMUTABLE}"
  fi

  # Preserve directory structure
  mkdir -p "${target_dir}/$(dirname "${rel}")"
  ln "${file}" "${target_dir}/${rel}" 2>/dev/null || cp "${file}" "${target_dir}/${rel}"
  file_count=$((file_count + 1))
done < <(find "${DIST_DIR}" -type f ! -name "*.html" ! -name "firebase.json")

echo "  ⏳ Staged ${file_count} files for upload."

immutable_count=$(find "${STAGE_IMMUTABLE}" -type f | wc -l | tr -d ' ')
other_count=$(find "${STAGE_OTHER}" -type f | wc -l | tr -d ' ')

# Upload immutable assets
if [[ "${immutable_count}" -gt 0 ]]; then
  echo "  🚀 Uploading ${immutable_count} immutable assets (1-year cache)..."
  if [[ "${UPLOAD_TOOL}" == "gcloud" ]]; then
    gcloud storage cp -r \
      --cache-control="public, max-age=31536000, immutable" \
      --custom-metadata="${CUSTOM_META}" \
      --no-clobber \
      "${STAGE_IMMUTABLE}/"* "${GCS_URL}/"
  else
    gsutil -m cp -r -n \
      -h "Cache-Control:public, max-age=31536000, immutable" \
      -h "x-goog-meta-deploy-tag:${DEPLOY_TAG}" \
      -h "x-goog-meta-commit-sha:${COMMIT_SHA}" \
      -h "x-goog-meta-pipeline-id:${PIPELINE_ID}" \
      -h "x-goog-meta-deploy-date:${DEPLOY_DATE}" \
      "${STAGE_IMMUTABLE}/"* "${GCS_URL}/"
  fi
  echo "  ✅ ${immutable_count} immutable assets done."
fi

# Upload non-immutable assets (manifests, favicons, etc.)
if [[ "${other_count}" -gt 0 ]]; then
  echo "  🚀 Uploading ${other_count} other assets (1-day cache)..."
  if [[ "${UPLOAD_TOOL}" == "gcloud" ]]; then
    gcloud storage cp -r \
      --cache-control="public, max-age=86400" \
      --custom-metadata="${CUSTOM_META}" \
      --no-clobber \
      "${STAGE_OTHER}/"* "${GCS_URL}/"
  else
    gsutil -m cp -r -n \
      -h "Cache-Control:public, max-age=86400" \
      -h "x-goog-meta-deploy-tag:${DEPLOY_TAG}" \
      -h "x-goog-meta-commit-sha:${COMMIT_SHA}" \
      -h "x-goog-meta-pipeline-id:${PIPELINE_ID}" \
      -h "x-goog-meta-deploy-date:${DEPLOY_DATE}" \
      "${STAGE_OTHER}/"* "${GCS_URL}/"
  fi
  echo "  ✅ ${other_count} other assets done."
fi

# Verify upload
if [[ "${SKIP_VERIFY}" != "true" ]]; then
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  VERIFY_ARGS=(--bucket "${BUCKET}" --dist "${DIST_DIR}")
  if [[ -n "${PREFIX}" ]]; then
    VERIFY_ARGS+=(--prefix "${PREFIX}")
  fi
  bash "${SCRIPT_DIR}/verify-gcs.sh" "${VERIFY_ARGS[@]}"
fi

cat <<EOF

✅ GCS upload complete — ${GCS_URL}/

Deploy tag  ${DEPLOY_TAG}
Commit SHA  ${COMMIT_SHA}
Pipeline    ${PIPELINE_ID}
EOF
