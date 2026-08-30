# Changelog

All notable changes to the `payment-details` module are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

This is `payment-details`' first documentation set and its first changelog. Nothing in the module's public surface changed to produce it — every entry below records what the module already does, now written down, tested, and — where a real defect was found — called out rather than assumed away.

### Added

- **The module's full internal-facing doc set** — [README](./README.md), [usage](./usage.md), [architecture](./architecture.md), [gotchas](./gotchas.md), and this changelog — alongside the module's already-corrected `foundation.md`.
- **The colocated `payment-details.feature`** — the module's 29-scenario capability contract, held to the same two-way traceability ratchet as the sibling `payment` module's (`payment-details.traceability.test.ts`): a scenario with neither a proving test nor a recorded deferral fails the suite, and a deferral that acquires a proof fails it too.
- **76 tests across `__tests__/`** — unit coverage for the mappers, the schemas, and the filter / state-flag utils, plus integration coverage for the machine, both PAY-context composables, and the plain stored-methods list — replaying fixtures captured from real staging by `pnpm fixtures:generate payment-details`.
- **Two tests pinning the keyed-listing defect** described in [gotchas.md](./gotchas.md#open-defect-a-filtered-stored-method-listing-arrives-keyed-not-indexed-): one `it.fails` receipt at the services layer stating the capability that is owed, and one ordinary green test asserting what the page gets today. A fix flips both — the receipt starts failing, the page-side assertion goes red — so neither can rot unnoticed.

### Changed — documentation corrections

- **This module is not actor-scoped.** No scope matrix, no `createScopedComposable`, no per-actor arms — `PaymentDetailsArgs.client` is a plain caller-supplied input. The doc set states this as the module's actual shape rather than assuming the platform's usual client/staff split applies here.
- **`PaymentType` carries four members, and `PAY_IN_FULL`'s wire value collides.** `PAY_IN_FULL = "stored-card"` — the same string as `PaymentMethodType.STORED_CARD` on the unrelated payment-method-type enum — and the enum's fourth member, `MANUAL_PAYMENT`, is now named.
- **`SelectPaymentMethodData` is documented as the seven-member union it is** (`StoredCardData`, `GatewayCardData`, `GatewayExternalCardData`, `GatewayData`, `GatewayMobileData`, `GatewayDirectDebitData`, `GatewayExternalStoreData`), not a single flat envelope with optional fields.
- **Set-default and toggle-auto-payment are documented as `PUT`.** The route refuses `PATCH` with `405` and names `GET, HEAD, PUT, DELETE` — captured live rather than assumed from the route's shape.
- **A cross-client read is documented as returning `404` ("Client not found!"), not `403`** — captured live rather than assumed.
- **The brand-gateway list is documented as ignoring `amount`.** A tiny-amount capture and a full-amount capture return identical rows.
- **The keyed-listing defect is documented as current behaviour, not a hypothetical.** `mapPaymentDetails`' `isArray(raw) ? raw : [raw]` collapses a real, gap-keyed 13-record capture to one blank record — pinned by the two tests above and tracked on **FE-3130**, rather than left as an assumed-working code path.
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

No migrations. This entry documents the module's existing behaviour, its test coverage, and the corrections above — nothing here changes the module's public surface.
