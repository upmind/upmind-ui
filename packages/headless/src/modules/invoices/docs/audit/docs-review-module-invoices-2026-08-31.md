# docs-review — invoices module (module/foundation lane)

Date: 2026-08-31 · Tier: light (small flat module) · Reviewer: /docs-review

## Scope

- `docs/foundation.md` (rebuild-grade spec) — audited against `rules/docs-modules.md`.
- `docs/README.md`, `usage.md`, `architecture.md`, `gotchas.md`, `CHANGELOG.md` (internal-facing) — audited against `rules/docs-writing.md`.

No prior audit — fresh full audit only.

## Scores

| Category           | Score                |
| ------------------ | -------------------- |
| Technical accuracy | 92                   |
| Completeness       | 90                   |
| Structure          | 92                   |
| Tone               | 91                   |
| Actionability      | 90                   |
| **Overall**        | **91** (publishable) |

## Foundation audit

**Strip audit — PASS.** No implementation leaks. Grep for `useInvoice` / `.value` / `computed` / `ref(` / `watch` / `TanStack` / `queryKey` / `mapInvoice` / `XState` returns only `server-computed` / `recomputed` (factual BE descriptions, not the framework `computed`) at lines 5, 18, 240. The client-only `meta`/`object_meta` bag is flagged once (top-of-doc italic) and never referenced again.

**Section audit — PASS.** All required sections present: What it is, Core concepts, Operations, Data shape, Dependencies, API endpoints, Lessons. Optional State model justified (platform-defined status enum the caller observes) and Flows justified (multi-step pay-down interaction).

**Content audit — PASS.**

- Operations cover every exposed behaviour including lifecycle (read, settlement derivation, presentation signals, readiness, refresh, invalidate).
- Data shape matches the recorded fixture and the shared `IInvoice` type; dual-currency twins and consolidation/credit pointers noted as on-wire.
- Dependants table matches the graph: `orders` (imports `useInvoice`/`mapInvoice`) + presentation layer; transport/routing excluded with a footnote.
- Endpoint sample is fixture-sourced (`get-invoices-id-case-paid.json`); error paths cited from the recorded 404/401 fixtures.
- Lessons map to observable platform phenomena (id reuse across convert, mid-write disagreement, frozen snapshot, money-field flavours, invalidate-key match).

## Internal docs audit

Accurate to the module's real flat shape (`useInvoice(id)` → `{ isReady, meta, data, error, refetch, invalidate }`); no invented `.as(actor)`, state machine, or schema-form surface. gotchas + CHANGELOG both carry the FE-3130 invalidate-key fix and the read-after-`isReady` contract.

## Findings

- 🟢 Foundation is rebuild-grade, framework-neutral, and fixture-backed.
- 🟡 Cosmetic: MD060 markdown table-pipe-spacing warnings in usage/architecture/gotchas — auto-fixed by `pnpm format` (lint-staged) on commit.
- 🟢 No strip, section, or content defects.

## Verdict

Publishable (91/100) — commit the set; the only open item is the cosmetic table-spacing lint, which the pre-commit formatter resolves.
