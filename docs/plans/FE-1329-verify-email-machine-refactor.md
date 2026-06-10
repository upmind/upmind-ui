# FE-1329: Email verification — code (client machine) vs link (session machine)

> Refactor of work on `feature/fe-1329-…`. Story in **Needs Review**.
>
> **Direction (revised after review):** Link-based verification is a **legacy,
> outside-the-app-lifecycle** entry point (vue-app's `/auth/verify-email` wiped the
> session and verified via `reg_hash` alone — it works LOGGED OUT). It does NOT belong
> in the cart's authenticated client lifecycle. So we mirror the **transfer** mechanic:
> link-verify becomes its own concern on the **session machine** (session-agnostic),
> for the future client portal to consume. The cart keeps only the in-session **code**
> form, and `guardVerifyEmail` never calls verify.

## Two distinct operations (the core insight)

| | **Code verification** | **Link verification** |
|---|---|---|
| Trigger | Logged-in unverified client types a code into the form | User clicks emailed link (`?hash&client_id&email_id`) |
| Auth | In-session (requires `clientActor`) | Session-agnostic — works logged out (`reg_hash` is the proof) |
| Endpoint | `POST clients/verification_code/verify` | `PATCH clients/{id}/emails/{id}/check_verify` |
| Home | **client machine** `unverified.verifying` (unchanged) | **session machine** `verifying` (new, mirrors `transferring`) |
| Cart role | Cart shows the code form for unverified clients | Cart does NOT handle links; built for the portal |

Evidence link-verify is logged-out: vue-app `/auth/verify-email` used the logged-out
layout + `store.commit("user", {})` (session wipe) before verifying; headless
`withAccessToken: true` omits the header when there's no token (doesn't throw)
([useQuery.ts:188](packages/headless/src/modules/query/useQuery.ts#L188)). BE auth
requirement not contradicted by anything in-repo.

## What started this

`guardVerifyEmail` did link verification **inline** (direct `checkVerifyEmail` HTTP +
`addSuccess`/`addError` + `session.refresh()` + `try/catch`). That violated: business
logic in a guard; feedback not owned by the invoked service; `try/catch` around a
promise. The fix is not to relocate it into the client machine (wrong lifecycle) but to
the session machine, transfer-style — and to make the guard route-only.

---

## The transfer mechanic we are mirroring

- **Service** (`session/services.ts`): `transferFrom({ transfer })` — one endpoint call.
- **Parent machine** (`session.machine.ts`): global `TRANSFER_FROM` event → `transferring`
  state (`processing` invokes `transferFrom` → `processed`) → back to `#checking`.
- **Composables**: `useSession.transferFrom()` sends `TRANSFER_FROM`, `waitFor`s
  `transferring.processed`, returns the result; plus a lightweight `useTransfer` entry
  composable that runs at bootstrap and hard-redirects.

We replicate this 1:1 for link verification.

---

## Design-thinking artifact (per `.agent/rules/design-thinking.md`)

### 1. ELI5 — two flows

**Code (cart, in-session) — UNCHANGED:**
1. Logged-in unverified client lands on verify-email → `guardVerifyEmail` shows the form.
2. They type a code → `VerifyEmail.vue` calls `useSession().verifyEmail({ code })`.
3. Client machine `unverified.verifying` invokes `verifyEmailCode` → `onDone` flips to
   `available` + success toast; `onError` → `idle` + failure toast.

**Link (session machine, logged-out-capable) — NEW, for portal:**
1. Entry point (portal, outside funnel) reads `client_id`/`email_id`/`hash` from the URL.
2. Calls `useVerifyEmail().verifyFromLink()` → sends `VERIFY_FROM_LINK` to the session machine.
3. Session machine `verifying.processing` invokes `verifyFromLink` service (`check_verify`).
   - `onDone` → `processed` + `notifyVerificationSuccess` (toast).
   - `onError` → `processed` + `notifyVerificationFailure` (toast).
4. `processed` → back to `#checking` (re-bootstrap session so a now-verified logged-in
   client reloads as verified). Composable returns a boolean and handles redirect.

### 2. Who owns what

| | |
|---|---|
| **client machine** | In-session code verification + its feedback + `available` transition (unchanged) |
| **session machine** | Link verification (session-agnostic) + its feedback + re-check after verify (NEW) |
| **guardVerifyEmail** | Routing/gating ONLY — shows code form for unverified, else rejects. Never verifies. |
| **portal (future)** | Consumes `useVerifyEmail` at its verify entry point |

### 3. Question the model

- **`SessionContext.verification`** (new) — `{ clientId, emailId, hash, redirect? }` from the
  `VERIFY_FROM_LINK` event. Read by the `verifyFromLink` service. Mirrors `transfer`.
- **session `verifying` state** — mirrors `transferring`: `processing` → `processed`.
  Distinct from the client machine's `verifying` (different lifecycle, different endpoint).
- **Feedback actions** `notifyVerificationSuccess` / `notifyVerificationFailure` — currently
  on the client machine. Needed on the session machine too → extract to a shared helper in
  the session module and import in both (avoid duplication). Decision: shared helper.
- **No change to the cart funnel state chart** — `SESSION_VERIFY_EMAIL` stays; only the
  guard body changes (gating only).

### 4. Artifact first

```text
CLIENT MACHINE (in-session, code — UNCHANGED)
 unverified.idle --VERIFY {code}--> verifying (verifyEmailCode)
        onDone -> #available (+markEmailVerified, +notifyVerificationSuccess)
        onError -> idle      (+setError, +notifyVerificationFailure)

SESSION MACHINE (session-agnostic, link — NEW, mirrors transferring)
 (any state) --VERIFY_FROM_LINK {clientId,emailId,hash}--> verifying.processing (verifyFromLink)
        onDone  -> verifying.processed (+notifyVerificationSuccess)
        onError -> verifying.processed (+notifyVerificationFailure)
 verifying.processed --VERIFIED--> #checking (+clearVerification)
```

### 5. What's missing / edge cases

- **Cart never triggers `VERIFY_FROM_LINK`** — confirmed in scope: cart guard is gating-only;
  the session capability is portal-bound. Built now, consumed later.
- **Re-check after verify** — `processed → #checking` re-bootstraps so a logged-in client's
  verified flag refreshes. For a logged-out verifier there's simply no client token; checking
  resolves to guest. Both fine.
- **Shared feedback helper** — extracting `notifyVerification*` must not change the client
  machine's existing behaviour; keep identical i18n keys/shape.
- **`checkVerifyEmail` relocation** — moves to `session/services.ts` as `verifyFromLink`'s
  implementation. Keep an export for continuity (don't break package API silently).

---

## Files to create/modify

### A. Revert the link bits from the client lifecycle (restore code-only)
| Action | File | Changes |
|---|---|---|
| REVERT | `packages/headless/src/modules/session/client/services.ts` | Restore `verifyEmailCode(_ctx, { data })` as the machine service (code-only). Drop the `verifyEmail` dispatcher + link branch. Default export back to `{ load, transferTo, verifyEmailCode }`. |
| REVERT | `packages/headless/src/modules/session/client/client.machine.ts` | `verifying.invoke.src` back to `"verifyEmailCode"`. |
| REVERT | `packages/headless/src/modules/session/useSession.ts` | `verifyEmail` param back to `{ code: string }` only; drop the union + the already-verified short-circuit added for the link path. |

(Practically: `git checkout` these three to restore originals, since the code path was already correct pre-refactor.)

### B. Guard = gating only
| Action | File | Changes |
|---|---|---|
| MODIFY | `apps/cart/src/router/funnels/engine/services.ts` | `guardVerifyEmail`: `await session.isReady()`; if `isUnverified` → `{ target: SESSION_VERIFY_EMAIL }`; else `Promise.reject()`. NO hash handling, NO `verifyEmail` call, NO feedback, NO `try/catch`. Remove now-dead imports (`checkVerifyEmail`, and `useI18n`/`useFeedback` if unused elsewhere). |

### C. Build link-verify on the session machine (mirror transfer) — NEW
| Action | File | Changes |
|---|---|---|
| MODIFY | `packages/headless/src/modules/session/services.ts` | Add `verifyFromLink({ verification }: SessionContext)` → PATCH `clients/{clientId}/emails/{emailId}/check_verify` with `{ reg_hash: hash }` (relocate `checkVerifyEmail` logic here). Add to default export. |
| MODIFY | `packages/headless/src/modules/session/types.ts` | Add `verification?: { clientId; emailId; hash; redirect? }` to `SessionContext`. |
| MODIFY | `packages/headless/src/modules/session/session.machine.ts` | Add global `VERIFY_FROM_LINK` event (+ `setVerification`); add `verifying` state (`processing` invokes `verifyFromLink`, onDone/onError → `processed` with `notify*`; `processed` on `VERIFIED` → `#checking` + `clearVerification`). Import shared feedback helper. |
| CREATE | `packages/headless/src/modules/session/session.feedback.ts` (or util) | Shared `notifyVerificationSuccess` / `notifyVerificationFailure` used by BOTH machines. |
| MODIFY | `packages/headless/src/modules/session/client/client.machine.ts` | Swap inline `notifyVerification*` for the shared helper (no behaviour change). |
| MODIFY | `packages/headless/src/modules/session/useSession.ts` | Add `verifyFromLink({ clientId, emailId, hash, redirect? })`: send `VERIFY_FROM_LINK`, `waitFor` `verifying.processed`/done, return boolean. (Mirror `transferFrom`.) |
| CREATE | `packages/headless/src/modules/session/useVerifyEmail.ts` | Entry-point composable mirroring `useTransfer`: reads params, calls verify, handles redirect. Export from `session/index.ts`. |
| VERIFY | `session/index.ts` + `client-vue` re-exports | New composable/methods reachable; `verifyFromLink` exported. |

### D. Already done
- `### No try/catch around promises` rule in `.agent/rules` + `.claude/rules` (in sync). ✅

## Implementation order

1. [ ] Revert A (3 files) to restore code-only client verification.
2. [ ] Guard B — gating only.
3. [ ] Session types + `verifyFromLink` service (C).
4. [ ] Shared feedback helper; point client machine at it.
5. [ ] Session machine `verifying` state + `VERIFY_FROM_LINK`.
6. [ ] `useSession.verifyFromLink` + `useVerifyEmail` composable + exports.
7. [ ] Typecheck headless + cart; report.
8. [ ] E2E with **pseudo-nathan** (see Testing).

## Acceptance criteria mapping

| Criterion | Verification |
|---|---|
| Link-verify out of the client app | Client machine/`useSession.verifyEmail` are code-only; no link/hash refs |
| Guard never verifies | `guardVerifyEmail` = `isReady` + `isUnverified` gate + reject; no HTTP/feedback/verify call |
| Link-verify lives on the session machine, like transfer | `VERIFY_FROM_LINK` + `verifying` state + `verifyFromLink` service + `useVerifyEmail` |
| Feedback owned by the invoked service | `notify*` fire from session `verifying` onDone/onError (and client onDone/onError for code) |
| No try/catch around promises | No `try/catch` in guard or new service/composable |
| Logged-out capable | `verifyFromLink` path requires no `clientActor`; works without a session |

## Testing — E2E only (per review), pseudo-nathan first

No unit tests. Two-step: **(1)** plan coverage with the **pseudo-nathan** agent (layer fit,
scenarios, brands/flows, fixtures); **(2)** implement specs per ADR 020 Phase B
(`/code-test-e2e`), no raw HTTP mutations (drive app / mock settings).

Candidate scenarios for pseudo-nathan:
- Cart: logged-in unverified client → code form → valid code → verified → proceeds.
- Cart: verified/!unverified client hitting verify-email route → redirected away.
- Cart: guard shows form only when `isUnverified`.
- Session/link (portal-facing capability): logged-out link verify (valid hash) → success
  toast + redirect; invalid hash → failure toast. (Test layer/app TBD with pseudo-nathan —
  may not be a cart E2E at all.)

## DEVX compliance

- [ ] Lodash for array/object ops; `import type` separation; import order external→internal→utils→types.
- [ ] Machine events SCREAMING_SNAKE (`VERIFY_FROM_LINK`, `VERIFIED`); services verbs (`verifyFromLink`).
- [ ] New context type in `session.types.ts`; explicit param/return types; JSDoc on composable return props.
- [ ] No change-narration comments.

## Questions / risks

1. **`useVerifyEmail` vs `useSession.verifyFromLink`** — transfer has both (lightweight entry +
   session method). Build both, or just the `useSession` method until the portal needs the
   entry composable? (Defaulting to: session method now, entry composable when portal lands —
   confirm.)
2. **Shared feedback helper location/name** — `session.feedback.ts` util vs inline duplication.
3. **`check_verify` BE auth** — still unconfirmed; not blocking since the capability is
   session-agnostic by design, but worth confirming the endpoint accepts no-token calls.

---

## Appendix — rule added (done)

`### No try/catch around promises` under `## Error Handling` in
`.agent/rules/code-generation.md` and `.claude/rules/code-generation.md` (byte-identical).
Reserves `try/catch` for non-promise throws (e.g. `JSON.parse`); promises use `.catch()` or
XState `onError`.
