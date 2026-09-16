> Companion to the upmind-agent skill /story-plan — Upmind-monorepo-specific bindings/overrides.

## Issue tracker binding

The issue tracker is **Linear**. Story IDs are Linear keys of the form `FE-XXXX` (e.g. `FE-2229`).

- **Step 1 / Background step 1 (fetch story):** `linear__get_issue(id: "FE-XXXX")`. Linear is the source of truth for description and acceptance criteria.
- **Step 1.5 / Background step 2 (mark started):** `linear__save_issue(id: "<issue-uuid>", state: "In Progress")`.

## Git host binding

The git host is **GitLab** (git.upmind.io). Change requests are **MRs**. Branches are `feature/FE-XXXX` (unchanged by a replan — Invariant 5).

## Tracker status → bucket mapping (replan invariants)

Columns and labels: `.claude/rules/linear-lifecycle.md`. Base buckets: completed = the done column; in progress = `In Progress`; pending = `Backlog`, `Needs Refinement`, `Todo`.
