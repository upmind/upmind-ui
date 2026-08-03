> Companion to [agent-behavior.md](./agent-behavior.md) — Upmind-monorepo-specific bindings/examples. Section numbers below are the base rule's.

## §1 Precedence — the ADR tier

Tier 2 ("ADR") is `docs/adr/` in this repo. The per-story ruling mechanism is `review-notes.md`, owned by `skills/plan/sdd/SKILL.md` — read first on re-runs, mirrored to Linear, never silently overriding an explicit NO.

The label state machine's "the agent never reviews" clause was narrowed by a dated amendment (2026-07-20, ratified with ADR-029) to "the agent never emits the review **verdict**": agent seats pre-gate, humans verdict. That amendment binds at ADR level — see [agent-orchestration.companion.md](./agent-orchestration.companion.md).

## §2 Verify before acting — the knowledge graph

For architecture / "where is X" questions, the index is `graphify-out/` — query it, or read the actual files, before answering. `graphify-out/GRAPH_REPORT.md` carries the god nodes and community structure; `graphify-out/wiki/index.md` is the navigable wiki when present.

## §3 Decisive execution — what counts as an external side effect

GitLab merge-request comments and Slack channel messages. Posting to either needs approval in an interactive session.

## §5 Protected core — enforcement lives in settings, not the plugin

The battle-hardened core here is **headless core** (`packages/headless/**`, `**/*.machine.ts`, `**/machines/**`). The plugin performs **no** path check — protect it with the harness's own `permissions.deny` rules in `settings.json` (ADR 003, operator ruling 28 July 2026). Absent those, §5 is a rule you keep rather than a gate that stops you: a test disagreeing with a headless machine presumes the **test** wrong, and genuine machine evidence stops and asks the operator. Detail in [code-xstate.companion.md](./code-xstate.companion.md).

## §6 Autonomous-context signal

Signal #3 in this repo is `GITLAB_CI=true`. Also honour `CI=true` and the `CI_*` GitLab predefined vars.
