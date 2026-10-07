# Changelog

All notable changes to the `payment-details` module are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Fixed

- **A filtered stored-method listing no longer collapses to one blank record.** `mapPaymentDetails` now reads a gap-keyed `data` object (`Object.values()`) the same way it reads a plain array or a single record, instead of failing `isArray` and wrapping the whole response as one element. Verified live on staging checkout: the API sent 13 cards, the page went from showing 0 to showing 12, with the default card preselected. The `it.fails` receipt and the page-side test both pinning the old behaviour (see gotchas.md) are inverted, not deleted, so a regression is caught either way.
- **`showStoredPaymentMethods` stays PAY-only now that the mapper fix lets ADD see real stored cards too.** Fixing the mapper made `hasStoredPaymentMethods` turn true in the ADD (save-a-card) context as well as PAY, which would have silently changed ADD's published contract. The flag is now explicitly gated on `isPayContext`, so ADD continues to never offer a stored-method pick — it never did, and this keeps it that way on purpose rather than by accident of the mapper bug.
- **`usePaymentDetails().isReady()` now settles the session before its own query, and drops its one-second timeout race.** It previously resolved as soon as its list query settled, racing a still-settling session with a bare 1-second timeout; a slow stored-card read could open a consuming form with no cards showing at all. It now awaits the session's own `isReady()` first (the same pattern `useContracts` uses), then waits on its query with no timeout — a caller who awaits it now gets a genuine "the read has settled" signal instead of a best-effort guess.

### Added

- **The module's full internal-facing doc set** — [README](./README.md), [usage](./usage.md), [architecture](./architecture.md), [gotchas](./gotchas.md), and this changelog — alongside the module's already-corrected `foundation.md`.
- **The colocated `payment-details.feature`** — the module's 29-scenario capability contract, held to the same two-way traceability ratchet as the sibling `payment` module's (`payment-details.traceability.test.ts`): a scenario with neither a proving test nor a recorded deferral fails the suite, and a deferral that acquires a proof fails it too.
- **76 tests across `__tests__/`** — unit coverage for the mappers, the schemas, and the filter / state-flag utils, plus integration coverage for the machine, both PAY-context composables, and the plain stored-methods list — replaying fixtures captured from real staging by `pnpm fixtures:generate payment-details`.
- **Two tests pinning the keyed-listing behaviour** described in [gotchas.md](./gotchas.md#resolved-a-filtered-stored-method-listing-used-to-arrive-keyed-not-indexed): one `it.fails` receipt at the services layer stated the capability that was owed, and one ordinary green test asserted what the page got at the time. The fix above inverted both, as designed — the receipt now fails and was deleted, the page-side test now asserts the real 12-of-13 read.

### Changed — documentation corrections

- **This module is not actor-scoped.** No scope matrix, no `createScopedComposable`, no per-actor arms — `PaymentDetailsArgs.client` is a plain caller-supplied input. The doc set states this as the module's actual shape rather than assuming the platform's usual client/staff split applies here.
- **`PaymentType` carries four members, and `PAY_IN_FULL`'s wire value collides.** `PAY_IN_FULL = "stored-card"` — the same string as `PaymentMethodType.STORED_CARD` on the unrelated payment-method-type enum — and the enum's fourth member, `MANUAL_PAYMENT`, is now named.
- **`SelectPaymentMethodData` is documented as the seven-member union it is** (`StoredCardData`, `GatewayCardData`, `GatewayExternalCardData`, `GatewayData`, `GatewayMobileData`, `GatewayDirectDebitData`, `GatewayExternalStoreData`), not a single flat envelope with optional fields.
- **Set-default and toggle-auto-payment are documented as `PUT`.** The route refuses `PATCH` with `405` and names `GET, HEAD, PUT, DELETE` — captured live rather than assumed from the route's shape.
- **A cross-client read is documented as returning `404` ("Client not found!"), not `403`** — captured live rather than assumed.
- **The brand-gateway list is documented as ignoring `amount`.** A tiny-amount capture and a full-amount capture return identical rows.
- **The keyed-listing fix is documented as landed, not owed.** `mapPaymentDetails` reads a gap-keyed `data` object the same way it reads an array — see the Fixed entry above and [gotchas.md](./gotchas.md#resolved-a-filtered-stored-method-listing-used-to-arrive-keyed-not-indexed).
- **A fresh-gateway selection is documented as needing both halves** — `model.gateway_id` and the gateway's own capture bag. One without the other yields a payload naming no gateway, proven in `payment-details.mappers.test.ts`.
- **`orderId` and `orderStatus` are documented as the PAY-context minimum they are.** Both are typed optional on `PaymentDetailsArgs`, but PAY context never leaves its pre-flight check without both supplied.
- **`useCalculate`'s dedupe on equal values is documented as intended behaviour**, not a coverage gap — a test driving all three displayed amounts to the same value proves nothing about whether they stay independent of one another.

### Deferred

Seven of the module's 29 documented scenarios have no proving test yet, each blocked on a recording gap rather than on the code — a brand switch, a throwaway stored method to delete, or the OAuth refresh leg beside a recorded `401`:

- Removing a stored method
- Making a stored method the default (the `405` on `PATCH` is recorded; the `PUT` success isn't)
- Turning renewal charging (`auto_payment`) on or off for a stored method
- A brand that forces card storage on every payment
- A brand that forces `auto_payment: true` on every stored method
- The last-method protection when `allow_card_removal_replacement` is off
- The signed-out read (the `401` is recorded; replaying it needs the token-refresh leg recorded alongside it)

All seven are tracked on **FE-3130**. See [gotchas.md](./gotchas.md#whats-owed-not-yet-proven) for the full list with detail. Anything needing a real browser — the 3DS challenge, the tokenise handshake end to end, storing a card end to end, any off-site redirect — carries no scenario in this module's contract at all; that is e2e's surface, not a gap in this list.

## Migration Guide

No migrations. The Fixed entries above change the module's runtime behaviour (a filtered stored-card list, and `isReady()`'s settle order) but not its public surface — no signature, member, or meta-flag name changed. Everything else in this entry documents the module's existing behaviour and test coverage.
