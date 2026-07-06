# account — Gotchas

The sharp edges of the standing arc. For anyone consuming `useAccount` or writing tests against it.

## 1. Verifying an already-verified client returned a silent `204` (captured case)

In the one recorded case, an **already-verified** account submitting `code: "000000"` to `POST /clients/verification_code/verify` got **`204 No Content`** — no error, despite there being nothing to verify. That single observation is all the fixture proves. Treat anything wider as inference:

- Whether _other_ code values also pass on a verified account is unverified (only `000000` was captured).
- The wrong-code `4xx` shape on a genuinely **unverified** account is unverified inference, pending an unverified-account capture.

```ts
// ⚠️ Wrong: treating a 204 as proof the entered code was correct
const ok = await verify({ code: userEnteredCode });
if (ok) assert("user typed the right code"); // NOT guaranteed on an already-verified account

// ✅ Right: a 204/true means "verified now", full stop
const ok = await verify({ code: userEnteredCode });
if (ok) proceedAsVerified();
```

> **🧪 For Testers:** Against the recorded already-verified account, `verify({ code: "000000" })` returns `204` and resolves `true`. Assert only this captured case. The `4xx`-on-wrong-code path is **not producible** from a verified account — do not assert a rejection shape, and do not assert "any code passes", from this fixture.

Fixture: `__tests__/fixtures/post-clients-verification-code-verify.json` (`204`, request body `{ code: "000000" }`).

## 2. Resend returns `409`, not `2xx`, when already verified

`POST /clients/resend_verification` returns **`409 Conflict`** with `error.message: "Customer is already verified!"` for a verified client — this is expected platform behaviour, not a bug to retry.

```ts
// ⚠️ Wrong: retrying a 409 as if it were transient
resend(); // 409 → back off and retry → still 409 forever

// ✅ Right: a 409 means "nothing to resend" — stop and surface "already verified"
// useMeta().resendFailed becomes true; treat it as terminal, not retryable.
```

> **🧪 For Testers:** `resend()` against a verified client returns `409` and sets `useMeta().resendFailed` / `hasErrors`. The happy-path `200` response is **not captured** (the recorded account is already verified) — do not assert a `200` body from these fixtures.

Fixture: `__tests__/fixtures/post-clients-resend-verification.json` (`409`).

## 3. Fetching a client while unauthenticated → `401`, no data

The client-record read returns **`401`** with `error.message: "Please log in to continue"` and `data: null` when there's no valid session.

> **🧪 For Testers:** Reading the client record while unauthenticated yields a `401` auth error and **no** client data (`data: null`). No standing can be derived; the arc has nothing to route.

Fixture: `__tests__/fixtures/get-clients-id-case-unauthenticated.json` (`401`).

## 4. `useAccount` is client-only — guests and staff route to `unavailable`

The scope matrix maps `self` and `guest` to `null` and `staff`/`client` to `CLIENT`, but the machine's `isClient` guard additionally requires a **client to be present**. A guest session with no client, or a staff actor, routes to `unavailable`.

```ts
// ⚠️ Wrong: assuming every session yields a working account instance
const { showVerifyEmailForm } = useAccount().as("self").useMeta();
// If the active actor isn't a client → this is always false; no forms ever show.

// ✅ Right: gate on canShowForms / isGuest before rendering standing UI
const { canShowForms } = useAccount().as("self").useMeta();
```

> **🧪 For Testers:** With a non-client active actor (staff, or a guest with no client seeded), `canShowForms` is `false` and no standing form renders. `REFRESH` carrying client data re-routes `unavailable → subscribing`.

## 5. Guest is checked before verification

The router evaluates `is_guest` **before** email-verification. A guest whose email is unverified is routed to _upgrade_, never to _verify_.

> **🧪 For Testers:** A client with `is_guest: true` yields `isGuest === true` and never `showVerifyEmailForm === true`, even with an unverified primary email.

## 6. Verification is skipped entirely when the brand doesn't enforce it

The `unverified` branch is gated on `useBrand().enforceEmailVerification`. A full client with an unverified email on a **non-enforcing** brand routes straight to `verified` — no verify form.

> **🧪 For Testers:** Same unverified full client, two brands: `enforceEmailVerification: false` → routes to `verified` (`showVerifyEmailForm === false`); `enforceEmailVerification: true` → routes to `unverified` (`showVerifyEmailForm === true`).

## 7. A guest's email lives in `username`, not `email`

The back end keeps a guest's email in `username`; `email` is `null` until upgrade. The guest-email autosave PUT reads back `email: null`, and the module reflects the saved value on `client.username`.

```ts
// ⚠️ Wrong: reading a guest's email off `email`
const shown = client.email; // null for a guest

// ✅ Right: fall back to username
const shown = client.email ?? client.username;
```

> **🧪 For Testers:** After `updateGuestEmail({ email })` on a guest, the persisted value is observable via `client.username`, not `client.email`. Calling it again with the same value is a no-op that resolves `true` with **no** request fired.

## 8. Verify success is authoritative; re-reading `/self` can lag

On a `2xx` verify, the machine trusts the POST result (`markEmailVerified`) and jumps to `verified` immediately, then invalidates `/self` in the background. Gating "verified" on a fresh record read races a stale `verified: 0`.

> **🧪 For Testers:** After `verify()` resolves `true`, `showVerifyEmailForm` is already `false` — the transition does **not** await a `/self` refetch. A test that polls the client record for `verified: true` may briefly observe the stale pre-verification value.

## 9. Link-verify (`check_verify`) is owned by auth, not account

The link-based verification endpoint (`PATCH /clients/{id}/emails/{emailId}/check_verify`, body `{ reg_hash }`) has a copy defined in `account.services.ts`, but the **live** flow (`verifyFromLink`, with the surrounding `/self` refresh) is wired in `auth.services.client.email.ts` and invoked by routing. The account copy has no importer.

> ⚠️ UNRATIFIED: whether the account module should own the link-verify endpoint at all, or whether its copy is dead code to remove, needs a ruling. The code-based route (`verify()` → `/clients/verification_code/verify`) is unambiguously account's.

> **🧪 For Testers:** Do not target the account module for link-based email verification — exercise it through the auth module / routing guard. Account owns only the **code**-based verify.

## 10. `resolve()` is not part of the public surface

`useAccount.actions.ts` defines a private `resolve()` that branches on `stateMatches(state, "register")` — but no machine state is named `register` (the guest state is `unregistered`), and `resolve` is **not** returned from `useActions()`.

> ⚠️ UNRATIFIED: `resolve()` appears to be dead/never-reachable code (wrong state name, not exported). Flagged for the reviewer; it has no bearing on the public API. Use the explicit `register()` / `verify()` actions instead.
