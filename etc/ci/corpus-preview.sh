#!/bin/sh
# Per-MR mintlify-docs preview branches (FE-3271, ADR-026 Amendment 2).
#
#   publish     commit the fresh generated partition to preview/mr-<iid> as the docs
#               bot, guarded by the lease SHA that gate-authorship --check-preview read.
#   merge       on a merged MR, merge preview/mr-<iid> into develop and delete it.
#   post-merge  merge, then the push-back refresh (always), then the canary.
#
# publish  --sub <dir> --remote <name|url> --iid <n> [--branch preview/mr-<n>]
#          --lease-sha <40-hex|none> --pages <dir> --source <text>
# merge    --sub <dir> --remote <name|url> --commit-message <text> [--target develop]
# post-merge  same flags as merge
#
# Env:
#   CORPUS_PUSH_DRY_RUN   "true" = no remote ref changes (push --dry-run only)
#   CORPUS_PUSH_BACK_CMD  post-merge refresh command (default: corpus-push-back.sh)
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PARTITION="developers/reference developers/changelog developers/corpus-version.json"
BOT_EMAIL="docs-bot@upmind.com"
BOT_NAME="Upmind Docs Bot"
COMMIT_SUBJECT="docs: refresh generated developer reference [skip ci]"
TRACK="refs/remotes/corpus-preview"
DRY_RUN="${CORPUS_PUSH_DRY_RUN:-false}"

log() { echo "[corpus-preview] $*"; }
die() {
  echo "[corpus-preview] ERROR: $*" >&2
  exit 1
}

sub_git() { git -C "${SUB}" "$@"; }
bot_git() {
  GIT_AUTHOR_NAME="${BOT_NAME}" GIT_AUTHOR_EMAIL="${BOT_EMAIL}" \
    GIT_COMMITTER_NAME="${BOT_NAME}" GIT_COMMITTER_EMAIL="${BOT_EMAIL}" \
    git -C "${SUB}" "$@"
}

in_partition() {
  case "$1" in
    developers/reference/* | developers/changelog/* | developers/corpus-version.json) return 0 ;;
    *) return 1 ;;
  esac
}

SUB=
REMOTE=origin
IID=
BRANCH=
LEASE_SHA=
PAGES=
SOURCE=
COMMIT_MESSAGE=
TARGET=develop

parse_args() {
  while [ $# -gt 0 ]; do
    [ $# -ge 2 ] || die "$1 requires a value"
    case "$1" in
      --sub) SUB=$2 ;;
      --remote) REMOTE=$2 ;;
      --iid) IID=$2 ;;
      --branch) BRANCH=$2 ;;
      --lease-sha) LEASE_SHA=$2 ;;
      --pages) PAGES=$2 ;;
      --source) SOURCE=$2 ;;
      --commit-message) COMMIT_MESSAGE=$2 ;;
      --target) TARGET=$2 ;;
      *) die "unknown flag $1" ;;
    esac
    shift 2
  done
  [ -n "${SUB}" ] || die "--sub is required"
}

is_preview_branch() { printf '%s\n' "$1" | grep -Eq '^preview/mr-[0-9]+$'; }

replace_partition() {
  for p in ${PARTITION}; do rm -rf "${SUB:?}/${p}"; done
  mkdir -p "${SUB}/developers"
  [ -d "${PAGES}/reference" ] && cp -R "${PAGES}/reference" "${SUB}/developers/reference"
  [ -d "${PAGES}/changelog" ] && cp -R "${PAGES}/changelog" "${SUB}/developers/changelog"
  [ -f "${PAGES}/corpus-version.json" ] && cp "${PAGES}/corpus-version.json" "${SUB}/developers/corpus-version.json"
  return 0
}

# --- publish ------------------------------------------------------------------
cmd_publish() {
  parse_args "$@"
  if [ -n "${BRANCH}" ] && ! is_preview_branch "${BRANCH}"; then
    die "refusing branch '${BRANCH}' — only preview/mr-<n> is allowed"
  fi
  [ -n "${PAGES}" ] && [ -d "${PAGES}" ] || die "--pages directory '${PAGES}' not found"

  if [ -z "${IID}" ]; then
    replace_partition
    log "no MR iid — artifact only, no push"
    return 0
  fi

  printf '%s\n' "${IID}" | grep -Eq '^[0-9]+$' || die "--iid '${IID}' is not a number"
  BRANCH="${BRANCH:-preview/mr-${IID}}"
  is_preview_branch "${BRANCH}" || die "refusing branch '${BRANCH}' — only preview/mr-<n> is allowed"

  case "${LEASE_SHA}" in
    none) ;;
    *)
      printf '%s\n' "${LEASE_SHA}" | grep -Eq '^[0-9a-f]{40}$' ||
        die "--lease-sha '${LEASE_SHA}' must be a full 40-character SHA or 'none'"
      ;;
  esac
  [ -e "${SUB}/.git" ] || die "${SUB} has no .git — cannot publish"

  if [ "${LEASE_SHA}" = "none" ]; then
    sub_git fetch --quiet "${REMOTE}" "+refs/heads/develop:${TRACK}/develop"
    sub_git checkout --quiet -B "${BRANCH}" "${TRACK}/develop"
  else
    sub_git fetch --quiet "${REMOTE}" "+refs/heads/${BRANCH}:${TRACK}/${BRANCH}"
    sub_git checkout --quiet -B "${BRANCH}" "${LEASE_SHA}"
  fi

  replace_partition

  # shellcheck disable=SC2086
  if [ -z "$(sub_git status --porcelain -- ${PARTITION})" ]; then
    log "no partition diff — nothing to commit"
    return 0
  fi
  for p in ${PARTITION}; do
    if [ -e "${SUB}/${p}" ] || sub_git ls-files --error-unmatch -- "${p}" >/dev/null 2>&1; then
      sub_git add -A -- "${p}"
    fi
  done
  bot_git commit --quiet --no-verify -m "${COMMIT_SUBJECT}" -m "Auto-emitted from ${SOURCE} (MR !${IID})."

  if [ "${DRY_RUN}" = "true" ]; then
    log "dry-run: push --dry-run -> ci-dry-run/preview-mr-${IID}"
    sub_git push --dry-run "${REMOTE}" "HEAD:refs/heads/ci-dry-run/preview-mr-${IID}"
    return 0
  fi

  expect="${LEASE_SHA}"
  [ "${expect}" = "none" ] && expect=
  log "pushing ${BRANCH} (lease ${LEASE_SHA})"
  sub_git push "--force-with-lease=refs/heads/${BRANCH}:${expect}" "${REMOTE}" "HEAD:refs/heads/${BRANCH}"
}

# --- merge --------------------------------------------------------------------
cmd_merge() {
  parse_args "$@"
  printf '%s\n' "${TARGET}" | grep -Eq '^develop$' || die "refusing target '${TARGET}' — only develop is allowed"

  iid=$(printf '%s\n' "${COMMIT_MESSAGE}" | sed -n 's/.*See merge request .*!\([0-9][0-9]*\).*/\1/p' | tail -n 1)
  if [ -z "${iid}" ]; then
    log "no MR iid in the merge commit — skip preview merge"
    return 0
  fi
  branch="preview/mr-${iid}"
  [ -e "${SUB}/.git" ] || die "${SUB} has no .git — cannot merge ${branch}"

  if sub_git ls-remote --exit-code --heads "${REMOTE}" "${branch}" >/dev/null; then
    rc=0
  else
    rc=$?
  fi
  if [ "${rc}" -eq 2 ]; then
    log "no preview branch for !${iid} — skip"
    return 0
  fi
  [ "${rc}" -eq 0 ] || die "ls-remote ${REMOTE} ${branch} failed (exit ${rc})"

  sub_git fetch --quiet "${REMOTE}" \
    "+refs/heads/${TARGET}:${TRACK}/${TARGET}" \
    "+refs/heads/${branch}:${TRACK}/${branch}"
  sub_git checkout --quiet -B "${TARGET}" "${TRACK}/${TARGET}"

  if ! bot_git merge --no-ff --no-edit -m "docs: merge ${branch} [skip ci]" "${TRACK}/${branch}"; then
    conflicts=$(sub_git diff --name-only --diff-filter=U)
    outside=
    for f in ${conflicts}; do
      in_partition "${f}" || outside="${outside} ${f}"
    done
    if [ -z "${conflicts}" ] || [ -n "${outside}" ]; then
      sub_git merge --abort || true
      for f in ${outside}; do echo "[corpus-preview] conflict outside the generated partition: ${f}" >&2; done
      die "merge of ${branch} into ${TARGET} needs a human — ${branch} kept, ${TARGET} not pushed"
    fi
    log "partition-only conflict — taking the ${branch} tree for the partition"
    # shellcheck disable=SC2086
    sub_git rm -r -f -q --ignore-unmatch -- ${PARTITION}
    for p in ${PARTITION}; do
      if sub_git cat-file -e "${TRACK}/${branch}:${p}" 2>/dev/null; then
        sub_git checkout "${TRACK}/${branch}" -- "${p}"
      fi
    done
    bot_git commit --quiet --no-verify --no-edit
  fi

  if [ "${DRY_RUN}" = "true" ]; then
    log "dry-run: push --dry-run ${TARGET}; ${branch} kept"
    sub_git push --dry-run "${REMOTE}" "HEAD:refs/heads/${TARGET}"
    return 0
  fi

  sub_git push "${REMOTE}" "HEAD:refs/heads/${TARGET}" || die "push of ${TARGET} rejected — ${branch} kept"
  sub_git push "${REMOTE}" --delete "${branch}"
  log "merged ${branch} into ${TARGET} and deleted it"
}

# --- post-merge ---------------------------------------------------------------
cmd_post_merge() {
  status=0

  set +e
  (
    set -e
    cmd_merge "$@"
  )
  rc=$?
  [ "${status}" -eq 0 ] && status=${rc}

  if [ -n "${CORPUS_PUSH_BACK_CMD:-}" ]; then
    sh -c "${CORPUS_PUSH_BACK_CMD}"
  else
    sh "${SCRIPT_DIR}/corpus-push-back.sh"
  fi
  rc=$?
  [ "${status}" -eq 0 ] && status=${rc}

  sh "${SCRIPT_DIR}/corpus-canary.sh"
  rc=$?
  [ "${status}" -eq 0 ] && status=${rc}
  set -e

  return "${status}"
}

[ $# -ge 1 ] || die "usage: corpus-preview.sh publish|merge|post-merge [flags]"
cmd=$1
shift
case "${cmd}" in
  publish) cmd_publish "$@" ;;
  merge) cmd_merge "$@" ;;
  post-merge) cmd_post_merge "$@" ;;
  *) die "unknown command ${cmd}" ;;
esac
