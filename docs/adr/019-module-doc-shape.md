# ADR 019: Module Documentation Shape

**Date:** May 2026
**Status:** Accepted
**Authors:** Dominic da Costa
**Related:** [.agent/rules/docs-modules.md](../../.agent/rules/docs-modules.md) — living canonical rule

---

## Context

In preparation for the Contabo 2-day workshop, we needed framework-agnostic reference docs for each core module — readable by architects and senior devs who know how to build software but don't know Upmind's platform. The docs had to describe *behaviour, data, relationships, and gotchas* without leaking our implementation choices (XState, Vue reactivity, scoped composables, TanStack Query).

A doc-shape proposal was drafted and walked through, then locked in May 2026. After 7 module reviews (`session` → `client` → `basket` → `basketProduct` → `product` → `productCatalogue` → `productCategories` → ...), the patterns were lifted into [`.agent/rules/docs-modules.md`](../../.agent/rules/docs-modules.md), which is now the living canonical rule. This ADR preserves the original decisions and their rationale.

---

## Decision

Seven decisions locked at the time of approval:

### 1. Guidelines + consistent naming + consistent order + required/optional split

Module docs omit sections that don't apply (no `n/a` filler), but when a section appears it uses the canonical name in the canonical order. Some sections are required for every module; others are optional based on the module's nature.

- **Required** (every module doc): What it is · Operations · Data shape · Dependencies · API endpoints · Gotchas
- **Optional** (use these names when present): Core concepts · State model · Side effects · Coordination · Flows

### 2. API endpoints included in module docs

Alongside the BE team's canonical reference. Each endpoint as: method + URL + brief role + full curl example + sample response sourced from a real fixture.

### 3. Mermaid for all sequence and state diagrams

No alternative diagram formats. Keeps the docs renderable everywhere markdown renders.

### 4. "How you'd build it" hints omitted from module docs by default

Exception: hints that expose genuine IP / non-obvious know-how AND save significant time. Default omit; high-value exceptions allowed.

### 5. Single file per module doc by default

Split only for genuinely huge modules (e.g. `basket`).

### 6. Gotchas sourced from real evidence, not coding standards

Sources: story-review feedback, code comments, existing per-module gotcha docs (like `basketProduct/docs/gotchas.md`), the graph's surprising connections, AND analysis of machine interactions / sequencing / helpers / subscriptions. **NOT sourced from `.agent/rules/`** — those are coding standards, not gotchas.

### 7. Coordination as a distinct section

Added between Side effects and Flows. Documents helpers, subscriptions, sequencing constraints, and timing-sensitive behaviours. The Coordination section is where the *real solutions to gotchas* live; each gotcha cross-references its Coordination mechanism.

---

## Consequences

- **Positive:** 13 module docs converged on a consistent shape (avg score ~94/100 across the 7 reviewed). The required/optional split kept docs honest — modules without state machines, side effects, or multi-step flows simply omit those sections rather than padding with filler.
- **Positive:** Decision 6 (gotchas from evidence, not rules) prevented the docs becoming a re-statement of internal coding standards. Reviewers consistently caught and stripped lesson candidates that were "app convention" rather than "platform contract".
- **Positive:** Decision 7 (Coordination section) gave the platform's most subtle behaviour (refresh debouncing, in-flight cancellation, actor-change reactions) a dedicated home, paired with the gotchas it prevents.
- **Trade-off:** Strict required/optional naming means changes to the section list need a rule update — but that's also the point.

---

## Where the live version lives

[`.agent/rules/docs-modules.md`](../../.agent/rules/docs-modules.md) is the authoritative current rule. It has been sharpened across 7 review cycles with additional guidance: meta-note conditional, producer-side strip list, sibling-module scope boundaries, dependants table direction, capability count overflow guidance, and three lesson-pattern examples. Refer to that file when writing or reviewing docs.

This ADR holds the *why*. The rule holds the *how*.
