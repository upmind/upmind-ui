# Requirements: FE-1329

## Overview

When a brand has email verification enforcement enabled, authenticated clients with unverified email addresses are placed in an `unverified` state — they are NOT available until they verify. Two verification methods are supported: link-based (clicking a link in the verification email) and code-based (entering a verification code). At checkout, verification is mandatory. The client machine's `unverified` state mirrors the existing 2FA `challenging` pattern in the guest machine.

## Dependencies

- **ATBE-580**: Backend API for email verification enforcement — includes the brand org setting, and convert endpoint rejection for unverified emails
  - ⏳ Brand config key — TBD
  - ⏳ Code verification endpoint — TBD (new, BE building)
  - ✅ `send_verify` endpoint — exists
  - ✅ `check_verify` endpoint — exists (port from vue-app)

## User Stories

### Customer (Shopper)

**As a** customer who has logged in with an unverified email,
**I want** to be prompted to verify my email when the brand requires it,
**So that** I can confirm my identity before completing a purchase.

#### Acceptance Criteria

- [ ] After login, if enforcement is enabled and email is unverified, the client enters `unverified` state (NOT `available`)
- [ ] A non-dismissable verification form is shown on the `/auth/verify-email` route
- [ ] The form accepts a 6-digit verification code
- [ ] After submitting a valid code, the client transitions to `available`
- [ ] `CANCEL` re-checks verification status — if verified (e.g. via email link in another tab), transitions to `available`; if still unverified, stays
- [ ] At checkout, `guardCheckout` redirects unverified clients to `/auth/verify-email?returnUrl=/checkout`
- [ ] Link-based verification works — clicking a link with `hash`, `client_id`, `email_id` auto-verifies via `check_verify`
- [ ] Users with already-verified emails bypass the `unverified` state entirely
- [ ] Success/failure toasts are dispatched from the client machine via `useFeedback`
- [ ] The enforcement check uses a brand org setting (key TBD from ATBE-580)

### Brand Admin (Operator)

**As a** brand admin,
**I want** to configure whether email verification is enforced for customers,
**So that** I can ensure customers have valid email addresses before purchasing.

#### Acceptance Criteria

- [ ] A brand org setting controls email verification enforcement (key TBD from ATBE-580)
- [ ] When disabled, clients go straight to `available` — no verification check
- [ ] When enabled, all unverified clients enter `unverified` state after login

## Scope

### In Scope

- Brand setting consumption for email verification enforcement
- `unverified` state node in `client.machine.ts` (mirrors 2FA `challenging` pattern)
- Link-based verification via `check_verify` endpoint (port from vue-app)
- Code-based verification via new BE endpoint (TBD)
- `/auth/verify-email` route with `guardVerifyEmail` funnel service
- `guardCheckout` modification to redirect unverified clients
- `useFeedback` toast actions in the client machine
- Composable API: `isUnverified` meta + `verifyEmail()` method

### Out of Scope

- Backend implementation (ATBE-580)
- Email template changes
- Admin panel UI for the setting
- Post-registration optional prompt (future consideration)
- Resend as a machine event (composable concern, not machine state)

## Success Criteria

- [ ] Unverified clients enter `unverified` state when enforcement is enabled
- [ ] `guardCheckout` redirects to `/auth/verify-email` with `returnUrl`
- [ ] `guardVerifyEmail` handles hash detection (auto-verify) and code form (manual verify)
- [ ] Valid code submission transitions client to `available`
- [ ] Link-based verification works end-to-end
- [ ] Toast feedback via `useFeedback` on success/failure
- [ ] No regression in login/register flows when enforcement is off

## Answered Questions

| Question | Answer |
| --- | --- |
| Where does email verification status live? | `Email.isVerified` mapped from `raw.verified`, available via `self` API |
| Code-based or link-based? | **Both** — link exists today (`check_verify`), code is new from BE |
| Where does the verification state live? | `client.machine.ts` — new `unverified` state node between `loading` and `available` |
| Where is checkout intercepted? | `guardCheckout` in `apps/cart/src/router/services.ts` — same pattern as `needsAuth` |
| How is the route guarded? | New `guardVerifyEmail` funnel service — hash detection, client state check, resolve/reject |
| What about resend? | Not a machine event — handled by the composable directly calling `send_verify` |
| What about the convert error? | Existing basket error handling covers it — no new mechanic needed |
| Current headless or @next? | Current headless (`develop`) |
| Can the user skip verification? | No skip — `CANCEL` re-checks verification status, stays in `unverified` if still unverified |
