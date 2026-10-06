---
id: e2e-mock-settings-only
paths:
  - 'tests/journeys/**/*.ts'
---
# Upmind binding

The settings a journey may mock are brand config, UI schema, feature flags, third-party error answers, balances and promo codes. Put each mock in `tests/journeys/support/mocks/`.

Basket contents, orders and payment outcomes are journey data. Never mock them.
