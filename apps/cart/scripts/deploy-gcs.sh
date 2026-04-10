#!/usr/bin/env bash
# deploy-gcs.sh — Upload built cart assets to a GCS bucket.
#
# Usage:
#   bash scripts/deploy-gcs.sh --bucket upmind-cart [--dist dist] [--dry-run] [--show-progress]
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
DIST_DIR="dist"
DRY_RUN=false
SHOW_PROGRESS=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --bucket)         BUCKET="$2";        shift 2 ;;
    --dist)           DIST_DIR="$2";      shift 2 ;;
    --show-progress)  SHOW_PROGRESS=true; shift   ;;
    --dry-run)        DRY_RUN=true;       shift   ;;
    *)                echo "Unknown argument: $1" >&2; exit 1 ;;
  esac
done

if [[ -z "$BUCKET" ]]; then
  echo "ERROR: --bucket is required" >&2
  exit 1
fi

# Metadata
COMMIT_SHA="${CI_COMMIT_SHORT_SHA:-$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")}"
DEPLOY_TAG="${CI_COMMIT_TAG:-local}"
PIPELINE_ID="${CI_PIPELINE_ID:-local}"
DEPLOY_DATE="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

GCS_URL="gs://${BUCKET}"

cat <<EOF
GCS Asset Deploy

Bucket    ${BUCKET}
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

if [[ "$DRY_RUN" == "true" ]]; then
  count=$(find "${DIST_DIR}" -type f ! -name "*.html" ! -name "firebase.json" | wc -l | tr -d ' ')
  if [[ "$SHOW_PROGRESS" == "true" ]]; then
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
# Strategy: stage files into two temp dirs (hashed vs non-hashed) so we can
# batch-upload each group with the correct Cache-Control in a single parallel
# operation using `gcloud storage rsync` or `gsutil rsync -m`.
#
# Cache-Control headers:
#   - Hashed assets (JS/CSS/fonts/images): immutable, 1 year
#   - Everything else (e.g. manifest, favicons): 1 day

echo "⬆️  Uploading cacheable assets (JS, CSS, fonts, images)..."

CUSTOM_META="deploy-tag=${DEPLOY_TAG},commit-sha=${COMMIT_SHA},pipeline-id=${PIPELINE_ID},deploy-date=${DEPLOY_DATE}"

# Stage files into two separate temp dirs based on cache policy
STAGE_IMMUTABLE=$(mktemp -d)
STAGE_OTHER=$(mktemp -d)
trap "rm -rf ${STAGE_IMMUTABLE} ${STAGE_OTHER}" EXIT

file_count=0
while IFS= read -r file; do
  rel="${file#${DIST_DIR}/}"
  target_dir="${STAGE_OTHER}"

  if echo "$rel" | grep -qE '\.[a-f0-9]{8,}\.(js|css|woff2?|ttf|eot|png|jpg|jpeg|gif|webp|svg|ico|map)$'; then
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

# Build verbosity args based on --show-progress flag
GCLOUD_VERBOSITY=()
GSUTIL_QUIET=()
if [[ "$SHOW_PROGRESS" == "true" ]]; then
  GCLOUD_VERBOSITY=(--verbosity=info)
else
  GCLOUD_VERBOSITY=(--verbosity=warning)
  GSUTIL_QUIET=(-q)
fi

# Upload hashed/immutable assets
if [[ "$immutable_count" -gt 0 ]]; then
  echo "  🚀 Uploading ${immutable_count} hashed assets (immutable cache)..."
  if [[ "$UPLOAD_TOOL" == "gcloud" ]]; then
    gcloud storage rsync -r \
      "${GCLOUD_VERBOSITY[@]}" \
      --cache-control="public, max-age=31536000, immutable" \
      --custom-metadata="${CUSTOM_META}" \
      --no-clobber \
      "${STAGE_IMMUTABLE}/" "${GCS_URL}/"
  else
    gsutil -m rsync -r -n \
      -h "Cache-Control:public, max-age=31536000, immutable" \
      -h "x-goog-meta-deploy-tag:${DEPLOY_TAG}" \
      -h "x-goog-meta-commit-sha:${COMMIT_SHA}" \
      -h "x-goog-meta-pipeline-id:${PIPELINE_ID}" \
      -h "x-goog-meta-deploy-date:${DEPLOY_DATE}" \
      "${STAGE_IMMUTABLE}/" "${GCS_URL}/"
  fi
  echo "  ✅ ${immutable_count} hashed assets done."
fi

# Upload non-hashed assets (manifests, favicons, etc.)
if [[ "$other_count" -gt 0 ]]; then
  echo "  🚀 Uploading ${other_count} other assets (1-day cache)..."
  if [[ "$UPLOAD_TOOL" == "gcloud" ]]; then
    gcloud storage rsync -r \
      "${GCLOUD_VERBOSITY[@]}" \
      --cache-control="public, max-age=86400" \
      --custom-metadata="${CUSTOM_META}" \
      --no-clobber \
      "${STAGE_OTHER}/" "${GCS_URL}/"
  else
    gsutil -m rsync -r -n \
      -h "Cache-Control:public, max-age=86400" \
      -h "x-goog-meta-deploy-tag:${DEPLOY_TAG}" \
      -h "x-goog-meta-commit-sha:${COMMIT_SHA}" \
      -h "x-goog-meta-pipeline-id:${PIPELINE_ID}" \
      -h "x-goog-meta-deploy-date:${DEPLOY_DATE}" \
      "${STAGE_OTHER}/" "${GCS_URL}/"
  fi
  echo "  ✅ ${other_count} other assets done."
fi

cat <<EOF
✅ GCS upload complete - ${GCS_URL}/"

Deploy tag  ${DEPLOY_TAG}
Commit SHA  ${COMMIT_SHA}
Pipeline    ${PIPELINE_ID}
EOF
