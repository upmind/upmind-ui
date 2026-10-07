---
id: test-double-matches-request
paths:
  - 'packages/**/__tests__/**/*.{ts,js}'
  - 'packages/**/*.{test,spec}.{ts,js}'
  - 'tests/**/*.{ts,js}'
---
# Replay matching — monorepo bindings

- ADR 035 governs replay: `docs/adr/035-one-scenario-one-recording.md`.
- Exact-identity matching lives in `tests/fixtures/fixture-handlers.ts`.
- Add a scenario step only when the same request must answer differently: a page, a sort, a read after a write.
- The recordings of the owning modules answer the boot reads of a signed-in test: `brand`, `system`, `basket`, `session-store`.
