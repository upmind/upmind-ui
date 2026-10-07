---
id: docs-mod-typed-shapes
paths:
  - '**/modules/**/docs/foundation.md'
---
# Upmind binding

- Shared types are in `packages/types/src/models/`. Enums are in `packages/types/src/data/enums/`.
- Wire flags to document in the body and the curl: `provision_field_values_validate: false`, `skip_recompute: true`.
- Sentinels: `min_order_quantity: 0` means "no minimum". `currency_id: null` means "use the brand default".
