> Companion to [agent-precedence.md](./agent-precedence.md) — Upmind-monorepo-specific bindings/examples.

## ADR tier binding

Tier 2 ("ADR") is the ratified architecture decisions in `docs/adr/`. The per-story ruling mechanism is `review-notes.md`, owned by `skills/sdd/SKILL.md` (read-first on re-runs, mirrored to Linear, never silently overriding an explicit NO).

## Operator-session binding

The seat registry (`seat-separation.md`) binds inside `agent-run` / `agent-queue` / `code-wave` runs, not the operator's own hands. The standing universal protections that still apply to everyone are U9 core-machines sign-off (`core-machines.md`) and the graphify gate.

## The §3.11 always-on law set

The always-on injected law set (§3.11) is exactly these nine laws, and `agent-precedence.md` is where the set is named:

- agent-precedence
- agent-scope-discipline
- seat-separation
- reality-check
- negative-controls
- legacy-parity-oracle
- gates-green-not-correct
- core-machines
- agent-verify-before-acting

`hooks/inject-laws.sh` injects exactly this set, and `scripts/lint-inject-laws.mjs` lints that the script matches it. Every other live rule reaches its agents by a path-scoped or skill-loaded home instead (§3.11 disposition table), so nothing goes dark and the selection stays auditable.

## Cross-references (ADR-029)

The label state machine's "the agent never reviews" clause was narrowed by a dated amendment (2026-07-20, ratified with ADR-029) to "the agent never emits the review **verdict**" — agent seats pre-gate (block), humans verdict. See `rules/agent-labels.md` + `rules/agent-labels.companion.md`; that amendment binds at ADR level per the order above.
