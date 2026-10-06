---
id: e2e-one-slice
paths:
  - 'tests/journeys/**/*.spec.ts'
---
# Slices — monorepo bindings

- Specs live in `tests/journeys/<surface>/<journey>/<slice>/`, for example `tests/journeys/storefront/oneoff-checkout/storefront-guest-oneoff-checkout-stripe/pay-with-stripe.spec.ts`. The old `tests/Playwright/` suite is frozen.
- The field guide, with an anchor for each principle, is `tests/Playwright/docs/12-pseudo-nathan.md`.
