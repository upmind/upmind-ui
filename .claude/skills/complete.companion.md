> Companion to the upmind-agent skill /complete — Upmind-monorepo-specific bindings/overrides.

Binds the base skill's generic `<ID>`, "issue tracker", and "review state" placeholders to this repo's concrete systems. The base doctrine is authoritative; this file only supplies the values.

## ID and branch format

- Story IDs use the `FE-` prefix on the `FE` team (e.g. `FE-2476`). Everywhere the base says `<ID>`, use `FE-XXXX`.
- The feature branch is therefore `feature/FE-XXXX` — this is what the Worktree Auto-Detection grep (`git worktree list | grep "feature/FE-XXXX"`) and the Step 6 cleanup message resolve to.
- The story's SDD directory glob is `docs/sdd/FE-XXXX*/` — bind the Step 4.5 evidence check and the Step 4.6 audit table to it:

```bash
test -d "$(ls -d docs/sdd/FE-XXXX*/evidence 2>/dev/null | head -1)" \
  && ls -1 docs/sdd/FE-XXXX*/evidence/ \
  || echo "❌ No evidence directory filed"
```

## Issue-tracker binding (Step 6.5)

- The issue tracker is **Linear** (via the Linear MCP tools). The base "move the completed story to the review state" binds to:

```
linear__save_issue(id: "<issue-uuid>", state: "Needs Review")
```

The `id` is Linear's internal issue UUID; the human `FE-XXXX` id resolves to it via `linear__get_issue`.

## Change-request host (Step 5) — absorbed from the retired `/mr-create`

`/complete` now opens the change request itself (the former `/mr-create` step is absorbed into this door). Git host is **GitLab** (`git.upmind.io`); the change request is a **merge request**. Target-branch detection: a `release/*` source targets its release branch, everything else targets **`develop`**. Open it via the GitLab push-option incantation (single-line description — push-option values cannot contain newlines):

```bash
git push -u origin $BRANCH \
  -o merge_request.create \
  -o merge_request.target=develop \
  -o "merge_request.title=feat(FE-XXXX): [story title]" \
  -o "merge_request.description=[Brief summary]. [FE-XXXX](https://linear.app/upmind/issue/FE-XXXX) | 🤖 Agent Runner" \
  -o merge_request.label=agent \
  -o merge_request.remove_source_branch
```

On a re-do branch that already has an open MR, the push updates it (no new MR). The queue's CR-URL field is `mrUrl`.

## Docs-corpus refresh — final step (replaces the removed PostToolUse hook, FE-2752)

The FE-2752 PostToolUse `docs-corpus-refresh` hook was removed: keeping the corpus in sync with the code is a completion **step**, not a per-tool trigger. On story completion, if the story touched `packages/*/src` or `docs/`, run the refresh as a final step and commit the result with the story:

```bash
pnpm --filter docs corpus:refresh   # corpus:build (corpus.json) && corpus:emit
```

Commit the regenerated `docs/corpus/corpus.json`. NOTE: `corpus:emit` writes the rendered tree into the `docs/published-docs` submodule; committing/pushing that tree — and re-enabling the (currently paused) docs-corpus CI — is gated on the mintlify-docs bot PAT (FE-2949). Until then this keeps `corpus.json` current in-repo.
