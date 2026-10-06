---
id: docs-framework-agnostic
paths:
  - 'docs/reference/**/*.md'
  - 'docs/adr/**/*.md'
  - '**/modules/**/docs/foundation.md'
---
# Upmind binding

The Upmind stack terms to keep out:

- Vue reactivity: `computed`, `ref`, `watch`.
- XState: machines, actors, services, guards, `spawn`.
- TanStack Query: query keys, refetch, persisters.
- Scoped composables: `useX().as('client')`, the actor-scoping accessor of ADR-001.
