---
id: docs-mod-one-row-per-endpoint
paths:
  - '**/modules/**/docs/foundation.md'
---
# Upmind binding

Composed objects to split into their endpoints:

- `useBrand()` reads `/brand/settings`, `/config/brand/values`, `/config/organisation/values` and `/org/modules`.
- `useSystem()` reads `/countries`, `/billing_cycles`, `/currencies`, `/languages`, `/statuses`, `/tickets/departments` and more.
