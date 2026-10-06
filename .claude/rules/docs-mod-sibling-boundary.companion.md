---
id: docs-mod-sibling-boundary
paths:
  - '**/modules/**/docs/foundation.md'
---
# Upmind binding

The validated sibling boundaries:

| Module | Owns | Forwards to |
| --- | --- | --- |
| `product` | catalogue read, initial configuration, seating (`POST /orders`, `POST /orders/{basketId}/products`) | re-resolve, edit, remove → `basketProduct` |
| `basketProduct` | in-basket re-resolve, edit, remove, validate-saved, bulk replace | catalogue browsing and seating → `product` |
| `basket` | the basket envelope: create, claim, currency, promotions, billing, conversion | per-line product operations → `basketProduct` |
| `session` | identity, token and actor surfaces | client profile reads and sub-records → `client` |
