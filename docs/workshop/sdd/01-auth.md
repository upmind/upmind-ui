# SDD 01 — Auth (register + login)

## Goal

At the end of this feature, a fresh visitor (already carrying a guest bearer minted by feature 0) can register with an email + password and end up authenticated; a returning client can log in with the same credentials and end up authenticated; the foundations layer's auth-header slot promotes from the guest token to the client token so every subsequent feature can call authenticated endpoints (`/self`, basket, panel, payment) without re-implementing auth. The system knows the authenticated client's identity — id, email, full name, language, default account currency — and the UI confirms it on screen. Logout reverts the auth-header slot back to the guest token without re-minting.

## Depends on

- **Feature 0 (Project scaffold)** — foundations layer must exist, with the **guest token already minted and wired to the auth-header slot**. Feature 0 owns the guest mint (transport-layer concern); this feature layers client-auth on top. The `{ auth: false }` opt-out remains available for the refresh-grant call wired here.

## Modules consumed

- `session` — see [02-module-foundations/session.md](../02-module-foundations/session.md). Owns token issuance, refresh, registration, `/self`. This SDD wires capabilities **2, 3, 5, 8** (read identity, password grant, register, refresh). **Capability 1 (guest mint) is wired by feature 0**; this feature assumes a guest token already lives in storage.
- `client` — see [02-module-foundations/client.md](../02-module-foundations/client.md). The `actor` block inside `/self` is the identity shape the UI binds to. Sub-records (addresses, phones, emails, companies, custom-field catalogue) are out of scope for THIS feature — they land in features 5 + 7.

## Reads (before generating any code)

- `06-initiator/generic.md` — sections 4 (Staging environment — Host = brand domain), 9 (Validation checklist — auth items), 10 (Operating principles 1, 3, 4, 6)
- `03-foundations-chapter.md` — full chapter, particularly §2 (Auth lifecycle), §4 (Error model), §2.5 (in-flight 401 hold + replay), §2.7 (logout)
- `02-module-foundations/session.md` — full, especially Operations 1–8, the Password-login + Registration flows, and every Lesson
- `02-module-foundations/client.md` — the `actor` block on `/self`; the address/phone/email/company sub-records are out of scope for this feature

## What this feature does

1. **Precondition check.** Confirm a guest token already lives in the storage chosen in cluster 4 — feature 0 mints it at app start. If it does not, the foundations layer is incomplete; stop and finish feature 0 before continuing. Do **not** re-mint here; the guest mint is feature 0's responsibility.
2. Expose two entry points in the UI: `/register` and `/login`. Both are reachable from a header "Sign in" affordance; both render against the guest bearer already wired by feature 0.
3. **Register flow** — collect `email`, `password`, `firstname`, `lastname` from the form. `POST /clients/register` signs with the guest bearer (foundations layer auto-attaches); the body carries the registration model plus `recaptcha_token` only if the brand requires it (skip recaptcha for the prototype unless the brand rejects without it). Custom fields (`GET /clients_fields?filter[show_on_order_form]=true`) are NOT collected in this feature — leave the array empty. The response is a minimal client record `{ id, public_name, org_id, image_url }`, not a token.
4. Immediately follow with `POST /oauth/access_token` with `grant_type: "password"`, `username: <email>`, `password: <password>`. Still signed with the guest bearer (foundations layer attaches whatever's in storage; the platform accepts it). Response is a full client `Token` — `access_token`, `refresh_token`, `actor_type: "client"`. Persist the client token **alongside** the guest token; do not overwrite (see session.md lesson "guest + client coexist").
5. **Login flow** — collect `email`, `password`. Single `POST /oauth/access_token` with `grant_type: "password"`. Same response shape. Same persistence rule.
6. After either flow lands a client token, `GET /self?with=actor,accounts` to load identity. Render `actor.firstname`, `actor.fullname`, `actor.email`, and the default `accounts[0].currency.code` on a "you're signed in" confirmation screen.
7. If `POST /oauth/access_token` returns `second_factor_required: true` (interim token, `actor_type: "twofa"`), surface a non-blocking message: "2FA not supported in the prototype — disable 2FA on the account or use a non-2FA login". Log the response. Do **not** attempt the `grant_type: "twofa"` exchange.
8. Expose a "Log out" action. Implementation per foundations.md §2.7: cancel in-flight requests bound to the client token, drop the client token from storage, keep the previously-minted guest token in storage so subsequent reads still work, invalidate any cached `/self` data, return the UI to the anonymous state.
9. Wire the `/oauth/access_token` `grant_type: "refresh_token"` exchange into the foundations layer's 401-refresh path (stubbed in feature 0). When `/self` or any subsequent call returns 401 with a valid refresh token in storage, the foundations layer trades it for a fresh access + refresh token and replays the original request. Multiple parallel 401s coalesce to one refresh (foundations.md §2.5).
10. Hand the identity off to the rest of the app via a single source-of-truth store (the shape chosen in cluster 4, q26 / q27). Subsequent features read identity from this store — they do not re-call `/self`.

## State model

The auth state the UI binds to, scoped to this feature:

```text
anonymous       → (mint guest) → anonymous (with guest token)
anonymous       → (submit register form)   → registering   → authenticated
anonymous       → (submit login form)      → authenticating → authenticated
authenticated   → (401 on any call)        → refreshing    → authenticated  // hold + replay
refreshing      → (refresh fails)          → anonymous     // hard sign-out
authenticated   → (user clicks Log out)    → anonymous
any             → (network / 5xx on auth call) → anonymous (with error surfaced)
```

The `registering` and `authenticating` states each carry a `pending` flag and an optional `error: AppError`. The `authenticated` state carries the `Self` payload.

## Data shapes (feature-scoped)

These are what THIS feature stores, sends, and exposes. The platform shapes (`Token`, `Self`, `Actor`, `Account`) live in session.md / client.md — do not redefine them here.

```ts
// What the foundations layer's auth-header slot reads on every request.
// Both tokens live in storage simultaneously after login; logout drops the client one
// and keeps the guest one. See session.md "guest + client coexist" lesson.
type TokenStore = {
  guest: Token | null;     // minted on first paint, retained across login
  client: Token | null;    // populated after register or login; dropped on logout
  active: "guest" | "client";  // which one the auth header attaches; flips on login / logout
};

// Register form payload — what the UI collects.
// Mapped to session.md RegisterBody before POST /clients/register.
type RegisterFormPayload = {
  email: string;
  password: string;
  firstname: string;
  lastname: string;
  // custom_fields, phone, recaptcha_token, referral_cookie, tracking, currency_id
  // are out of scope for this feature — see session.md RegisterBody for the full set.
};

// Login form payload — what the UI collects.
type LoginFormPayload = {
  email: string;     // sent as `username` on the wire
  password: string;
};

// The view-model the UI binds to.
type AuthViewModel = {
  status: "anonymous" | "registering" | "authenticating" | "refreshing" | "authenticated";
  identity: Self | null;       // populated when status === "authenticated"
  error: AppError | null;      // surfaced field-by-field when category === "validation"
};
```

## API calls (in execution order)

> **Guest bootstrap is feature 0's responsibility.** This feature assumes a guest token already lives in storage and is attached by the foundations layer's auth-header slot. The mint call (`POST /oauth/access_token` with `grant_type: "guest"`) does **not** appear in this feature's API calls — see [`00-scaffold.md`](./00-scaffold.md) step 8.

| Step | Method | Endpoint | Purpose | Fixture |
| --- | --- | --- | --- | --- |
| **Register flow** | | | | |
| 1 | POST | `/clients/register` (guest bearer attached) | Create the client record (returns `{ id, public_name, org_id, image_url }`, **not a token**) | `07-references/recordings/post-clients-register.json` |
| 2 | POST | `/oauth/access_token` `{ grant_type: "password", username, password }` | Exchange credentials for a client token | `07-references/recordings/post--oauth-access_token-client.json` |
| 3 | GET | `/self?with=actor,accounts` | Load the authenticated identity | `07-references/recordings/get-self.json` |
| **Login flow** | | | | |
| 1 | POST | `/oauth/access_token` `{ grant_type: "password", username, password }` | Same as register step 2 — password grant for an existing client | `07-references/recordings/post--oauth-access_token-client.json` |
| 2 | GET | `/self?with=actor,accounts` | Same as register step 3 | `07-references/recordings/get-self.json` |
| **Refresh flow (silent, triggered by 401)** | | | | |
| 1 | POST | `/oauth/access_token` `{ grant_type: "refresh_token", refresh_token }` | Trade the refresh token for a new access + refresh token (rotation) | `07-references/recordings/post--oauth-access_token.json` (refresh-grant variant) |
| **2FA detection (out of scope — log + surface)** | | | | |
| 1 | — | — | If `POST /oauth/access_token` returns `second_factor_required: true`, do not call `grant_type: "twofa"` | `07-references/recordings/post--oauth-access_token-twofa.json` (interim-token shape for reference only) |

## Edge cases

- **`/self` returns 401** — the foundations layer's 401-refresh path triggers a single refresh exchange, replays the `/self` call with the new bearer. Multiple parallel 401s coalesce to one refresh (foundations.md §2.5).
- **Guest token expires mid-session (or between visits).** Guest tokens carry `expires_in: 3600` — one hour. A returning visitor whose guest token lapsed between sessions hits 401 on first paint. The foundations layer's 401-refresh path must **re-mint** a fresh guest via `POST /oauth/access_token` `{ grant_type: "guest" }` rather than treating it as a sign-out (there's no client to sign out — the visitor never logged in). Feature 1 doesn't initiate the re-mint itself, but the *recovery path* the foundations layer runs reads the active-actor flag from the token store: actor = `guest` and 401 → re-mint; actor = `client` and 401 → refresh client token, fall back to existing guest, prompt sign-in. See foundations.md §2.4. Verify on first paint after manually expiring the stored guest token: the network panel should show a fresh `grant_type: "guest"` mint followed by a replay of the originally-401-ing request.
- **Refresh fails (refresh token rotated by another tab, or refresh-token expired)** — foundations layer clears the client token, returns the UI to `anonymous`, surfaces a "session expired, please sign in again" message. Do not retry.
- **2FA challenge response** — `actor_type: "twofa"`, `second_factor_required: true`. Log it, surface "2FA not supported in the prototype", stay on the login screen. Do NOT call `grant_type: "twofa"`.
- **Register with an email that already exists** — surface the auth error from the foundations layer's `AppError`. Field-level errors (`error.data` keyed by `email` / `username`) attach to the right input per foundations.md §4.3.
- **Wrong password on login** — `401` with `error.message: "The user credentials were incorrect."` Surface inline. By design, the platform does not distinguish "wrong password" from "no such account" (session.md lesson) — do not try to enumerate.
- **Rate-limited on repeated login failures** — `429` with `error.message: "Too many login attempts"`. Surface a backoff message. `error.id` may be `null` on this variant.
- **Network failure mid-register** — `POST /clients/register` is NOT idempotent. Disable the submit button while the request is in flight; if the request errors with no response, show a retry affordance but warn the user that the account may already exist — they can attempt login before re-registering.
- **Token expiry mid-flight on a slow request** — the foundations layer's hold+replay handles it transparently. User does not see a 401 (foundations.md §2.5).
- **Logout with in-flight requests** — abort the requests bound to the client token, do not let their responses populate any store after logout.
- **Guest token does NOT authorise `/self`** — a guest bearer returns an unauthorised response against `/self`. The UI binds `status === "authenticated"` to the presence of a client token, not the existence of any token.

## Validation checklist

- [ ] **Precondition (verifies feature 0):** a guest token is in storage on `/register` and `/login` first paint. Network panel shows the previously-emitted `POST /oauth/access_token` `{ grant_type: "guest" }` (from feature 0) and **no** new mint when this feature loads. If a fresh mint fires here, feature 0 is wrong — fix it there.
- [ ] `/register` form submits with a fresh email + valid password → `POST /clients/register` (carrying the guest bearer) succeeds → `POST /oauth/access_token` succeeds → `GET /self` returns the new client identity → UI shows `actor.fullname` + `accounts[0].currency.code`.
- [ ] `/login` form submits for a known-good account → same `/self` confirmation; no second guest mint between login and `/self`.
- [ ] Wrong password on `/login` → 401 surfaces as a field-level error from the foundations layer's `AppError`; no auto-retry; the form remains usable.
- [ ] Register with an already-registered email → the field-level error surfaces inline against `email` (or `username`); no duplicate `POST /clients/register` fires.
- [ ] Log out clears the client token from storage and returns the UI to `anonymous`; the guest token remains in storage; the next anonymous read (e.g. brand bootstrap in feature 2) succeeds without minting a new guest.
- [ ] Token expiry mid-flight: forge an expired access token, fire a `GET /self`, observe one refresh exchange + the original `/self` replays with the new bearer. The UI never shows a 401.
- [ ] No second `POST /oauth/access_token` (refresh grant) when two requests 401 in parallel — refresh coalesces (foundations.md §2.5).
- [ ] 2FA-enabled account login → response carries `second_factor_required: true` → UI shows "2FA not supported in the prototype"; no `grant_type: "twofa"` call is made.
- [ ] Every authenticated request (every call once the client token is in storage) carries `Authorization: Bearer <client.access_token>`. The guest mint and the refresh exchange are the only auth-bypassed calls.

## Notes for the agent

- **Every form input gets the right `autocomplete` attribute.** Per initiator operating principle 12, password managers and accessibility tools depend on the HTML5 `autocomplete` tokens, not on `name` / `id` / `placeholder`. Concretely for this feature:
  - **Login form:** email/username input → `autocomplete="username"`; password input → `autocomplete="current-password"`.
  - **Register form:** email → `autocomplete="email"` (plus `username` if it doubles as login); first name → `autocomplete="given-name"`; last name → `autocomplete="family-name"`; password → `autocomplete="new-password"` (NOT `current-password` — the manager prompts to save).
  - **Never set `autocomplete="off"`** on the password field; browsers ignore it and password managers break. If the team's framework / UI kit defaults to `off`, override.
  - Verify by opening the form in a Chrome / Safari profile with a password manager installed — the save prompt should appear after a successful submit, and the autofill prompt should appear on subsequent visits.
- **Host = brand domain, always.** Every request goes to `${api_base}` for the path, but the browser tab is on `<brand_domain>` so `Host` and `Origin` resolve correctly. See initiator section 4 + operating principle #6.
- **Guest token mint is NOT this feature's responsibility.** It happens in feature 0's foundations layer at app start, silently. Do not surface "browsing as guest" / "browsing as client" — both are just states of the same visitor.
- **Two tokens coexist after login.** Persist the guest token alongside the client token so logout can revert to the guest state without re-minting (foundations.md §2.7 + session.md lesson "guest + client coexist").
- **`POST /clients/register` returns no token.** Always follow with the credentials exchange and then `/self`. Treating the register response as auth-complete leaves the visitor unauthenticated.
- **`POST /clients/register` is NOT idempotent.** Disable submit while in flight; on network errors, prompt the user to try login before re-registering.
- **2FA is out of scope for this feature.** Detect the interim token, log it, surface "not supported" — do not call `grant_type: "twofa"`. The interim token authorises only the 2FA exchange call; trying it against `/self` returns 401.
- **Password recovery is out of scope for this feature.** The `POST /clients/password_reset` capability exists in session.md (operation 6); not built in feature 1.
- **DO NOT implement basket claim here.** When the visitor builds a basket as a guest and then logs in, the basket needs to be claimed against the new client token. That is feature 4 (basket); session.md's job in feature 1 is only to preserve the guest token so feature 4 has the join key to work with.
- **Identity lives in a single store.** Subsequent features (brand bootstrap, catalogue, basket, checkout, payment, panel) read identity from that store. They do not re-call `/self`. Re-call only when the auth state transitions (login, logout, refresh).
