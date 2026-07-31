# Changelog

All notable changes to the `client-phone-dry` module are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/); the module versions with the `@upmind-automation/headless` package.

## [Unreleased] — factory smoke-test baseline (`docs/sdd/client-phone-dry-smoke`)

Baseline entry for the module as a `/scoped-composable-factory` smoke test, built side-by-side with the existing `client-phone/` module (untouched). Verifier verdict: **PRESENT (conditional)** — see Known limitations below and `docs/sdd/client-phone-dry-smoke/evidence/verify.md`.

### Added

- Scoped composable `useClientPhonesDry().as(actor).for('client', id).inBrand(brand)` with the four-layer return (`useContext` / `useMeta` / `useActions` / `useInternals`), query-variant (TanStack Query, no state machine).
- **Cell A** (`.as('self')`): list/create/update/delete/set-default against the client's own phone list, with phone `type` restored as a required field (D2) and the `can_delete` flag honoured on delete.
- **Cell B** (`.as('staff').for('client', id)`): reads and writes retargeted to the legacy admin endpoint (`admin/clients/{id}/phones`), authenticated with the staff session's own token, selected explicitly rather than via the active-session default — a genuine `.for('client', id)` retarget (A7-verified), not the `client-email` pilot's dropped one.
- Staff capability gating on writes (`add`/`update`/`setDefault`/`remove`/`ensure`/`refresh`), each `undefined` when the acting staff session lacks the matching capability code.
- Staged-import read parity (D4): list reads include staged rows (`with_staged_imports=1`), each surfaced via `meta.isStaged`, with edit/set-default/delete locked on any such row until reconciled — shared identically across both cells; no staged-import authoring in scope.
- Brand-country default seed for a new phone (D3), bounded to the session's single active brand.
- Five colocated negative-control fixtures (`__tests__/*.must-fail.patch`) — one per guard (URL retarget, token selection, capability gate, `can_delete`, staged-import lockout).
- Documentation suite (`docs/`): this changelog, README, foundation, architecture, usage, gotchas.

### Known limitations

- **Staff writes are delivered-conditional, not unconditionally shipped.** `add`/`update`/`setDefault`/`remove`/`ensure`/`refresh` on the staff scope are gated on a `functionalities` field that `session-store`'s mapped session user does not yet carry from `/admin/self`. **On today's unmodified prod path every staff session resolves zero capabilities, so every staff write is gated off.** Staff reads (the retargeted list) are unaffected. Real follow-up: extend `session-store`'s `SessionUser`/`mapSessionUser` to carry `functionalities` — a sibling-module change outside this module's file grant, recommended but not filed as a tracked issue by this smoke test (external side effect requiring approval). See `evidence/operator-ruling-functionalities-waiver.md` and [gotchas.md](./gotchas.md) §1.
- **`.inBrand(id)` cannot resolve a brand other than the session's own active one** — no by-id brand lookup exists anywhere in headless today. See [gotchas.md](./gotchas.md) §2.
- **No captured wire recordings back this module's own endpoints yet** — sample bodies in the docs are sourced from the test suite's own hand-authored mocks. See [gotchas.md](./gotchas.md) §3.
- **This module has no consumer anywhere in the codebase.** It is a parallel build validating the factory process, not a replacement for `client-phone/` — promoting it over the existing module is a separate, not-yet-made decision.

### Repair cycle 1

- Closed a fail-open capability hole: the staff arm's `ensure()` (find-or-create) is now gated on `create_client_phone` identically to `add` — previously it fell through to the shared, ungated find-or-create, which would have let a staff session without the capability create a phone via `ensure({not-in-list})`.
- Authored the five `.must-fail.patch` negative controls and proved each apply → RED-for-the-stated-reason → revert → green.

---

## Migration Guide

### From `client-phone/`

> No migration is defined. This module is a parallel factory build, not a drop-in replacement for `client-phone/` — promoting it (and, if that happens, migrating existing `client-phone/` consumers to it) is a separate decision that has not been made. `client-phone/` remains untouched and is the module other code in this repo consumes today.
