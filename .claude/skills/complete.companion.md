> Companion to the upmind-agent skill /complete — Upmind-monorepo bindings.

Labels and columns: `.claude/rules/linear-lifecycle.md`.

## ID and branch format

- Story ids `FE-XXXX`; feature branch `feature/FE-XXXX` (the Worktree Auto-Detection grep and the Step 6 cleanup message).
- SDD directory glob `docs/sdd/FE-XXXX*/`, for the Step 4.5 evidence check and the Step 4.6 audit table:

```bash
test -d "$(ls -d docs/sdd/FE-XXXX*/evidence 2>/dev/null | head -1)" \
  && ls -1 docs/sdd/FE-XXXX*/evidence/ \
  || echo "❌ No evidence directory filed"
```

## Issue-tracker binding (Step 6.5)

Linear. The base "move the completed story to the review state" is the review-pending role in `linear-lifecycle.md`; `id` is the issue UUID from `get_issue`, never the `FE-XXXX` identifier.

## Change-request host (Step 5)

GitLab (`git.upmind.io`); a merge request. A `release/*` source targets its release branch, everything else targets `develop`. Push-option values cannot contain newlines; a re-do push updates the existing MR; the queue's CR-URL field is `mrUrl`.

```bash
git push -u origin $BRANCH \
  -o merge_request.create \
  -o merge_request.target=develop \
  -o "merge_request.title=feat(FE-XXXX): [story title]" \
  -o "merge_request.description=[Brief summary]. [FE-XXXX](https://linear.app/upmind/issue/FE-XXXX) | 🤖 Agent Runner" \
  -o merge_request.label=agent \
  -o merge_request.remove_source_branch
```

## Docs-corpus refresh — final step

If the story touched `packages/*/src` or `docs/`, run the refresh last and commit `docs/corpus/corpus.json` with the story:

```bash
pnpm --filter docs corpus:refresh
```

`corpus:emit` writes into the `docs/published-docs` submodule; committing that tree is gated on the mintlify-docs bot PAT (FE-2949).
