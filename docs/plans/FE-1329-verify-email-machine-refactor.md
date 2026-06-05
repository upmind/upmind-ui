# FE-1329: Route link-based email verification through the session machine

> Refactor of work already on `feature/fe-1329-…`. Story is in **Needs Review**.
> Scope: move link-based email verification out of the funnel guard and into the
> `sessionClient` machine, **unified** with the existing code-based verification —
> one event, one node, one service (a thin dispatcher), one composable function.

## Goal

`guardVerifyEmail` currently performs link-based email verification **inline**: it
calls the standalone `checkVerifyEmail()` HTTP function, fires `addSuccess`/`addError`
feedback itself, manually calls `session.refresh()`, and wraps it all in a `try/catch`.

This violates three of our conventions:

1. **Business logic belongs in the machine, not the guard.** The `sessionClient`
   machine already owns email verification (`unverified.verifying` → `verifyEmailCode`).
   The link path bypasses it entirely.
2. **Feedback must fire from the invoked service's `onDone`/`onError`** — the machine
   already has `notifyVerificationSuccess` / `notifyVerificationFailure` actions doing
   exactly this for the code path. The guard duplicates them.
3. **No `try/catch` around promises.** The machine models success/failure as
   `onDone`/`onError`. The guard re-implements that with `try/catch`.

**Design principle (from review):** verifying an email is *one* operation. Whether the
credential is a typed **code** or a hashed **link** is an input detail, not a separate
flow. So we do NOT split into multiple states / events / composable functions. There is
one `verifying` state, one `VERIFY` event, one `verifyEmail` composable fn, and one
machine service (`verifyEmail`) that dispatches by payload to the correct HTTP call.

## Integration points (read, not guessed)

| Point | File | Current behaviour | Constraint |
|---|---|---|---|
| Funnel guard | `apps/cart/src/router/funnels/engine/services.ts:706-761` | Link path: direct `checkVerifyEmail` + toasts + `try/catch`. Code path: `await isReady()` + flag check (correct) | Guard must return/reject a `FunnelResponse`; routing is its only job |
| Client machine | `packages/headless/src/modules/session/client/client.machine.ts:58-88` | `unverified.idle --VERIFY--> verifying`; `verifying` invokes `verifyEmailCode`, `onDone`→`#available` + `markEmailVerified` + `notifyVerificationSuccess`, `onError`→`idle` + `setError` + `notifyVerificationFailure` | **XState v4: `invoke.src` is NOT conditionally selectable** — branch in the service, keep one node/one src |
| Client services | `packages/headless/src/modules/session/client/services.ts:72-121` | `checkVerifyEmail(clientId, emailId, regHash)` exported standalone (PATCH check_verify); `verifyEmailCode` reads `data.code` (POST verification_code/verify); default export = `{ load, transferTo, verifyEmailCode }` | Keep both HTTP fns single-responsibility; add a thin `verifyEmail` dispatcher as the machine src |
| Session composable | `packages/headless/src/modules/session/useSession.ts:351-366` | `verifyEmail({ code })`: sends `VERIFY`, `waitFor` settle at `available`/`unverified.idle`, returns boolean, native `.catch(() => false)` | Broaden the param to `{ code }` \| `{ clientId, emailId, hash }`; keep it ONE function (re-exported via `client-vue`) |

`checkVerifyEmail` is also currently imported into the funnel's `services.ts`. After
this refactor that import — plus `useI18n`/`useFeedback` in the guard — drop out.

---

## Design-thinking artifact (per `.agent/rules/design-thinking.md`)

### 1. ELI5 the flow (after refactor)

1. **User lands on `/auth/verify-email`** — either via the emailed link
   (`?hash=…&client_id=…&email_id=…`) or to type a code manually.
   - Trigger: route resolves, funnel invokes `guardVerifyEmail`.
2. **Guard waits for the session machine to settle** — `await session.isReady()`
   so the `sessionClient` machine is in `unverified.idle` or `available`, never mid-`loading`.
3. **Guard bails if not authenticated** — `if (!session.meta.value.isAuthenticated) return Promise.reject()`.
   Verify-email is only meaningful for a logged-in client; with no session the route is
   irrelevant, so we reject and let the funnel redirect away (through auth).
4. **Link path only — guard asks the composable to verify** —
   `await session.verifyEmail({ clientId, emailId, hash })`.
   - If already `available` (e.g. verified in another tab): short-circuits `true`, no event sent.
   - Else sends `VERIFY` with the params; machine enters `unverified.verifying`.
5. **Machine invokes the `verifyEmail` service (dispatcher)** — branches on payload:
   `code` → `verifyEmailCode`; `hash`+`clientId`+`emailId` → `checkVerifyEmail`.
   - `onDone` → `#available`, fires `markEmailVerified` + `notifyVerificationSuccess` (toast).
   - `onError` → `unverified.idle`, fires `setError` + `notifyVerificationFailure` (toast).
6. **Composable resolves a boolean** — `true` if machine reached `available`, else `false`.
7. **Guard routes only** (no feedback, no HTTP):
   - `true` + `returnUrl` → reject with resolved returnUrl target.
   - `true`, no `returnUrl` → reject (funnel falls through to default).
   - `false` → resolve to `SESSION_VERIFY_EMAIL` (show code form; toast already fired).

Code path (the form): the verify-email page calls `session.verifyEmail({ code })` on
submit — unchanged in shape, just the same single function. Guard for the no-hash landing
is unchanged: `await isReady()` → `isUnverified` ? show form : reject.

### 2. Who owns what

| | |
|---|---|
| **Owns** (machine) | Verification (both credentials), success/failure feedback, `client.primaryEmail.isVerified` flag, transition to `available` |
| **Delegates** (guard → composable → machine) | The act of verifying; the guard never touches HTTP or feedback |
| **Observes** (guard) | Final machine outcome via the boolean from `verifyEmail`; route query params |

The guard becomes a pure router. The composable is the conduit (send event, await settle, return boolean). The machine is the source of truth. The `verifyEmail` service is a coordinator that picks the right HTTP call by payload.

### 3. Question the model

- **`VERIFY` event data** — a union: `{ code: string }` (form) OR
  `{ clientId, emailId, hash }` (link). Read by the `verifyEmail` dispatcher service.
- **`unverified.verifying` state** — UNCHANGED, single node. Represents "verifying the
  email" regardless of credential. We deliberately do NOT split per credential type —
  that would leak input shape into the state chart and invent states with no behavioural
  difference (both end at `#available` / fall back to `idle`).
- **`verifyEmail` service** — thin dispatcher; the two HTTP fns (`verifyEmailCode`,
  `checkVerifyEmail`) keep single responsibility.
- **No new context, no new event, no new state, no second composable fn.**

### 4. Artifact first

```text
 VERIFY  { code }  |  { clientId, emailId, hash }
    │
 loading ─requiresEmailVerification─► unverified.idle
                                          ├── VERIFY ─► verifying ──(verifyEmail dispatcher)──┐
                                          │                 │                                  │
                                          │                 ├─ data.code        → verifyEmailCode (POST)
                                          │                 └─ data.hash/ids    → checkVerifyEmail (PATCH)
                                          │                 │
                                          │              onDone ─► #available  (+ markEmailVerified, notifyVerificationSuccess)
                                          │              onError ─► idle        (+ setError, notifyVerificationFailure)
                                          └── CANCEL ─► #loading
```

### 5. What's missing / edge cases

- **Machine in `available` when guard runs** (already verified): `verifyEmail` (composable)
  must short-circuit `true` *before* sending `VERIFY` (event would be ignored in
  `available`, `waitFor` would still pass). Handled in step 4.
- **No session** (unauthenticated hitting a link): guard bails at step 3
  (`!isAuthenticated → Promise.reject()`) — verify-email is irrelevant without a logged-in
  client, so the funnel redirects away (through auth). ✅ **Decided.** Behavioural change
  vs today (today fires the POST regardless) — accepted.
- **`enforceEmailVerification` brand setting off**: machine never enters `unverified`,
  so link path short-circuits `true` (already `available`). Acceptable.
- **Dispatcher with neither code nor hash**: rejects with a `DetailedError`
  (`Unprocessable_Entity`) → `onError` → `idle` + failure toast. Mirrors today's empty-code reject.
- **`waitFor` timeout (60s)**: inherited from `verifyEmail`; on timeout `.catch(() => false)`.

---

## Files to create/modify

| Action | File | Changes |
|---|---|---|
| MODIFY | `packages/headless/src/modules/session/client/services.ts` | Extract code logic into `verifyEmailCode(code)` (pure HTTP, single responsibility). Add `verifyEmail(_ctx, { data })` dispatcher: `data.code` → `verifyEmailCode`; `data.hash`+`clientId`+`emailId` → `checkVerifyEmail`; else reject `DetailedError`. Default export: replace `verifyEmailCode` with `verifyEmail`. |
| MODIFY | `packages/headless/src/modules/session/client/client.machine.ts` | `verifying.invoke.src`: `verifyEmailCode` → `verifyEmail`. No new node/event/action. |
| MODIFY | `packages/headless/src/modules/session/useSession.ts` | Broaden `verifyEmail` param to `{ code: string }` \| `{ clientId: string; emailId: string; hash: string }`. Short-circuit `true` if already `available`. Send `VERIFY` with the payload; `waitFor` settle; return boolean; `.catch(() => false)`. Same single function — no new export. |
| MODIFY | `apps/cart/src/router/funnels/engine/services.ts` | Rewrite `guardVerifyEmail`: `await isReady()` → bail if `!isAuthenticated` → link path `await session.verifyEmail({ clientId, emailId, hash })` + routing only → code path unchanged. Remove inline `checkVerifyEmail`, `try/catch`, `addSuccess`/`addError`, `session.refresh()`. Drop now-unused imports (`checkVerifyEmail`, `useI18n`, `useFeedback` if unused elsewhere). |
| VERIFY | `packages/headless/src/modules/session/index.ts` & `client-vue` re-exports | `verifyEmail` reachable; `checkVerifyEmail` export stays (used by dispatcher) or mark internal. |
| MODIFY (rule) | `.agent/rules/code-generation.md` + sync `.claude/rules/` | Add "No try/catch around promises" antipattern section (see appendix). |
| FOLLOW-UP | cart-nuxt / hosting / velia funnel `services.ts` | Replicate the guard change only (machine lives in shared `headless`). Separate task. |

## Implementation steps

1. [ ] `verifyEmail` dispatcher + `verifyEmailCode` extraction + default-export swap (`client/services.ts`).
2. [ ] `verifying.invoke.src` → `verifyEmail` (`client.machine.ts`).
3. [ ] Broaden `verifyEmail` composable param + short-circuit (`useSession.ts`); verify `client-vue` re-export.
4. [ ] Rewrite guard (auth bail + link `verifyEmail` + routing) + remove dead imports (`funnels/engine/services.ts`).
5. [ ] Draft try/catch rule into `code-generation.md`; run `/agent-sync` to mirror to `.claude/rules`.
6. [ ] Plan E2E coverage with **pseudo-nathan** agent → implement specs (see Testing).
7. [ ] Replicate guard change to cart-nuxt / hosting / velia (follow-up).

## Acceptance criteria mapping

| Criterion | Verification |
|---|---|
| Verification unified | One `VERIFY` event, one `verifying` node, one `verifyEmail` composable fn, one `verifyEmail` machine src |
| Link verification goes through the machine | `guardVerifyEmail` contains no `checkVerifyEmail`/HTTP call; only `verifyEmail` |
| Feedback fires from invoked service onDone/onError | No `addSuccess`/`addError` in guard; toasts come from `notifyVerification*` machine actions |
| Guard only awaits + routes | Guard body = param read + auth bail + `await` + `FunnelResponse` returns |
| No try/catch around promises | `guardVerifyEmail` has no `try`/`catch` |
| HTTP services single-responsibility | `verifyEmailCode` and `checkVerifyEmail` each hit one endpoint; `verifyEmail` only dispatches |

## Testing — E2E only (per review)

No unit tests for this change. **Two-step:**

1. [ ] **Plan with `pseudo-nathan`** — engage the pseudo-nathan agent to design the E2E
   coverage (test-layer fit, scenarios, which brands/flows, existing fixtures). Do not
   author specs before this.
2. [ ] **Implement** the agreed `.spec.ts` per ADR 020 Phase B (`/code-test-e2e`), no raw
   HTTP mutations against staging (drive the app / mock settings).

Candidate scenarios to put to pseudo-nathan:

- Link landing (valid hash) → auto-verifies → toast → redirect to `returnUrl`.
- Link landing (invalid/expired hash) → failure toast → code form shown.
- Code entry (valid) → verified → proceeds.
- Unauthenticated hitting the verify-email route → bailed/redirected to auth.
- Already-verified client hitting the route → redirected away (no re-verify).

## DEVX compliance

- [ ] Lodash for any array/object ops; `import type` separation; import order external→internal→utils→types.
- [ ] Machine event naming: existing `VERIFY` (SCREAMING_SNAKE); service `verifyEmail` (verb).
- [ ] No new types outside `*.types.ts`; explicit param/return types on the dispatcher + composable union param.

## Questions / risks

1. **`checkVerifyEmail` export** — keep public (used by dispatcher) or mark `@internal`. Low stakes.
2. **Composable union param** — `verifyEmail({ code }) | verifyEmail({ clientId, emailId, hash })`; ensure the verify-email form caller still type-checks with `{ code }`.

---

## Appendix — draft rule: No try/catch around promises

> For `.agent/rules/code-generation.md` (Error Handling section), then `/agent-sync`.

**Never wrap a promise in `try/catch`.** Use the promise's own `.catch()` / `.then()`,
or — in XState — model failure as the invoked service's `onError`. `try/catch` is
reserved for the rare case where no promise or native catch is available (e.g. `JSON.parse`,
synchronous throws).

```ts
// WRONG — try/catch around a promise
try {
  await verify();
  addSuccess(...);
} catch (e) {
  addError(...);
}

// RIGHT — native catch / machine onError owns the outcome
const ok = await session.verifyEmail(params); // machine fires feedback
if (!ok) return { target: { name: ROUTE.SESSION_VERIFY_EMAIL } };
```

**Why:** `try/catch` around awaited promises hides control flow, duplicates error
handling the machine/composable already owns, and tempts side effects (toasts, redirects)
into layers that should only orchestrate. Outcomes belong to the owning service.
