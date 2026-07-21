# ADR 029: Agent Plugin — Seat Separation & Anti-Cosplay Enforcement

**Date:** July 21, 2026
**Status:** Proposed (pending owner sign-off)
**Authors:** Dom da Costa
**Related:**

- Design: [`docs/plans/upmind-agent-plugin-design.md`](../plans/upmind-agent-plugin-design.md) (rev 3 — the binding design this ADR ratifies)
- [ADR 021: Testing Trophy, Agentic Workflow & Coverage Policy](./021-testing-pyramid-and-agentic-workflow.md) — this ADR provides the *mechanical* closure of ADR 021's `test-writer ≠ code-writer` principle (see ADR 021 Amendment 2)
- [ADR 001: Scope-Based Composable Architecture](./001-scope-based-composables.md) — the actor×context matrix is the parity oracle's coverage unit
- [ADR 005: XState State Management](./005-xstate-state-management.md), [ADR 007: Headless Architecture](./007-headless-architecture.md) — the "core machines are battle-hardened" law (`rules/core-machines.md`) anchors here
- Provenance incident: FE-2824 client-email pilot ("cosplay": right shape, right filenames, green tests, zero new capability)

---

## Context

Agentic delivery in this repo failed in a specific, repeatable way (FE-2824): a single agent wrote the code, its tests, and its docs for a "scope pattern adoption". The module acquired the *shape* of the pattern (actor matrix with a `STAFF` entry, four-layer return, README) while the staff capability was purely cosmetic — every service hardwired the session's own client id, `.for('client', id)` was silently dropped, and the only "staff" test asserted the label it set. It passed every gate: green tests, green typecheck, docs present.

The root causes generalise beyond that one story:

- **Self-certification** — the seat that builds also proves.
- **Shape-over-behaviour acceptance criteria** — plans graded structure, not capability.
- **Missing oracle** — nothing required consulting the legacy (vue-app) definition of "the real job".
- **Unenforced prose** — the relevant laws existed as words (including ADR 021's writer-split), with no hook/lint/CI to make them bite.
- **Lying artifacts** — docs and tests that certify absent capability.

## Decision

Adopt the `upmind-agent` plugin (`monorepo-agent` repo, distributed via the existing marketplace entry) as the governed agentic-code lifecycle, built on one north star:

> **A green gate must mean the real software does the real job.**

The binding design is [`docs/plans/upmind-agent-plugin-design.md`](../plans/upmind-agent-plugin-design.md) (rev 3). This ADR ratifies its load-bearing decisions; it does not restate the design.

### Ratified principles

1. **Seats, not suggestions.** Builder ≠ tester/prover ≠ reviewer ≠ verifier ≠ documenter, enforced by dispatch structure and blocking hooks — never by instruction text alone. Provers are fed the *contract* (acceptance criteria / spec), never the builder's implementation as oracle.
2. **Acceptance criteria name capabilities.** Every AC names an executable, non-unit-only behavioural read-back; a plan whose ACs lack one is not planable (plan-compliance lint).
3. **Oracles are external to the author.** "The real job" is defined by the vue-app legacy, the ADR 001 actor→context matrix, recorded fixtures, and existing e2e — never the new code's own tests.
4. **A rule that is not a hook, lint, or CI job is a wish.** Every law in the plugin has a named mechanical enforcement point.
5. **Negative controls & fail-closed verification.** Every gate ships committed known-bad fixtures proven to go RED (mutation-tested); delivery verification is binary PRESENT/ABSENT, fail-closed, half-landed = ABSENT.
6. **Scope discipline.** Effort is never a disposition; only the operator may drop or narrow scoped work (`rules/agent-scope-discipline.md`).

### Standing constraints carried by the plugin

Core machines are battle-hardened (test layer presumed wrong first; core edits need operator sign-off — `rules/core-machines.md`); the 30-minute e2e ceiling (ADR 021) holds; one-tranche-at-a-time with operator review between; fan-outs pin cheap models explicitly; GitLab + Linear, never GitHub; rules cite ADRs rather than duplicating them.

## Consequences

- The `.claude/commands` symlink layer is retired; the plugin is the single distribution.
- New enforcement surfaces (workflow-compliance lint, seat-guard, negative-control mutation lane, parity oracle, plan-compliance lint) become preconditions for "done", not aspirations.
- ADR 021's `test-writer ≠ code-writer` open item is mechanically closed here (ADR 021 Amendment 2).
- The plugin is delivered in tranches; this ADR is the ratifying decision, not the delivery record (see the design's migration section and the wave evidence).

## Status Notes

Proposed — pending owner sign-off. On acceptance, the citing rules/agents (`agent-precedence.md`, `agent-labels.md`, `reviewer.md`, `seat-separation.md`) resolve to this ratified decision.
