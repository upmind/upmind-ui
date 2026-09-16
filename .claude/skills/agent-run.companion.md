> Companion to the upmind-agent skill /agent-run — Upmind-monorepo bindings.

Labels, columns and the read → compute → write invariant: `.claude/rules/linear-lifecycle.md`.

## Tracker binding (generic verbs → Linear)

- Tracker: Linear (MCP connector `claude.ai Linear`). Unavailable → agent failure → Error Recovery (Blocked).
- *read the issue* → `get_issue`; *update labels + status* → `save_issue(id, labels, state)`; *read comments* → `list_comments`; *post a comment* → `save_comment`.
- Ticket id `FE-XXXX` wherever the base writes `<ID>`: `../.worktrees/FE-XXXX`, `docs/sdd/FE-XXXX/`, `docs/plans/FE-XXXX.md`.
- Issue URL: `https://linear.app/upmind/issue/FE-XXXX`.
- Branch = Linear's `gitBranchName`, verbatim (e.g. `feature/fe-2317-bug-discount-value-…`). Never fabricate `feature/FE-XXXX`.
- External blockers use other team prefixes (e.g. `ATBE-###`) — see `agent-queue.companion.md`.

## Git host + branches

- Git host: GitLab. `$BASE` = `develop`.
- D8 — open the change request (push-option values cannot contain newlines; a re-do push updates the existing MR; the queue's CR-URL field is `mrUrl`):

```bash
git push -u origin $BRANCH \
  -o merge_request.create \
  -o merge_request.target=develop \
  -o "merge_request.title=feat(FE-XXXX): [story title]" \
  -o "merge_request.description=[Brief summary]. [FE-XXXX](https://linear.app/upmind/issue/FE-XXXX) | 🤖 Agent Runner" \
  -o merge_request.label=agent \
  -o merge_request.remove_source_branch
```

## Build / check commands

- Install (D3 / T3): `cd ../.worktrees/FE-XXXX && pnpm install --frozen-lockfile 2>&1 | tail -5`
- D7 checks, green before any push. `pnpm ci:check` IS the blocking merge-request pipeline (typecheck, all builds, the three lints CI blocks on, unit + integration, design-system tests); add `pnpm run test:bdd` (`pnpm ci:check:full`) when the diff touches e2e features, specs or support. `pnpm lint` is `allow_failure` in CI: fix what you touched. Never root `pnpm test`.

```bash
cd ../.worktrees/FE-XXXX
git diff --name-only origin/develop -- '*.ts' '*.vue' | xargs grep -l -E '\.map\(|\.filter\(|\.find\(|\.reduce\(' 2>/dev/null   # Lodash mandate
pnpm ci:check 2>&1 | tail -40
pnpm lint 2>&1 | tail -20
```

## Dedicated test pass (T4)

Playwright regression suite, scoped to targeted specs / EN inside the 30-minute ceiling (ADR-021).

## Notifications

Slack via the `SLACK_WEBHOOK_URL` env var.
