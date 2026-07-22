> Companion to [agent-precedence.md](./agent-precedence.md) — Upmind-monorepo-specific bindings/examples.

## ADR tier binding

Tier 2 ("ADR") is the ratified architecture decisions in `docs/adr/`. The per-story ruling mechanism is `review-notes.md`, owned by `skills/sdd/SKILL.md` (read-first on re-runs, mirrored to Linear, never silently overriding an explicit NO).

## Cross-references (ADR-029)

The label state machine's "the agent never reviews" clause was narrowed by a dated amendment (2026-07-20, ratified with ADR-029) to "the agent never emits the review **verdict**" — agent seats pre-gate (block), humans verdict. See `rules/agent-labels.md` + `rules/agent-labels.companion.md`; that amendment binds at ADR level per the order above.
