# Session Store — Gotchas

Edge cases and traps in the session-store module. **For:** developers integrating the store, and QA writing tests against session behaviour. Each block states the problem, shows wrong → right where it applies, and gives a test scenario. 🧪 scenarios are behaviour-phrased and spec-grounded (FE-2825 SDD + source) so they feed test authoring under ADR-021.

---

## 1. `activeSession` is guaranteed — but only after init

**Problem:** The store guarantees an active session (guest minted if nothing else), so `activeSession.value` is safe to read _without a runtime null check_ — but only once `isAvailable` is true. Before init completes the store holds the sync default (guest actor, **no token yet**). The ref type stays `IToken | undefined`, so a post-init read asserts (`!`) rather than branches — the same idiom `account.services.ts` uses for `activeSessionId`.

```typescript
import { useSessionStore } from "@upmind-automation/headless";

// Thin stand-in for whatever consumes the token.
function makeApiCall(accessToken: string | undefined): void {
  console.log(accessToken);
}

const { activeSession } = useSessionStore().useContext();

// ⚠️ Runs before init → activeSession.value is the tokenless default
makeApiCall(activeSession.value?.access_token); // undefined if read too early

// ✅ Gate on readiness
const { isReady } = useSessionStore().useActions();
await isReady();
makeApiCall(activeSession.value!.access_token);
```

> **🧪 For Testers:** Read `activeSession` immediately on import → it is the default guest state with no token. After `initStore()` resolves → `activeSession.value.access_token` exists (a guest token was minted). (Spec: README "Guaranteed Active Session" / "Verify Initialization Completes".)

> **⚠️ There is no `storeInitialized` export.** Older docs referenced `import { storeInitialized }` — it does not exist. Await readiness via `useSessionStore().useActions().isReady()` (or `initStore()`'s own promise).

---

## 2. Guest minting happens at boot and at activation, not on re-hydration, sync, or navigation

**Problem:** A guest token is minted in two situations: during initialisation, when no client/staff session and no guest cookie exist; and when guest is the session being switched to while the guest pool is currently empty. Outside those two triggers it is **not** minted — not on cookie re-hydration, cross-tab sync, or navigation. If you expect a fresh guest after clearing the guest cookie mid-session without activating guest, you will not get one until the next boot or the next guest activation.

```typescript
import { useSessionStore } from "@upmind-automation/headless";
import { AccessRoleTypes } from "@upmind-automation/types";

const { activate } = useSessionStore().useActions();

// Pool empty, no id given → mints a guest token, then activates it.
// Never rejects: a failed mint leaves the pointer where it was and logs a warning.
await activate(AccessRoleTypes.GUEST);
```

> **🧪 For Testers (minting at boot):** Clear all cookies, reload → after init, `activeActor` is `guest` and `activeSession.value.access_token` exists; a guest API call succeeds. (Spec: README Test 1.)

> **🧪 For Testers (minting at activation):** With a client signed in and no guest session pooled, `await activate(AccessRoleTypes.GUEST)` mints a guest token and switches to it — one outbound guest-grant request, then `activeActor` becomes `guest`.

> **🧪 For Testers (mint failure, boot vs activation):** A guest-grant failure that exhausts every retry **during boot** resolves into an **error state** — the store does not proceed guestless and does not hang; `error` is populated and the app must surface it. (Source: `mintGuestToken` throws after 3 attempts → `initialise` catch sets `error`.) The same failure **during activation** is a soft degrade instead: the active pointer is left exactly where it was and the failure is only logged — `activate()` never rejects.

---

## 3. Guest minting delegates to `auth` (lazy circular dependency)

**Problem:** `mintGuestToken()` dynamically imports the `auth` module (`await import("../auth")`) rather than importing it at the top of the file. `auth` statically imports session-store to persist tokens, so a static import back would close a real cycle and crash at load time (`useX is not a function`). The dynamic import is deliberate — do not "tidy" it into a static import.

> **🔧 For Contributors:** The mint runs `auth`'s guest grant, which persists the token via `persistTokenToStorage`; session-store then reads it back from the cookie. Retrieve-from-storage keeps both modules on one persistence path. (Source: `session-store.services.ts` `mintGuestToken`.)

> **🧪 For Testers:** Mock the guest grant to succeed → boot yields a guest token in the `upm_guest_session` cookie. Mock it to fail → `initialise` does not throw synchronously; it resolves with the store in an `error` state.

---

## 4. Wrong endpoint for the actor → 403

**Problem:** `/self` serves client identity; `/admin/self` serves staff identity. Calling the staff endpoint with a client or guest token returns `403 "Access forbidden for customers"`. The profile read is routed by `actor_type` for exactly this reason — never call `/admin/self` with a non-staff token.

> **🧪 For Testers (wrong-actor 403):** A client/guest token against `/admin/self` returns `403` with error message `"Access forbidden for customers"`. The session must not be promoted to staff on the back of it. (Fixture: `get-admin-self-case-wrong-actor.json`.)

> **🧪 For Testers (invalid token 401):** A malformed/expired token against `/self` returns `401`; that session has no live backing and should fall through to the next session or the guest floor. (Fixture: `get-self-case-invalid-token.json`.)

---

## 5. `remove` keeps the cookie; `logout` removes it

**Problem:** `remove(actor, id)` drops a session from in-memory state but **leaves the token cookie**. On the next boot or cookie re-read the session reappears — the cookie is what re-seeds that scope's session on boot, but the store (not the cookie) is what decides which sessions exist going forward. To end a session for good, use `logout(actor)`, which removes the cookie _and_ the state.

```typescript
import { useSessionStore } from "@upmind-automation/headless";
import { AccessRoleTypes } from "@upmind-automation/types";

// ⚠️ Session comes back on reload — cookie still set
useSessionStore().useActions().remove(AccessRoleTypes.CLIENT, "client-123");

// ✅ Cookie + state removed
useSessionStore().useActions().logout(AccessRoleTypes.CLIENT);
```

> **🧪 For Testers:** After `remove`, reloading restores that session — observable via `allSessions` containing it again and `activeSession`/`activeActor` resolving back to it. After `logout`, reloading does not restore it — `allSessions` no longer contains it. (Source: `remove` omits from state only; `logout` → `dumpTokenFromStorage` deletes the cookie.)

---

## 6. Only one token per actor type is wire-visible via cookies — intended to survive a reload via the store, currently does not

**Model:** Cookies hold a single token per actor type (`upm_client_session`, `upm_user_session`, `upm_guest_session`) — that's the whole point of "at most three cookies". Secondary same-actor sessions (a second client keyed by a different `actor_id`) are meant to survive a reload from the sessionStorage cache, with a full usable token, not just display metadata — that's what makes switching back to them instant.

**Current source caveat (known implementation defect, not a documented limit):** the store's write-time cookie reconciliation collapses `clientSessions`/`staffSessions` down to whichever entry the _current_ cookie backs, on every state write — including writes from the store's own `add()`/`activate()` actions, with no reload involved. A second session added in-memory does not survive even the _next_ write, let alone a reload. This is reload-independent and deeper than "doesn't survive a reload."

> **🧪 For Testers:** Add two client sessions via `add()`. Per the model, both should appear in `allSessions` and `activate()` should switch between them instantly with no network call. Currently: `allSessions` retains at most the cookie-backed session — the second is dropped on the very next store write, not just across a reload. Treat a failure here as a product defect against the multi-session model, not a test-design issue — provided the seeding used the store's own `add()`/`activate()` actions (seeding via a token-persistence helper that only writes a cookie is a test-design error, not a product one).

---

## 7. sessionStorage holds every session's tokens — this is the required multi-session cache, not a leak

**Model:** `persistStoreState()` writes the whole identity model — including `access_token`, `refresh_token`, and `guest_token` inside each held session — to the `upm_session_store` **sessionStorage** key on every state change. This is required: it's the only place a non-active session's token lives once that scope's cookie has moved on to a different session, and it's what makes switching back to a cached session instant with zero server round trips.

**Accepted tradeoff, not a bug to patch away:** anything that can read `sessionStorage` (most concretely, an XSS payload) can read every held session's tokens, not only the active one. This is wider than reading a single cookie, and it is a known, accepted consequence of the multi-session/instant-switch requirement — not a gap awaiting a fix. A design that strips token secrets before this write (as previously proposed) would force re-authentication to switch back to a cached session, which breaks the requirement outright — see [FE-2825-note.md](./FE-2825-note.md).

> **🔧 For Contributors:** `persistStoreState` (`session-store.utils.ts`) persists `store.state` minus `initialised`/`loading`, with no token stripping — this is the intended shape, not a missing sanitisation step.

> **🧪 For Testers:** Add a second client session via `add()`, then `activate()` back to it. Assert on the public surface: the switch resolves synchronously to the new `activeSession`/`activeActor` with no network request fired for it (confirms the token came from the cache, not a re-auth). Reading `sessionStorage` content directly is not the assertion surface for this behaviour — the one sanctioned direct-storage test action in this module is _deleting_ a cookie to prove the guest/next-session fallback (see Gotcha 2).

---

## 8. Cross-tab `SET_SESSION` broadcasts on every session add, not only login/logout

**Problem, reframed:** On receiving a `SET_SESSION` broadcast, `handleIncomingBroadcast` writes `message.session` (an `IToken` from a same-origin-postable channel) straight into store state — a receiver trusting a same-origin-postable payload is a real, narrow concern. But the more load-bearing gap against the model is upstream of that: the platform's cross-tab contract only requires **login and logout** to propagate, applied like-for-like (a login upgrades every guest tab; a logout ends the session in every tab currently showing that user) — **switching** between already-held sessions in one tab is tab-local and must never broadcast. The current `add()`/`activate()` path broadcasts `SET_SESSION` unconditionally, including for switches, which is wider than the contract allows. See [FE-2825-note.md](./FE-2825-note.md) for why the previously-proposed "doorbell" hardening (re-hydrate from cookie instead of trusting the payload) doesn't fix this — it addresses payload trust, not over-broadcasting.

> **🔧 For Contributors:** The safe re-hydrate pattern already exists on the `UNAUTHENTICATED` path (`hydrateFromStorage()`). Cookie-change sync (the CookieStore listener / 2s poll) also re-reads from cookies independent of the broadcast. Neither of those addresses the over-broadcast-on-switch gap.

> **🧪 For Testers (switches must not broadcast):** In tab 1, `activate()` between two already-held sessions. Tab 2 must show no change to its own `activeActor`/`activeSession` — a switch in one tab is tab-local. Assert on `activeActor`/`activeSession` in tab 2, not on messages received.

> **🧪 For Testers (login/logout must broadcast like-for-like):** Login in tab 1 while tab 2 is on guest → tab 2's `activeActor`/`activeSession` upgrades to the same client. Logout the active user in tab 1 → every tab whose `activeActor`/`activeSession` matched that user falls back to guest (or the next session); a tab already on a different user is untouched.

> **🧪 For Testers (removal-type broadcasts):** `REMOVE_SESSION`, `REMOVE_GUEST`, `CLEAR`, and `UNAUTHENTICATED` broadcasts each transition state per their handler, observable via `allSessions`/`activeActor`; `UNAUTHENTICATED` re-hydrates from cookies. A broadcast received **before** `initialise()` is a no-op (the hydrate guard early-returns).

---

## 9. Expiry is derived from the token's own timestamps

**Problem:** `isExpired` / `isAboutToExpire` / `expiresAt` are computed from `created_at + expires_in` on the token — not from a server clock and not from the token being "present". A token that arrives **without `created_at`** is treated as already expired by `getExpiresAt` (it returns null → `isTokenExpired` returns true). A mint or refresh that drops the timestamp reads as an immediately-dead session.

- `isAboutToExpire` is true only in the last 5 minutes before expiry (and false once expired).
- `canRefresh` checks the refresh token against `created_at + refresh_expires_in`; with those timestamps missing it falls back to "true if a refresh token string exists".

> **🧪 For Testers:** A token with `created_at` = now and `expires_in` = 3600 → `isExpired` false, `expiresAt` ≈ now + 1h. The same token with `expires_in` elapsed → `isExpired` true. A token with no `created_at` → treated as expired. (Source: `getExpiresAt` / `isTokenExpired` in `session-store.utils.ts`.)

---

## 10. Impersonation is memory-only

**Problem:** The parent → impersonated link (`impersonatedSessions`) lives in memory (and sessionStorage metadata) but the parent relationship is not designed to survive a full reload as a restorable path. Ending an impersonated session restores the parent **only if the parent session is still present**. A reload during impersonation strands the caller in the impersonated identity with no automatic route back.

> **🧪 For Testers:** Staff impersonates client, then `logout()` → staff session restored (parent alive). Staff impersonates client, reload, then `logout()` → parent link is gone, no auto-restore. (Spec: architecture "Impersonation Safety"; source `remove` parent branch.)

---

## 11. `activate` and `add` silently respect `allowedScopes`

**Problem:** If the app was initialised with `allowedScopes`, `activate(actor)` is a **no-op** for a disallowed actor and `add(token, true)` stores the token but **does not activate** it. There is no error — the call just does not change the active pointer. Reading `isScopeAllowed(actor)` tells you whether it will take effect.

> **🧪 For Testers:** With `allowedScopes: [CLIENT, GUEST]`, `activate(STAFF, id)` leaves `activeActor` unchanged, and `add(staffToken)` stores it without activating. `isScopeAllowed(STAFF)` returns false. (Source: `activate` / `add` scope guards, `useSessionStore.actions.ts`.)

---

## 12. `add` never claims the guest pointer, only `activate` does

**Problem:** `add(token)` stores a guest token in `guestSessions` but never touches `activeSessionId` for guest — only `activeActor` is set, and the standing pointer is left for the write gate to re-validate. This looks like an inconsistency next to client/staff, where `add(token)` sets both `activeActor` and `activeSessionId` — it is deliberate.

The reason: a background token refresh reaches `add()` through the exact same path an explicit guest activation's mint does (`persistTokenToStorage` → `add(token, true)`). `add()` has no way to tell those two calls apart. If it wrote the guest pointer, a refresh of a _fallen-back_ (unclaimed) guest's token would silently turn it into a _chosen_ guest — and a chosen guest is not supposed to be replaced by a signed-in identity showing up elsewhere, so that tab would stop upgrading when it should. Only `activate()` ever records the choice.

```typescript
import { useSessionStore } from "@upmind-automation/headless";
import { AccessRoleTypes } from "@upmind-automation/types";
import type { IToken } from "@upmind-automation/types";

const guestToken = {} as IToken;
const { add, activate } = useSessionStore().useActions();

// ⚠️ Storing a guest token directly does NOT choose it — the pointer is untouched
await add(guestToken);

// ✅ Choosing a guest is activate()'s job
await activate(AccessRoleTypes.GUEST, guestToken.actor_id || undefined);
```

> **🧪 For Testers:** Boot to a fallen-back guest (do not activate it explicitly), then drive a token refresh for it. `activeSessionId` stays exactly as it was before the refresh — `add()` did not claim it. Only a direct `activate(GUEST, id)` call changes the pointer.

---

## 13. The guest floor never claims the pointer either

**Problem:** When no client or staff session is available and resolution falls back to guest, `activeSessionId` is left **absent** even though a real guest session sits in the pool. This is the one place guest resolution differs from client/staff: a client or staff session reached by priority fallback DOES get its id written onto the pointer.

The reason: the fallen-back (floor) guest has to stay upgradeable. If the floor claimed the pointer, a later sign-in happening elsewhere (e.g. another tab) would find the guest pointer already "chosen" and would not promote this tab to that identity. Leaving the pointer unclaimed is what lets a plain, defaulted guest tab pick up a login happening elsewhere — an explicitly chosen guest (its id IS on the pointer) does not get replaced this way, by design.

This is also the entire discriminator between a _chosen_ guest and a _defaulted_ one: both have a live entry in `guestSessions`, so "does a guest session exist?" cannot tell them apart. Only the pointer's presence can — no separate flag exists for it.

> **🧪 For Testers:** With no client/staff session, boot lands on guest with `activeSessionId` **undefined**, even though `guestSessions` is non-empty. Explicitly `await activate(AccessRoleTypes.GUEST)` the same guest → `activeSessionId` now names its key. Both states show the same guest token on the public surface; only the pointer differs.

---

## 14. A failed guest token falls back to the previous session, by design

**Problem:** If a _chosen_ guest's own token stops being valid (its cookie is no longer live — e.g. its refresh failed), the active identity does not stay stranded on guest. It falls back through the same priority order everything else uses: staff, then client, then the guest floor. In practice this means a chosen guest whose token fails while a client session is also held lands back on that client.

This is not a bug to guard against — it is the existing fallback hierarchy applying to guest like any other actor: a scope with no live backing cookie is not honoured as the active pointer, so resolution falls through to the next real session. "Survives any subsequent write" (see the guest-activation examples above) means survives any write that does not itself invalidate the guest token.

> **🧪 For Testers:** Activate a guest session explicitly, then force its token to fail (e.g. an expired/invalid refresh) while a client session is also held. The active identity falls back to the client — this is expected, not a regression.

---

## Open Questions (for reviewer)

- **Resolved (2026-07-02, product owner ruling):** Gotchas 7 & 8 previously framed the FE-2825 §5.1/§5.2 hardenings as security work the shipped module was missing. The ratified multi-session model reverses this: §5.2 (null token secrets before the sessionStorage write) would break the instant-switch requirement outright and **must not** be implemented as specified; §5.1 (doorbell-only broadcast) is moot against the real gap, which is that switches broadcast at all (they must not) and login/logout broadcasts aren't verified like-for-like. See [FE-2825-note.md](./FE-2825-note.md) for the full reasoning and citations.
- **Still open:** the write-time cookie-reconciliation defect described in Gotcha 6 (non-cookie-backed sessions dropped on every write) is a genuine product defect against the model, independent of the docs question above — it needs an implementation fix, not a doc change.
