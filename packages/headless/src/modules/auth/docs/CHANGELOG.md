# Changelog

All notable changes to the auth module are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/); the module versions with the `@upmind-automation/headless` package.

## [Session-held sign-in] - 2026-09-26

### Changed

- **`resolve()` for login, 2FA and register** — settles only after the session store promotes the session, so `true` means the active session holds the signed-in user. Before, `true` arrived with the token, while the visitor was still a guest.
- **`resolve()` can reject** — when the token is issued but the user load fails, the promise rejects. Before, it resolved `true`. Recover never waits and never rejects on this path.

### Added

- **`readReturnTarget(query)`** — the `returnUrl` query as a normalised same-origin path, or `undefined` when it is absent or refused.
- **`hasReturnTarget(query)`** — whether the query names a `returnUrl` at all, accepted or refused.
- **`registerAuthFlows(router, { fallback })`** — sends a signed-in visitor on a route with `meta.authReturnTarget` to its return target, else to the fallback.
- **`AUTH_QUERY.RETURN_REFUSED`** — the query key that tells the fallback route a target was refused.
- **`AuthFlowOptions`** type.

### Notes

- The return-target helpers moved into this module from the auth UI package. Their behaviour is unchanged. Import them from `@upmind-automation/headless`.

## [Unreleased] — migration baseline (FE-2826 / FE-2774)

Baseline entry for the module as it exists after the @next structure adoption + hotfix transplant. Later entries describe changes against this state.

### Added

- Scoped composable `useAuth().as(actor)` with the four-layer return (`useActions` / `useContext` / `useMeta` / `useInternals`) and per-actor services (client / guest / staff) behind a single flow machine.
- Two-step guest-customer registration (`registerAsGuest`): `POST clients/register/guest` → `guest_customer` grant, gated by the non-bypassable `canRegisterAsGuest` machine guard (brand config `GUEST_CHECKOUT_ENABLED`).
- Link-based email verification (`useVerifyEmail` → `PATCH clients/{clientId}/emails/{emailId}/check_verify` with `{ reg_hash }`), session-agnostic, with pre-HTTP rejection of missing link params.
- `onError` settlement callback alongside `onDone`, so unattended flows (e.g. the boot-time guest mint) never hang on a failed attempt.
- Register form schema exports (`useRegisterSchema` / `useRegisterUischema`) reused by the `account` module's guest-upgrade form.
- Co-located wire recordings under `__tests__/fixtures/` (ADR-025): oauth password/guest/refresh grants, bad-password 401, malformed 400, register 200/422/401. 2FA-grant recordings pending FE-2788.
- Documentation suite (`docs/`): foundation (platform reference), README, architecture, usage, gotchas, this changelog.

### Changed

- Auth is now credential exchange only: token persistence/lifecycle moved to `session-store`, post-auth account standing (guest → unverified → verified) to `account` (per FE-2945 three-peer split). Tokens are persisted by services via session-store's `persistTokenToStorage`; the machine's `authenticated` state is `type: "final"`.

### Removed

- The @next `register.confirming` manual-`CONFIRM` no-op state and `requiresConfirmation` guard (an unenforcing verification trap — FE-2826 §4a).
- The guest-service registration rejection: guest scope now routes registration through the transplanted guest-customer path instead of throwing.

### Migration Guide

#### From `useSession` (legacy) to `useAuth`

1. **Credential flows** (`login`, `register`, `recover`, 2FA) → `useAuth().as("client")` actions (`start`, `resolve`, `set`, `reject`).
2. **Identity / "who is logged in"** (`user`, `isAuthenticated` as session fact) → `useActiveSession()` (session-store), not auth.
3. **Standing flags** (`isUnverified`, `isGuestClient`, verify-email / guest-upgrade forms) → `useAccount()` (account module).
4. `isGuest` is never read from auth mappers — read `activeUser.isGuest` from the session layer.
