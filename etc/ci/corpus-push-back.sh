#!/bin/sh
# Regenerate the docs corpus and push any drift back to both repos.
#
# Portable: the same logic runs in GitLab CI and locally. The CI-only prep
# (installing packages, writing the deploy-key SSH config, re-cloning the submodule
# for its .git) stays in .gitlab-ci/docs-corpus.yml. This script is the part worth
# running by hand.
#
# Env:
#   CORPUS_DEFAULT_BRANCH   target branch (default: ${CI_DEFAULT_BRANCH:-develop})
#   CORPUS_SUPER_PUSH_URL   push URL for THIS repo (default: origin). CI sets the
#                           token URL. Locally, leave it unset to push as yourself.
#   CORPUS_PUSH_DRY_RUN     "true" = commit + `git push --dry-run` to a throwaway
#                           branch (proves auth), then roll the commits back. No writes.
#   CORPUS_DRY_RUN_BRANCH   dry-run push target (default: ci-dry-run/corpus-refresh).
#                           Never the real branch, so a dry-run cannot touch develop.
#
# Local dry-run (needs the submodule checked out: git submodule update --init
# docs/published-docs):
#   CORPUS_PUSH_DRY_RUN=true ./etc/ci/corpus-push-back.sh
set -eu

DEFAULT_BRANCH="${CORPUS_DEFAULT_BRANCH:-${CI_DEFAULT_BRANCH:-develop}}"
DRY_RUN="${CORPUS_PUSH_DRY_RUN:-false}"
SUPER_PUSH_URL="${CORPUS_SUPER_PUSH_URL:-origin}"
SHORT_SHA="${CI_COMMIT_SHORT_SHA:-$(git rev-parse --short HEAD)}"
PROJECT_PATH="${CI_PROJECT_PATH:-$(basename "$(git rev-parse --show-toplevel)")}"
SUB=docs/published-docs

log() { echo "[corpus-push-back] $*"; }

# In a dry-run, push --dry-run to a throwaway branch: it proves auth and connectivity
# without touching the real branch or its force-with-lease. A real run pushes to
# DEFAULT_BRANCH, with force-with-lease guarding the submodule's fenced path.
DRY_RUN_BRANCH="${CORPUS_DRY_RUN_BRANCH:-ci-dry-run/corpus-refresh}"
if [ "${DRY_RUN}" = "true" ]; then
  push_opts=--dry-run
  target_branch="${DRY_RUN_BRANCH}"
  sub_lease=
else
  push_opts=
  target_branch="${DEFAULT_BRANCH}"
  sub_lease="--force-with-lease=${DEFAULT_BRANCH}:origin/${DEFAULT_BRANCH}"
fi

# Put the submodule on the target branch first, so emit writes onto it and the push has
# a branch to send. Locally it is a normal checkout. In CI the job re-clones it for its
# .git, then calls this.
log "positioning ${SUB} on ${DEFAULT_BRANCH}..."
git -C "${SUB}" fetch --quiet origin "${DEFAULT_BRANCH}"
git -C "${SUB}" checkout -B "${DEFAULT_BRANCH}" "origin/${DEFAULT_BRANCH}"

# 1. Regenerate the corpus (build) and the emitted MDX (emit).
log "regenerating corpus (build + emit)..."
pnpm --filter docs corpus:refresh

# 2. Detect drift. corpus.json is in this repo, and the emitted tree is in the submodule,
#    so each needs its own repo-scoped status. --porcelain also catches added and
#    removed pages. .reflection.json is gitignored.
super_changed=$(git status --porcelain -- docs/corpus/corpus.json)
sub_changed=$(git -C "${SUB}" status --porcelain -- developers)

if [ -z "${super_changed}" ] && [ -z "${sub_changed}" ]; then
  log "no drift. Committed corpus matches a fresh refresh."
  exit 0
fi

# 3. Submodule first: commit only our fenced path, push with force-with-lease
#    (CI is the sole writer to developers/**).
sub_before=
if [ -n "${sub_changed}" ]; then
  sub_before=$(git -C "${SUB}" rev-parse HEAD)
  git -C "${SUB}" add developers
  git -C "${SUB}" commit --no-verify \
    -m "docs: refresh generated developer reference [skip ci]" \
    -m "Auto-emitted from ${PROJECT_PATH}@${SHORT_SHA}."
  log "pushing emitted MDX -> ${SUB} ${target_branch} ${push_opts}"
  # shellcheck disable=SC2086
  git -C "${SUB}" push ${push_opts} ${sub_lease} origin "HEAD:${target_branch}"
fi

# 4. Superproject: stage corpus.json and the moved submodule pointer, push to this
#    repo's default branch with -o ci.skip. Plain push, no force, so a concurrent
#    push to the shared branch fails loudly instead of clobbering.
super_before=
super_before=$(git rev-parse HEAD)
git add docs/corpus/corpus.json "${SUB}"
git commit --no-verify \
  -m "docs: refresh corpus [skip ci]" \
  -m "Auto-regenerated from source on ${DEFAULT_BRANCH}."
log "pushing corpus.json + submodule pointer -> ${SUPER_PUSH_URL} ${target_branch} ${push_opts}"
# Push the submodule separately, so don't let the superproject push recurse into it.
# shellcheck disable=SC2086
git push ${push_opts} --recurse-submodules=no -o ci.skip "${SUPER_PUSH_URL}" "HEAD:${target_branch}"

# 5. Dry-run: undo the local commits so nothing is left behind. The regenerated files
#    stay staged in the working tree. Discard them with `git restore` if you don't want them.
if [ "${DRY_RUN}" = "true" ]; then
  git reset --soft "${super_before}"
  [ -n "${sub_before}" ] && git -C "${SUB}" reset --soft "${sub_before}"
  log "dry-run: rolled the local commits back. Pushes were --dry-run only."
fi

log "done."
