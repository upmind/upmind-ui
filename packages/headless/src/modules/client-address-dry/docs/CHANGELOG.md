# Changelog

All notable changes to the `client-address-dry` module are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/); the module versions with the `@upmind-automation/headless` package.

## [Unreleased] — factory smoke-test baseline

Baseline entry for the module as a build-process smoke test, built side-by-side with the existing `client-address/` module (untouched).

### Added

- Scoped composable `useClientAddressesDry().as(actor).for('client', id).inBrand(brand)` with the four-layer return (`useContext` / `useMeta` / `useActions` / `useInternals`), query-variant (TanStack Query, no state machine).
- **Client (self) path:** list/create/update/delete/set-default against the client's own address list, with address `type` restored as a required field and the delete-eligibility flag enforced client-side before a delete is ever sent.
- **Staff admin path** (`.as('staff').for('client', id)`): reads and writes retargeted to the legacy admin endpoint, authenticated with the staff session's own token, selected explicitly rather than via the active-session default — a genuine per-client retarget, proven at the outbound-request level (both URL and bearer token), not just the response shape.
- **Staff acting as a client (impersonation):** a staff member impersonating a client reaches the exact same client path a client uses for themself, authenticated with that impersonation session's own token — proven to never fall back to the admin path or the staff member's own token.
- Staff permission gating on writes (`add`/`update`/`setDefault`/`remove`/`ensure`/`refresh`), each `undefined` when the acting staff session lacks the matching permission code.
- Staff permission read-state: four readable flags (`canList`/`canCreate`/`canUpdate`/`canDelete`) exposed alongside the collection, computed from the exact same source that gates the corresponding action — proven, for a single session, to always agree with the matching action's availability. Not present (reads `undefined`) for a client acting on their own addresses.
- Region requirement is driven by a brand-level configuration option shared across every actor, not by who is submitting the form.
- Read parity for records that arrived through a bulk import: every list read requests they be included, and once included they are returned with no special handling.
- A brand-country default seed for a new address, bounded to the session's single active brand.
- Colocated negative-control fixtures (`__tests__/*.must-fail.patch`) covering the retarget URL, token selection (both the admin path and the impersonation path), the permission gate, and the permission read-state's exclusivity from a client actor.
- Documentation suite (`docs/`): this changelog, README, foundation, architecture, usage, gotchas.

### Known limitations

- **Staff writes are delivered-conditional, not unconditionally usable today.** `add`/`update`/`setDefault`/`remove`/`ensure`/`refresh` on the staff scope, and all four staff permission flags, are gated on a field the session store does not yet carry through to a staff session's mapped profile. **On today's unmodified session every staff session resolves all four permission codes to absent, so every staff write is gated off and every permission flag reads `false`.** Staff reads (the retargeted list) are unaffected. Real follow-up: extend the session store's mapped staff-user profile to carry this field through — a sibling-module change outside this module's own scope, recommended but not made here. See [gotchas.md](./gotchas.md) §1.
- **`.inBrand(id)` cannot resolve a brand other than the session's own active one** — no by-id brand lookup exists anywhere in headless today. See [gotchas.md](./gotchas.md) §3.
- **This module has no consumer anywhere in the codebase.** It is a parallel build validating a build process, not a replacement for `client-address/` — promoting it over the existing module is a separate, not-yet-made decision.
- **A staff member managing their own addresses (as opposed to a named client's) is not built.** Only the three actor/context combinations above are covered.

---

## Migration Guide

### From `client-address/`

> No migration is defined. This module is a parallel factory build, not a drop-in replacement for `client-address/` — promoting it (and, if that happens, migrating existing `client-address/` consumers to it) is a separate decision that has not been made. `client-address/` remains untouched and is the module other code in this repo consumes today.
