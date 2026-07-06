# Changelog

All notable changes to the `account` module are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

- **Baseline documentation** for the `account` module — the post-auth standing arc (guest → unverified → verified).
  - `foundation.md` — framework-neutral platform spec (derived behavioural spec; gates the test campaign per ADR-021).
  - `README.md`, `architecture.md`, `usage.md`, `gotchas.md` — internal-facing docs.
- **Documented capabilities**: guest → full upgrade (`POST /clients/{id}/complete_registration`), guest order-receipt email autosave (`PUT /clients/{id}`), email verification by code (`POST /clients/verification_code/verify`), verification resend with cooldown (`POST /clients/resend_verification`), order-form custom fields (`GET /clients_fields?filter[show_on_order_form]=true`), and the client-record standing read (`GET /clients/{id}`).
- **Recorded fixtures** (staging captures): `get-clients-id` (200), `get-clients-id-case-unauthenticated` (401), `get-clients-fields-filter-show-on-order-form-true` (200), `post-clients-resend-verification` (409, already-verified), `post-clients-verification-code-verify` (204, no-op on verified account).

### Notes

- `useAccount` is the canonical `createScopedComposable` exemplar (design council FE-2945, 2026-06-25; reconciled in `docs/sdd/FE-2826/retro-rollout.md`).
- Several behaviours are flagged **⚠️ UNRATIFIED** in the docs pending reviewer ruling: the client-record read ownership, the standing State-model shape, the dead link-verify copy, the verify no-op semantics, and the unreachable `resolve()` action.

### Not captured (staging-mutating)

- `POST /clients/{id}/complete_registration` and `PUT /clients/{id}` response bodies — described from the type contract + code behaviour, not a fixture.
- `POST /clients/resend_verification` `200` happy path and the `4xx`-on-wrong-code verify path — not producible from an already-verified account.
