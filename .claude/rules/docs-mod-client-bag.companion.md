---
id: docs-mod-client-bag
paths:
  - '**/modules/**/docs/foundation.md'
---
# Upmind binding

The client-only bag is `meta`, and on basket responses also `object_meta`. The top-of-doc note:

> *Any `meta` field returned by Upmind endpoints is UI-specific to our own client — ignore for spec purposes.*

- The envelope's `meta: null`, beside `data`, `error` and `messages` on every response, is not a bag. Omit the note when it is the only `meta`.
- Brand carries only `meta.i18n`. Name that sub-key in the note.
- Basket responses carry `meta` and `object_meta`. Name the two.
- Out of spec, under any name: `meta.i18n`, `meta.cart`, `meta.uischema`, i18n or translation overrides, brand-cart layout and cart UI overrides.
