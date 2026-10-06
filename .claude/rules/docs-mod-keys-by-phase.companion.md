---
id: docs-mod-keys-by-phase
paths:
  - '**/modules/**/docs/foundation.md'
---
# Upmind binding

The phases are initial page load, product display, auth, checkout, payment and post-purchase.

Keys to omit:

- Cart UI only: `BASKET_FUNNELLING`, `CHECKOUT_FLOW`.
- Upmind app only: `REMOVE_UPMIND_BRANDING_ENABLED`, `UI_*`.
- Internal admin: `CREATE_USER_API_TOKENS`, `WEBHOOKS`.
