> Companion to the upmind-agent skill /sdd — Upmind-monorepo-specific bindings/overrides.

## Reference repos (Step 0 / Setup / Refresh)

Bind the generic reference-repo placeholders in `/sdd`:

| Role | Remote | Default branch | Worktree path |
|------|--------|----------------|---------------|
| Primary (REQUIRED) | `git@git.upmind.io:upmind/upmind-monorepo.git` (`upmind/upmind-monorepo`) | `develop` | `repos/monorepo` |
| Legacy (OPTIONAL) | `git@git.upmind.io:upmind/vue-app.git` (`upmind/vue-app`) | `master` | `repos/vue-app` |

- vue-app is legacy reference only — and is the source of truth for **legacy-parity** ambiguities.
- **Branch Checkout Flow:** checkout the target branch in `repos/monorepo`; restore to `develop` when done.
- **Refresh — submodules:** when updating submodules, SKIP the `.agent` submodule (it is this same repo):
  `git -C repos/monorepo submodule update --init --recursive -- $(git -C repos/monorepo submodule--helper list | awk '{print $2}' | grep -v '\.agent')`

## Issue tracker

- The tracker is **Linear**; ticket ids are `FE-xxxx` (e.g. `FE-2243`).
- **Step 1b:** `review-notes.md` must ALSO be posted as a **Linear comment** on the issue so it is visible to agents and reviewers.
- **Step 1c:** on re-run, check **Linear comments** for prior review notes.

## Scope matrix & actors (Blocking-Ambiguity Classifier, Step 1d)

- Actor set: **staff / client / guest**. Capability example: does staff get a delta client doesn't?
- Scope-matrix cells (actor × context) are governed by **ADR-001** — each cell is in-scope, dropped, or not-supported per that record. Guessing a cell is how capability drops happen.
- **Legacy-parity** source: **vue-app** (does it support this actor×context cell, and how?).

## BDD / e2e doctrine (Four Phases table, Step 3)

- Declarative Gherkin and the e2e contract are governed by **ADR 020**; test strategy by **ADR 021**.
- `.feature` files live under `tests/Playwright/features/<flow>/`.
