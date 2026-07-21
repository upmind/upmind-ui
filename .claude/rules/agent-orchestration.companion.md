> Companion to [agent-orchestration.md](./agent-orchestration.md) — Upmind-monorepo-specific bindings/examples.

## Skill-loaded by (the spawning skills)

This rule's home is **skill-loaded by every spawning skill via the team maps** — the skills that fan work out load it themselves when they orchestrate:

- `agent-run` — the D-phase seat map spawns developer/prover/reviewer/verifier.
- `agent-queue` — dispatches queued stories to their seats.
- `code-wave` — one-tranche-at-a-time fan-out with an operator gate between tranches.
- the `sdd` chain (`sdd`, `sdd-requirements`, `sdd-bdd`, `sdd-tasks`, `sdd-review`) — merges/splits doc phases across agents.

Because every spawning skill references it, injection can stop carrying it unconditionally (per §3.11's excluded-live-rule set); the Wave 0 enumeration lint checks that the injected set matches the enumeration and that this rule's home is a skill, not the always-on injection.

## MR-review binding

The "reviewing a change-request" clause adapts `/story-review` — scope to the MR range (`origin/<target>...origin/<source>`), skip worktree auto-detect, keep it report-only on someone else's branch.
