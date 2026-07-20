# Auth Module Gotchas

Edge cases and behaviours that surprise people. Written for developers wiring auth into UI and for testers designing scenarios — every gotcha carries a testable expected-behaviour statement (these are the behavioural spec for test authoring per ADR-021).

> 2FA wire fixtures are not yet captured (pending FE-2788). The 2FA behaviours below are documented from the FE-2826 spec (`docs/plans/FE-2826.md`) and `tests/features/login-registration/two-factor-login.feature` — treat them as the spec even though no recording backs them yet.

## 1. A successful password grant is not necessarily a login (2FA)

**Problem:** When an account has 2FA enabled, the credentials call returns `200` with a _token_ — but it's an interim challenge token (`actor_type: "twofa"`, `twofa_provider` set), not a session. Code that treats any resolved login as authenticated stores a challenge token as a session.

```typescript
// ❌ wrong — assumes resolve() success/failure is the whole story
await actions.resolve({ username, password });
redirectToDashboard();

// ✅ right — branch on the meta flags
const ok = await actions.resolve({ username, password });
if (ok) redirectToDashboard();
else if (is2faRequired.value) showCodeInput();
else showError(errors.value);
```

> **🧪 For Testers:** A 2FA-enabled customer entering valid credentials is prompted for a verification code and is not yet logged in — no authenticated session exists until the correct code is accepted. A customer without 2FA is logged in immediately with no verification step.

## 2. Failed email-2FA codes are cleared; cancel restores your credentials

**Problem:** Two subtle 2FA-challenge behaviours: (a) when the provider is **Email** and the code is rejected, the entered code is wiped from the model (the emailed code must be re-requested/re-entered — a stale one won't be silently retried); (b) `reject()`/CANCEL from the challenge restores the pre-challenge model snapshot, so the login form comes back with the credentials the user already typed.

> **🧪 For Testers:** Entering an incorrect 2FA code shows an error and keeps the user on the verification step, not logged in; with email-delivered codes the rejected code does not remain pre-filled. Cancelling the 2FA challenge returns to the login form with the previously-entered username intact and no error banner.

## 3. Registration is two wire calls — success can split

**Problem:** `POST clients/register` creates the account but returns **no token**; the module immediately chains a password-grant login. If the second call fails (rate limit, network), the account exists but the user is not logged in — and re-submitting the form now fails with a duplicate-email error keyed under `username`.

> **🧪 For Testers:** Registering with a fresh email both creates the account and signs the user in. Registering with an email that already has an account surfaces a field-level "already in use" error on the email field and does not authenticate. (Validation errors for the email arrive keyed as `username` — assert on the rendered field, not the raw key.)

## 4. Guest tokens are not "authenticated"

**Problem:** The session check counts only client/staff sessions. A visitor holding a guest token is still treated as unauthenticated by auth — the machine proceeds to the login flow rather than short-circuiting to `authenticated`. Don't gate "is logged in" UI on the mere existence of a token.

> **🧪 For Testers:** A visitor with a guest session opening the login page still sees the login form (they are not "already logged in"). After a real client login, revisiting the auth flow short-circuits — the form never shows and the flow reports authenticated.

## 5. The guest-checkout gate is a machine guard, not an API rule

**Problem:** `registerAsGuest()` is gated by the `canRegisterAsGuest` guard reading brand config `GUEST_CHECKOUT_ENABLED`. When the guard blocks, the `GUEST` event is simply ignored — the machine stays where it is and `registerAsGuest()` resolves `false`. Two traps: (a) nothing throws, so silent `false` must be handled; (b) the platform does **not** enforce the toggle — a direct service call would bypass it, which is why routing through the machine is mandatory (the transition is the enforcement point).

> **🧪 For Testers:** On a brand with guest checkout enabled, the register page offers guest checkout; choosing it signs the visitor in as a guest client whose account menu identifies them as a guest with an upgrade prompt. On a brand with it disabled, no guest option is offered. Guest checkout is also not offered when the basket contains a subscription product. (From `guest-checkout.feature`.)

## 6. Guest-customers look like clients — only the identity record says otherwise

**Problem:** The two-step guest registration mints a token that acts as a client; the token itself carries nothing that says "guest". The discriminator is `is_guest: true` on the session user (mapped by session-store from `/self`). Branching on token fields misroutes guest-customers after a reload.

```typescript
// ❌ wrong
if (token.actor_type === "guest") showGuestBanner();

// ✅ right — read the mapped session user
const { activeUser } = useActiveSession().useContext();
if (activeUser.value?.isGuest) showGuestBanner();
```

> **🧪 For Testers:** After guest checkout, a page reload keeps the visitor recognised as a guest client (guest banner + upgrade prompt persist) — observed session-mapping contract. After completing the upgrade registration, the guest prompt disappears and they are a fully registered client (from `guest-checkout.feature`).

## 7. `authenticated` is final — instances don't come back

**Problem:** The auth machine terminates once authenticated. The composable instance is then inert: you cannot drive a second login through it. Fresh flows need a fresh instance — which is why logout auto-destroys cached instances (session-store `onLogout`), and why `destroy()` on unmount matters for flow components. Related invariant: `authenticated` must stay `type: "final"` — session-store's boot-time guest mint resolves via `onDone`, which only fires on final states.

> **🧪 For Testers:** Log in, log out, then log in again — the second login must work end-to-end. Expected behaviour: logout returns the user to an unauthenticated state from which a fresh login succeeds.

## 8. `onDone` never fires on failure

**Problem:** `onDone` only fires when the machine reaches `authenticated`. An unattended caller awaiting `onDone` alone hangs forever on a failed attempt (this bit the boot-time guest mint historically). `onError` exists precisely to pair with it — it fires at most once when the attempt settles in any failure state.

> **🧪 For Testers:** A failed login attempt settles — the UI leaves its spinner state and surfaces an error (`hasErrors`), rather than loading indefinitely.

## 9. Token refresh is not this module's job — but its edges leak in

**Problem:** The `refresh_token` grant is documented here (it's a grant on the token endpoint), and the fixture set includes a refresh recording — but scheduling refreshes, replacing the stored pair, and expiry math belong to session-store. Edges worth knowing: `expires_in` is relative seconds captured at mint time (observed values drift, e.g. 3599 vs 3600 — never compare for equality); a refresh returns a **new pair**, and the old refresh token should be considered spent; `TOKEN_EXPIRING`/`REFRESH` exist in the event type union but the auth machine has no handlers for them — sending them is a no-op.

> **🧪 For Testers:** A session whose access token expires is refreshed transparently while the refresh token is still valid — the user stays signed in without re-entering credentials. When both tokens are expired, the user is treated as signed out and must log in again.

## 10. Too many failures parks the whole surface

**Problem:** Repeated failed attempts hit the platform's rate limit (`429`). The machine routes to a global `error` state and only re-enters `checking` after a timed delay — during that window login, register, _and_ recover are all unavailable, not just the form that caused it.

> **🧪 For Testers:** After repeated rapid failed logins, further attempts are rejected with a rate-limit error; the auth forms recover on their own after a wait, without a page reload.

## 11. Staff scope has a narrower surface

**Problem:** `useAuth().as("staff")` exposes only login (+2FA via the `twofa-admin` grant) through `start()`. Register and recover services exist for staff (org registration, admin password reset) but `start("register" | "recover")` is a client-only signature — the staff action set doesn't offer flow selection. Impersonation (`.as("staff").for("client", id)`) mints a client-scoped token via the admin path and registers the impersonation with session-store; `canRegister`/`canRecover` are `false` whenever a `scopeContext` is set.

> **🧪 For Testers:** A staff instance never shows register or recover forms. When staff impersonate a client, the resulting session acts as that client and is tracked as an impersonated session.
