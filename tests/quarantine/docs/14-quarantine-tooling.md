# 🧹 13. Flake-Quarantine Tooling

Mechanical enforcement of [ADR 021's flakiness policy](../../../docs/adr/021-testing-pyramid-and-agentic-workflow.md#flakiness-policy). The policy is simple and non-negotiable:

| Trigger                              | Action                                           |
| ------------------------------------ | ------------------------------------------------ |
| **Flake once**                       | Root-cause investigation. Fix or quarantine.     |
| **Flake twice** (in a 30-day window) | Quarantine (skipped) with a linked Linear issue. |
| **Quarantined > 30 days**            | Deleted.                                         |

A quarantine without a forcing function decays into forever-quarantine — the worst failure mode. This tooling _is_ the forcing function. The human procedure for quarantining a test lives in the [`/test-quarantine`](#skill-integration) skill; the tooling here backs it with lint, reporting, and CI enforcement.

Everything lives under [`tests/quarantine/`](../../../tests/quarantine/) and is dependency-free Node (built-ins only), matching the repo's other standalone scripts.

---

## The `@quarantine` tag

A quarantined test is a **static** `.skip` carrying a tag on the line above it:

```ts
// @quarantine(FE-1234, 2026-08-09)
test.skip("checkout fills postcode in Stripe iframe", async ({ page }) => {
  // … body unchanged
});
```

- `<linear-id>` — the audit-trail issue filed _before_ the tag (`FE-1234`).
- `<delete-date>` — ISO `YYYY-MM-DD`, exactly 30 days from the quarantine date.

**What counts as a quarantine-relevant skip:** a `.skip(...)` whose first argument is a **string/template title** — a named, permanently-skipped test or `describe`. That is the only form the tooling governs.

**What does NOT** (and never needs a tag): conditional/environment gates such as `test.skip(!brandFlag, "reason")` or `cond ? test.skip : test`. Those are feature gates, not quarantines — see the skill's _When NOT to Use_.

---

## The four tools

### 1. `pnpm lint:quarantine` — the PR gate (AC1)

Fails the build if a static `.skip` lacks a valid `@quarantine(<id>, <date>)` tag.

- **Hard fail:** no tag, or a tag missing its id or its delete-date.
- **Best-effort (warnings):** invalid ISO date, or a non-resolvable id (e.g. an `FE-XXXX` placeholder). `--strict` promotes these to failures.

Runs on every merge request via the [`lint:quarantine`](../../../.gitlab-ci/quarantine.yml) CI job.

**Pre-existing debt** is grandfathered in [`quarantine-baseline.json`](../../../tests/quarantine/quarantine-baseline.json) — the same idiom as `eslint-suppressions.json`. New skips must comply; the baseline is the burn-down worklist for the separate audit pass (out of scope for the tooling rollout). Regenerate it only when burning debt down:

```bash
pnpm lint:quarantine --update-baseline
```

### 2. `pnpm test:quarantined --age` — the ledger (AC3)

Lists every quarantined test with its linked issue, delete-date, days elapsed and days remaining. `--age` sorts least-time-remaining first, so imminent expiries surface at the top. `--json` for machine consumption.

```
FE-1234  27d in / 3d left  ⏰
    tests/Playwright/e2e/.../stripe-card.spec.ts:101  "Valid SEPA Debit"  (delete by 2026-08-09)
```

Days elapsed is derived from the delete-date (delete-date = quarantine-date + 30), so no second field is stored.

### 3. `pnpm quarantine:flaky` — the flake finder (AC2)

Reads Allure history and surfaces tests that flaked **twice in the last 30 days** — the quarantine trigger. Emits `tests/Playwright/e2e/reports/quarantine-flaky-report.json` and prints a summary. Wired as the [`quarantine:flaky-report`](../../../.gitlab-ci/quarantine.yml) CI artefact after the e2e run.

A **flake event** for a test in the window is the union of:

1. a run marked `flaky` (a Playwright retried-pass), and
2. a status **oscillation** vs the previous run (`passed ↔ failed/broken`) — Allure's own "classic flaky" signal.

> **Known limitation (by design, not a bug):** Allure's `history.jsonl` persists only each run's final `status`, **not** Playwright's retried-pass `flaky` flag (see `@allurereport/core` `createHistoryItems`). So a _pure_ retried-pass that never changed final status is only detected for the **current** run, not retroactively across the window; the oscillation heuristic covers the pass↔fail instability that history _does_ retain. Persisting the per-run flaky flag into history is an Allure-infra change, explicitly out of FE-2776's scope. Flags: `--window <days>`, `--history <path>`, `--results <path>`, `--out <path>`.

### 4. `pnpm quarantine:enforce` — the deadline (AC4)

The forcing function, run weekly on a schedule ([`quarantine:cron`](../../../.gitlab-ci/quarantine.yml)):

- `--remind` — **day 25:** files a `Quarantine expiring: <test>` Linear issue for each quarantine with ≤ 5 days left. Best-effort: needs `LINEAR_API_KEY` + `LINEAR_TEAM_ID` + `--apply`; otherwise it dry-runs and prints what it would file.
- `--enforce` — **day 30:** exits non-zero, listing every quarantine past its delete-date, failing CI until each is deleted, fixed-and-restored, or re-quarantined with a documented justification. It also fails any tagged quarantine whose delete-date is unparseable — a quarantine with no computable deadline must be fixed, not left to linger.

The **only** exemption from the day-30 fail is an explicit [baseline](#the-quarantine-tag) entry (the grandfathered pre-existing debt the audit pass owns). Enforcement deliberately ignores id _shape_: a placeholder id (`FE-XXXX`) is a lint warning, but it must **not** grant a test permanent immunity from the deadline — otherwise the forcing function isn't one. (lint stays best-effort/friendly on the PR; the weekly enforce cron is the hard backstop that placeholder ids and garbage dates cannot slip past.)

---

## CI wiring & ops setup

All three jobs live in [`.gitlab-ci/quarantine.yml`](../../../.gitlab-ci/quarantine.yml). The weekly cron needs a one-time GitLab setup (**CI/CD → Schedules**):

1. Add a weekly schedule on the default branch.
2. Set the schedule variable `QUARANTINE_CRON = "true"`.
3. Add masked CI/CD variables `LINEAR_API_KEY` and `LINEAR_TEAM_ID` so day-25 reminders can be filed. Without them the reminder dry-runs and the day-30 fail still works.

---

## Skill integration

This tooling backs two skills (shipped via the `upmind-agent` plugin):

- **`/test-quarantine`** — the human procedure: file the Linear issue, apply the `@quarantine` tag, cross-link. Its "Step 4: Mechanical enforcement" and "if the A6 tooling isn't in place yet, file the reminder manually" caveats are now **live** — point them at this doc and the `pnpm quarantine:*` scripts.
- **`/test-triage`** — diagnoses a failure; when it concludes "flake, can't root-cause now" it hands off to `/test-quarantine`. Its flake-history step is served by `pnpm quarantine:flaky`.

If you maintain those skill files, replace their "future tooling" language with a reference to this page and the four scripts above.
