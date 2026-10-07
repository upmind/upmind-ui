#!/bin/sh
# CI-only git and SSH setup for jobs that read or write the mintlify-docs submodule
# (FE-3271 B0). Installs git, sets the docs-bot identity and the deploy-key SSH
# route, then re-clones the submodule: the dependencies artifact carries its files
# but not its .git.
#
# Env:
#   CI_PROJECT_DIR                          project checkout (GitLab sets it)
#   UPMIND_MINTLIFY_DOCS_DEPLOY_PRIVATE_KEY deploy key for github.com/upmind/mintlify-docs
set -eu

SUB=docs/published-docs

apt-get update && apt-get install -y --no-install-recommends git openssh-client curl jq

git config --global --add safe.directory "${CI_PROJECT_DIR}"
git config --global --add safe.directory "${CI_PROJECT_DIR}/${SUB}"
git config --global user.email "docs-bot@upmind.com"
git config --global user.name "Upmind Docs Bot"
git config --global url."github-mintlify-docs:upmind/mintlify-docs".insteadOf "git@github.com:upmind/mintlify-docs"

mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo "${UPMIND_MINTLIFY_DOCS_DEPLOY_PRIVATE_KEY}" > ~/.ssh/id.mintlify-docs
chmod 600 ~/.ssh/id.mintlify-docs
printf 'Host *\n  StrictHostKeyChecking no\nHost github-mintlify-docs\n  User git\n  Hostname github.com\n  IdentityFile ~/.ssh/id.mintlify-docs\n' > ~/.ssh/config

git submodule deinit -f "${SUB}" 2>/dev/null || true
rm -rf "${SUB}" ".git/modules/${SUB}"
git submodule update --init "${SUB}"
