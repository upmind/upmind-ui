# Changelog

All notable changes to the `payment-gateways` module are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

This is `payment-gateways`' first documentation set and its first changelog. Nothing in the module's public surface changed to produce it — every entry below records what the module already does, now written down, tested, and — where a real gap was found — called out rather than assumed away.

### Added

- **The module's full doc set** — [foundation](./foundation.md), [README](../README.md), [usage](./usage.md), [architecture](./architecture.md), [gotchas](./gotchas.md), and this changelog.
- **349 tests across `__tests__/`** — unit coverage for the composable's actions and meta flags, the shared machine's structure and logic, the schema/model generation for every provider variant that overrides it, the currency/minor-unit conversion utils, and the payer-contact-detection helpers; integration coverage for all eight named providers' `load`/`render`/`validate`/`pay`/`add` behaviour against recorded fixtures. 86.2% statement and 89.8% function coverage.
- **The colocated `payment-gateways.feature`** — the module's 39-scenario capability contract across five groups (the shared lifecycle every gateway honours, paying, storing a method, the processing modes a gateway is driven by, and a gateway that cannot serve the request), held to the same two-way traceability ratchet as the sibling capture module's own feature: a scenario with neither a proving test nor a recorded deferral fails the suite, and a deferral that acquires a proof fails it too.
- **Recorded fixtures for six of the module's eight named providers** — the brand-gateway-list capture, the frontend-detail read, and the tokenize-begin/tokenize-end request-and-refusal shapes, at the one currency/country pair that unlocks each provider on the recording brand.

### Changed — documentation corrections

- **This module is not actor-scoped.** No scope matrix, no per-actor arms — the composable takes an already-spawned actor as a plain argument, and nothing about which client or order it acts against is decided inside this module.
- **`render()` is documented as resolving before its own draw completes**, not as a reliable "the form is mounted" signal — pinned by the module's own unit suite, which polls the gateway's state rather than trusting the promise. Tracked on **FE-3130**.
- **The gateway machine is documented as requiring a parent.** Reaching `available.valid` unconditionally notifies a parent; a parentless interpreter is documented as stalling there, not merely failing to notify anyone. Tracked on **FE-3130**.
- **Nicky is documented as unit-proven only**, with no recorded integration fixtures — a live sweep of 37 currency/country pairs on the recording brand found no combination that unlocks it. Tracked on **FE-3130**.
- **The currency/country unlock pair is documented for each of the five other custom providers** (Stripe/RazorPay on GBP/GB, Braintree on EUR/DE, OpenPay on MXN/MX, MercadoPago on COP/CO, dLocal on ARS/AR) — captured live rather than assumed representative of every combination a provider might ever be offered under.
- **The fixture generator's recording cost is documented explicitly** — every run mints six real, un-cleaned-up stored-method records on the recording client. Teardown is tracked on **FE-3130**.

### Deferred

One of the module's 39 documented scenarios has no proving test yet:

- A gateway whose charge minimum exceeds the amount reporting itself unavailable (AC-B8) — no recorded evidence pins a per-gateway minimum-charge check anywhere in the module today.

Tracked on **FE-3130**. See [gotchas.md](./gotchas.md#whats-owed-not-yet-proven) for detail. Anything needing a live provider SDK in a real browser — the hosted-form draw itself, an off-site hand-off and return, a provider-side challenge — carries no scenario in this module's own contract at all; that is e2e's surface, not a gap in this list.

## Migration Guide

No migrations. This entry documents the module's existing behaviour, its test coverage, and the corrections above — nothing here changes the module's public surface.
