> Companion to the upmind-agent skill /story-complete — Upmind-monorepo-specific bindings/overrides.

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

## Change-request host (Step 5)

Step 5 delegates change-request creation to `/mr-create`; the git-host binding (GitLab, project identifier, target-branch detection: `release/*` → `develop`) lives in `/mr-create`'s own companion. Do not re-bind it here.
