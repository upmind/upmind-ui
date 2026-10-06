---
id: docs-mod-platform-not-build
paths:
  - '**/modules/**/docs/foundation.md'
---
# Upmind binding

Concrete Upmind names to remove:

- Composable surface: `useBrand()`, `isReady()`, `getConfigValue(key)`, `validateCurrency(model)`.
- Stores and identifiers: `brandConfigKeysStore`, the `["brand", "config"]` query key, `localStoragePersister`.
- Internal functions: `service.fetchBrandConfig`, `mapBrandSettings`.
- Wrapper toggle: `{ silent: true }`. Its wire flags stay ([docs-mod-typed-shapes](./docs-mod-typed-shapes.companion.md)).
- Composite as a primitive: "bundle". List `product_type: 2` as a data value only.
- URL-parameter bags: `DeepLinkConfig` and the `pid`, `qty`, `bcm` shorthand fields.
- Presentation flags derived from config: `hasStorefront`, `keepsUserInSitu`, `hasUpmindBranding`.
