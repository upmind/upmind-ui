# Design: FE-1329

## Overview

Email verification enforcement for authenticated clients. The client machine gains a new `unverified` state node — when enforcement is enabled and the client's email is unverified, the client is NOT `available`. They must verify before proceeding. The flow mirrors the existing 2FA `challenging` pattern in the guest machine.

Two verification methods must be supported:
- **Link-based** (exists today) — user clicks email link, auto-verifies via `check_verify` endpoint
- **Code-based** (new from BE) — user enters verification code in a non-dismissable modal overlay

## Existing Architecture

### 2FA Challenge Pattern (blueprint)

The existing 2FA flow in `guest.machine.ts` is the exact pattern to follow:

```
authenticating → [requires2fa guard] → challenging → VERIFY → verifying → complete
```

| Component | Location | What it does |
| --- | --- | --- |
| `guest.machine.ts` L102-139 | Session guest machine | `authenticating → challenging → verifying → complete` state flow |
| `guest/services.ts` L108 | `verify2fa` service | Posts code to OAuth endpoint with `GrantTypes.TWOFA` |
| `useSession.ts` L154-156 | `show2fa` meta flag | Drives UI to show the code input form |
| `useSession.ts` L329-346 | `verify2fa()` method | Sends `VERIFY` event with the code, waits for completion |
| `guest/utils.ts` | Schema/UiSchema parsers | `use2faSchemaParser`, `use2faUischemaParser`, `use2faModelParser` |

### Email Verification (existing infrastructure)

| Component | Location | What it does |
| --- | --- | --- |
| `Email.isVerified` | `client/email/types.ts` L70 | Boolean mapped from `raw.verified` |
| `email/mappers.ts` L25 | Email mapper | Maps `raw.verified` → `isVerified` |
| `send_verify` | `client/email/services.ts` L174-204 | `PATCH /clients/{id}/emails/{emailId}/send_verify` — sends verification email |
| `check_verify` | **vue-app only** (not in headless yet) | `PATCH /clients/{id}/emails/{emailId}/check_verify` — confirms via `reg_hash` |

### Vue-App Reference (to port)

The legacy vue-app has a working link-based email verification flow:

| Component | Location | What it does |
| --- | --- | --- |
| Route `/auth/verify-email` | `vue-app/src/router/client/index.ts` L31-47 | Landing page for email verification links |
| `VerifyClientEmail` | `vue-app/src/views/client/auth/verifyEmail/index.vue` | Extracts `hash`, `client_id`, `email_id` from query, auto-calls `check_verify` |
| `verifyEmailAddress` action | `vue-app/src/store/modules/auth/client/index.ts` L372-398 | `PATCH /clients/{id}/emails/{emailId}/check_verify` with `{ reg_hash }` |

### Brand Settings

| Component | Location | What it does |
| --- | --- | --- |
| `useBrand()` | `brand/useBrand.ts` | Brand settings composable |
| `BrandConfigKeys` | `@upmind-automation/types` | Enum of brand config keys |
| `ensureConfig()` | Brand service | Ensures a config key is loaded |

## Proposed Changes

### 1. Client Machine — `unverified` State Node

The client machine currently flows `loading → available`. A new `unverified` state is added:

```
loading → [requiresEmailVerification guard] → unverified → (VERIFY success) → available
                                              ↘ available  (if verified or enforcement off)
```

**The client is NOT available while in `unverified`.** This mirrors 2FA — the user cannot proceed until they verify.

#### Guard

```typescript
requiresEmailVerification: (context) =>
  !!context.brandConfig?.enforceEmailVerification &&
  !context.client?.primaryEmail?.isVerified
```

#### `unverified` Sub-States

Follow the same compound state pattern as guest 2FA `challenging`:

```
unverified
├── idle           — show code input, await VERIFY event
└── verifying      — invoke service to validate submitted code
```

#### Events

| Event | From | To | Data |
| --- | --- | --- | --- |
| `VERIFY` | `idle` | `verifying` | `{ code: string }` |
| `CANCEL` | `idle` | re-check guard | — (re-evaluates `requiresEmailVerification` — if now verified → `available`, if still unverified → stays in `unverified`) |

On `verifying` success → `available`
On `verifying` failure → back to `idle` with error (same recovery as 2FA)

#### Actions

| Action | Trigger | What it does |
| --- | --- | --- |
| `notifyVerificationSuccess` | `verifying` → `available` | Toast via `useFeedback` — "Email verified" |
| `notifyVerificationFailure` | `verifying` → `idle` (on error) | Toast via `useFeedback` — error message from BE |
| `setError` | `verifying` → `idle` (on error) | Store error in context |
| `clearError` | `VERIFY` event | Clear error on user action |

### 2. Brand Setting Consumption

> **⏳ Blocked on BE** — exact key TBD from ATBE-580.

Add to `BrandConfigKeys` enum once BE provides the key. Follow existing naming conventions (`CHECKOUT_REQUIRE_PHONE`, `REQUIRE_ADDRESS_FOR_ORDERS`).

```typescript
// Placeholder — replace with actual key from ATBE-580
CHECKOUT_REQUIRE_VERIFIED_EMAIL = 'checkout_require_verified_email' // TBD
```

Consume via `ensureConfig()` in the client machine's load service.

### 3. Services

Two verification paths, both in `session/client/services.ts`:

#### Path 1: Link-Based (port from vue-app)

Endpoint exists today: `PATCH /clients/{client_id}/emails/{email_id}/check_verify`

```typescript
async function checkVerifyEmail(clientId: string, emailId: string, regHash: string) {
  return patch({
    url: useUrl(`clients/${clientId}/emails/${emailId}/check_verify`),
    data: { reg_hash: regHash },
    withAccessToken: true
  });
}
```

Used by the `/auth/verify-email` route handler (auto-verifies on page load from email link).

#### Path 2: Code-Based (new BE endpoint)

> **⏳ Blocked on BE** — endpoint TBD from ATBE-580.

```typescript
async function verifyEmailCode(code: string) {
  // Endpoint TBD — will validate the 6-digit code
}
```

#### Send Verification

Use existing `send_verify` endpoint: `PATCH /clients/{id}/emails/{emailId}/send_verify`

### 4. UI Strategy — Options Considered

#### Option 1: Dedicated `/auth/verify-email` route + checkout guard ✅ CHOSEN

Register a dedicated route for `/auth/verify-email`. Guard the checkout route — if the client is logged in but in `unverified` state, redirect to `/auth/verify-email` with a `returnUrl` pointing back to checkout. On successful verification, redirect back to `returnUrl`.

**Pros:** Clean separation, familiar redirect pattern, works with browser history.
**Cons:** Leaves the current page context.

#### Option 2: System modal via `useFeedback` (store-wide enforcement)

Trigger a non-dismissable system modal via `useFeedback` as an action in the `unverified` state of the client machine. This would enforce verification everywhere in the store, not just at checkout.

**Pros:** Enforces globally, user can't navigate elsewhere while unverified.
**Cons:** Heavier than needed — requirement is checkout-only enforcement, not store-wide.

#### Option 3: Funnel machine overlay at `/verify-email/`

Register an overlay for a new `/verify-email/` endpoint in the funnel machine (named routes). Throws a non-dismissable modal on any route by appending `/verify-email/` to the current path. On success, stays in place and proceeds.

**Pros:** Keeps user in-situ, reuses funnel machine infrastructure.
**Cons:** More complex routing, depends on funnel machine being available.

#### Option 4: Funnel machine watcher + auto-redirect

Register a watcher with the funnel machine (named routes) that detects when the client enters the `unverified` state and auto-redirects to `{currentRoute}/verify-email/`.

**Pros:** Reactive, automatic, works from any route.
**Cons:** Most complex, implicit behaviour may be surprising.

#### Decision

**Use Option 1** — registered `/auth/verify-email` route, guarded by `guardCheckout` in the cart funnel services.

The existing `guardCheckout` in `apps/cart/src/router/services.ts` (L566-638) already follows this pattern — it checks `meta.value.needsAuth` and rejects with a redirect to `ROUTE.SESSION` with a `returnUrl`. The email verification check slots in the same way:

```typescript
// In guardCheckout, after the needsAuth check (L577-592):
const { meta: clientMeta } = useSession();
if (clientMeta.value.isUnverified) {
  const returnUrl = router.resolve({ name: ROUTE.CHECKOUT }).fullPath;
  return Promise.reject({
    target: {
      name: ROUTE.VERIFY_EMAIL,
      query: { returnUrl }
    }
  } as FunnelResponse);
}
```

- Same `reject → redirect → returnUrl` pattern as the existing auth check
- On successful verification → redirects back to `returnUrl` (checkout)
- Post-registration → can also redirect to `/auth/verify-email` with a `returnUrl` back to basket (skip not yet defined — future consideration)

### 5. Route — `/auth/verify-email`

Register a new route with a `guardVerifyEmail` service in the funnel:

#### Guard Logic (`guardVerifyEmail`)

```
Has hash param?
├── YES → call check_verify(client_id, email_id, hash)
│         ├── success → toast via useFeedback ("Email verified") → redirect to returnUrl (or fallback)
│         └── failure → toast via useFeedback ("Link expired/invalid") → resolve route (show code input as fallback)
│
└── NO → check client state
          ├── isUnverified → resolve route (show code input form)
          └── isVerified → reject → redirect to returnUrl (or fallback)
```

**Fallback route:** If no `returnUrl` is provided, redirect to dashboard/basket (same fallback as `guardSession`).

**Toast feedback:** Success/failure toasts are dispatched from the client machine via `useFeedback` — not from the guard itself. The guard triggers the machine event, the machine's actions handle feedback.

#### Code-Based (no hash — show form)

- URL: `/auth/verify-email?returnUrl=/checkout`
- Guard resolves → shows non-dismissable verification form:
  - **Heading:** "Verify your email address"
  - **Message:** "We've sent a verification code to your email. Enter it below to continue."
  - **Code input field** — 6-digit code
  - **"Continue" button** → sends VERIFY event
  - **"Resend code" link** → sends RESEND event (60s cooldown)
  - **Non-dismissable** — no close/back/skip
- On success: redirect to `returnUrl` (or fallback)

#### Link-Based (has hash — auto-verify)

- URL: `/auth/verify-email?hash=...&client_id=...&email_id=...&returnUrl=...`
- Guard detects hash → calls `check_verify` → sends result to client machine
- On success: machine fires toast, guard redirects to `returnUrl` (or fallback)
- On failure: machine fires error toast, guard resolves route (falls through to code input form)

### 6. Composable API

Add to the session/client composable:

```typescript
return {
  // --- state (new)
  /** True when client is in `unverified` state. */
  isUnverified,

  // --- methods (new)
  /** Submit the verification code. */
  verifyEmail,
};
```

## Integration Points

| System | Integration | Notes |
| --- | --- | --- |
| `client.machine.ts` | New `unverified` state node | Client is NOT available while unverified |
| `apps/cart/src/router/services.ts` | **New `guardVerifyEmail` funnel service** | Handles hash detection, client state check, resolve/reject logic |
| `apps/cart/src/router/services.ts` | **Modify `guardCheckout`** to add `isUnverified` check | Same reject → redirect → returnUrl pattern as `needsAuth` |
| `apps/cart/src/router/funnels/cart.ts` | Register `/auth/verify-email` route + `ROUTE.VERIFY_EMAIL` | New named route in the funnel machine |
| `useBrand` | Read enforcement setting | Brand-level toggle (key TBD) |
| `send_verify` endpoint | Send verification email/code | Existing, used for RESEND |
| `check_verify` endpoint | Link-based verification | Port from vue-app |
| New BE endpoint | Code-based verification | TBD from ATBE-580 |

## Edge Cases

| Case | Handling |
| --- | --- |
| Enforcement disabled | Guard passes, client goes straight to `available` |
| Email already verified | Guard passes, no interstitial |
| User submits wrong code | Error message, remain in `idle`, can retry |
| User resends too quickly | 60s cooldown on resend |
| Guest checkout | Not applicable — enforcement is for authenticated clients only |
| Convert rejects (safety net) | Existing basket error handling surfaces the BE error message |

## BE Dependencies (Parked)

| Item | Status | Impact |
| --- | --- | --- |
| Brand config key | ⏳ TBD from ATBE-580 | Task 1 blocked |
| Code verification endpoint | ⏳ TBD from ATBE-580 | Code-based service blocked; link-based can proceed |
| Both link + code supported | ✅ Confirmed | Architecture supports both paths |
