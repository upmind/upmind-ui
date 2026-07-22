> Companion to the upmind-agent skill /agent-run — Upmind-monorepo-specific bindings/overrides.

The base doctrine is authoritative; this file only supplies the repo values. The label strings, the base-stage → workflow-status column mapping, the exact transition table, and the `save_issue`-replaces-whole-set / non-agent-label (area · priority · provenance · releases) invariant are owned by [`agent-labels.companion.md`](../rules/agent-labels.companion.md) — do not restate them here.

## Tracker binding (generic verbs → Linear)

- **Tracker:** Linear (MCP connector `claude.ai Linear`). If unavailable, treat as an agent failure → Error Recovery (Blocked).
- The base's generic verbs bind to:
  - *read the issue* → `get_issue`
  - *update the issue* (labels + status) → `save_issue(id, labels, state)` (read → recompute → write; `labels` replaces the whole set — see the label companion)
  - *read the issue's comments* → `list_comments`
  - *post a tracker comment* → `save_comment`
- **Ticket-ID format:** `FE-XXXX` wherever the base writes `<ID>` — e.g. `../.worktrees/FE-XXXX`, `docs/sdd/FE-XXXX/`, `docs/plans/FE-XXXX.md`, `mutants/FE-XXXX/`.
- **Issue URL** (for CR descriptions / comments): `https://linear.app/upmind/issue/FE-XXXX`.
- **Branch field** (base's "tracker's generated branch name") = Linear's **`gitBranchName`**, e.g. `feature/fe-2317-bug-discount-value-not-recorded-...`. Use verbatim; never fabricate `feature/FE-XXXX`.
- **External blockers** (Step 2.0.3) use other Linear team prefixes (e.g. a backend ticket `ATBE-###`) — see [`agent-queue.companion.md`](./agent-queue.companion.md).

## Git host + branches

- **Git host:** GitLab. **`$BASE` (integration/base branch) = `develop`** (all `origin/$BASE` in D2/T2 and the CR target).
- **D8 — open the change request.** GitLab push-option incantation:

```bash
git push -u origin $BRANCH \
  -o merge_request.create \
  -o merge_request.target=develop \
  -o "merge_request.title=feat(FE-XXXX): [story title]" \
  -o "merge_request.description=[Brief summary]. [FE-XXXX](https://linear.app/upmind/issue/FE-XXXX) | 🤖 Agent Runner" \
  -o merge_request.label=agent \
  -o merge_request.remove_source_branch
```

Push-option values cannot contain newlines — keep the description single-line. On a re-do branch that already has an open MR, the push updates it (no new MR). The queue's CR-URL field is `mrUrl`.

## Build / check commands

- **Install (D3 / T3):** `cd ../.worktrees/FE-XXXX && pnpm install --frozen-lockfile 2>&1 | tail -5`
- **D7 static checks + tests** (get green before pushing — never push red):

```bash
cd ../.worktrees/FE-XXXX
# Banned native-op check (enforces the Lodash code rule):
git diff --name-only origin/develop -- '*.ts' '*.vue' | xargs grep -l -E '\.map\(|\.filter\(|\.find\(|\.reduce\(' 2>/dev/null
npx tsc --noEmit 2>&1 | tail -20     # typecheck
pnpm lint 2>&1 | tail -20            # lint
pnpm test 2>&1 | tail -30            # relevant tests
```

## Protected core (U9)

The "protected core package(s)" the developer seat may not edit without an operator sign-off token = **`packages/headless`** (headless core).

## Dedicated test pass (T4)

- **Suite:** Playwright regression suite.
- **Governing suite-runtime ceiling:** 30 minutes; **locale scoping:** EN. Both mandated by **ADR-021** (Testing Trophy, Agentic Workflow & Coverage Policy) — cited via [`negative-controls.companion.md`](../rules/negative-controls.companion.md). Scope to targeted specs / EN to stay under the ceiling.

## Notifications

The base's "notification (if configured)" steps (P7, D16, T8, 3e, Final Report) post to **Slack** via the **`SLACK_WEBHOOK_URL`** env var.
