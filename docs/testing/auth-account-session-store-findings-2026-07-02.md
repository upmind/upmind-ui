# Test campaign findings — auth · account · session-store

**Date:** 2026-07-02
**Scope:** Unit + integration test backfill for the `auth`, `account`, `session-store` headless modules.
**Method:** ADR-021 split — docs ratified as behavioural spec, test-writers barred from reading implementation, assertions cited to spec/requirements/fixtures. `pseudo-nathan` designed + triaged; three writer agents authored; suites run deterministically ×3.

---

## Status update — 2026-07-03

**F1–F11 are all FIXED** (see each finding below for resolution + file). **F12–F15** (new, found in the 2026-07-04 max-effort branch review) are also all FIXED same session — see below. Genuinely open items remaining after the fix run:

- **AU-I3** (new finding) — empty credentials pass client-side validation and a login POST is still sent. Not fixed.
- **AU-I8 — FIXED (2026-07-03 afternoon, see F11)** — register-flow readiness race (`start("register")` resolved on state-entry, before `register.available` settled); fixed in `useAuth.actions.client.ts`.
- **AU-I6 / AU-I7** — known order-dependent cross-test leak; fixed once (teardown rework), holds in isolation, still flaky in some run orders. Treat as the documented baseline exception.
- **verify-link flow (F10 knock-on)** — `useVerifyEmail` copies the wrong vue-app screen; needs a redesign (await + outcome state + conditional redirect). Tracked as **FE-2984**.
- **labs-nuxt "add another client session"** — `.fresh()` builder modifier shipped 2026-07-03. Manual browser confirmation done (2026-07-03 afternoon): operator's click-through (2 clients + 1 staff) surfaced 3 further bugs, all fixed same session — selector pointer stomp, add-session same-route dead-end, fresh-key remount race (see worklog "2026-07-03 — afternoon"). A regression test proved the store layer was never at fault (active-session switch persists across reload), pinning the revert bug on the playground selector; that probe was merged into `session-store.int.test.ts` in the 2026-07-04 review cleanup (probe file deleted).
- **Account AC-I3–I7** — needed a further diagnosis pass beyond the F5 reconcile fix; not covered by this reconciliation (see worklog for status if run).

## TL;DR

The suite is built, deterministic, and zero-flake. It surfaced **10 genuine product findings** against shipped code — including all four of the ratified multi-session requirements failing. Every red test is a cited finding; every skip is a documented omission. No assertion was weakened to force green.

| Suite | Green | Red (findings) | Skipped (omissions) | Total |
|---|---|---|---|---|
| Unit | 25 | 1 | 0 | 26 |
| Integration | 19 | 14 | 11 | 44 |
| **Total** | **44** | **15** | **11** | **70** |

The 15 reds collapse to **10 distinct findings** (the login-hang class covers 5 tests).

---

## Product findings

Ordered by severity. Each cites its assertion source. "Req N" = the ratified session-store functional requirements (2026-07-02).

### ✅ F1 — FIXED — Second session of a scope evicts the first (multi-session cache broken)
- **Resolution (2026-07-02 overnight):** `reconcileToCookies` narrowed to overlay each scope's cookie-backed active session instead of rebuilding the whole map; non-active cached sessions now survive. `session-store.store.ts`/`.utils.ts`. SS-I6/I7 green.

- **Tests:** `session-store.int.test.ts` SS-I6, SS-I7
- **Behaviour:** Adding a second client session removes the first from `allSessions`; switching back to a cached user is not instant (the token is gone).
- **Breaks:** Req 1 (multiple clients/staff concurrent, one cookie per scope holds the *active* user) + Req 2 (inactive users cached for the whole session, instant zero-round-trip switch).
- **Why it matters:** This is the core of the switch-user-without-relogin feature. As shipped, logging in as a second client silently destroys the first's cached session.

### ✅ F2 — FIXED — Remote login hijacks a tab active as a different user
- **Resolution (2026-07-02 overnight):** fixed as a byproduct of the F1 reconcile-gate fix. SS-S6 green.
- **Test:** `session-store.sync.int.test.ts` SS-S6
- **Behaviour:** A broadcast login of user C overwrites a tab whose active user is B.
- **Breaks:** Req 4 (only login/logout broadcast, applied like-for-like; tabs on a *different* user must be untouched).
- **Why it matters:** Cross-tab session takeover — a tab you left on account B jumps to C without your action.

### ✅ F3 — FIXED — `isAuthenticated()` never settles for a guest session (hang)
- **Resolution (2026-07-02 overnight):** root was the CLIENT half, not guest — `add()` didn't set `initialised:true` so `isReady()` never settled. Fixed in `useSessionStore.actions.ts`. SS-I9 ~2s now.
- **Test:** `session-store.int.test.ts` SS-I9 (bounded to fail fast; would hang indefinitely)
- **Behaviour:** The promise never resolves/rejects for a guest session.
- **Cites:** ss-usage §useActions.
- **Why it matters:** Any caller awaiting auth-state for a guest hangs forever. **This is the root cause of F7** (auth login).

### ✅ F4 — FIXED — Auth login `resolve()` never settles (same hang-class as F3)
- **Resolution:** fixed as a byproduct of the F3 `add()`/`initialised` fix plus the `waitForProcessing` rewrite (final-state settling + `done` as a first-class success token, lodash `some(...,"done")` shorthand bug fixed to `includes`). AU-I1/2/3/5/6 green. Note: AU-I2/AU-I3 needed a further harness/product pass — see worklog 2026-07-03 (AU-I3 empty-credential validation bypass is a distinct new finding, not yet fixed; AU-I2 cross-test isolation was a harness gap, fixed by the teardown rework).
- **Tests:** `auth.int.test.ts` AU-I1, AU-I2, AU-I3, AU-I5, AU-I6 (bounded to fail fast at 5s)
- **Behaviour:** `resolve(credentials)` never settles — the login→session handoff inherits the F3 never-settling promise.
- **Cites:** triage §SS4/A2; auth-usage login contract.
- **Why it matters:** The happy-path login await hangs. Confirmed by diagnostic race: `isReady()` and `start()` settle; only `resolve()` hangs.

### ✅ F5 — FIXED — Account: cookie written + readable, but session never registers
- **Resolution (2026-07-02 overnight):** fixed by the same F1 reconcile-gate fix (store no longer drops a cookie-backed session). AC-I1/I2/I8 green, 30s hangs gone. AC-I3-7 needed a further, separate diagnosis pass (see worklog).
- **Tests:** `account.int.test.ts` AC-I1…AC-I8 (skipped pending fix — bodies complete + cited)
- **Behaviour:** After `persistTokenToStorage(clientToken)` the `upm_client_session` cookie is written **and** `getTokenFromStorage(CLIENT)` returns it, yet `allSessions` stays empty and `activeActor` stays guest. The add/reconcile step drops a cookie-backed client.
- **Verified:** ~10 isolated repros; the exact fresh-import + `initStore` sequence that works in session-store's own tests still drops it here.
- **Why it matters:** Same family as F1 — the store refuses to register a session that is present and valid in the cookie. Blocks the entire account integration arc.

### ✅ F6 — FIXED — Invalid client token does not fall through to the guest floor
- **Resolution (2026-07-02 overnight):** `loadAllSessionUsers` now validates every token at boot, `buildInitialState` drops 401'd sessions + their scope cookie before commit. `session-store.services.ts` + `.store.ts`. SS-I4 green.

### ✅ F7 — FIXED — Impersonation-end does not restore the parent identity
- **Resolution (2026-07-02 overnight):** fixed as a byproduct of the F1 reconcile-gate fix. SS-I11 green.

### ✅ F8 — FIXED — Expiry math mishandles a missing `created_at`
- **Resolution (2026-07-02 overnight):** `getExpiresAt` now returns `null` (was `?? Date.now()`) when `created_at` is absent, so `isTokenExpired` is correctly `true`. `session-store.utils.ts`. SS-U2 + SS-I12 green.

### ✅ F9 — FIXED — Auth `onError` wiring crashes (`subscription` before initialization)
- **Test:** `auth.int.test.ts` AU-I4
- **Behaviour (was):** `ReferenceError: Cannot access 'subscription' before initialization` in the composable's `onError` wiring.
- **Resolution (2026-07-03):** `useAuth.actions.ts` — added a `primed` flag that skips xstate's synchronous first `.subscribe()` emission, so `subscription` is safely assigned before `onError`/`onDone` can fire. Verified honest via a temporary reverted probe (proven not a done-token accident, not a timeout); reproduced the original hang by removing `primed`. AU-I4 green in isolation and in the full run.

### ✅ F10 — FIXED — Verify-link throws on a missing param (violates "never throws")
- **Test:** `auth.int.test.ts` AU-I11
- **Behaviour (was):** `TypeError: Cannot read properties of undefined (reading 'replace')` when the `hash` param is absent.
- **Resolution (2026-07-03):** `useVerifyEmail.ts` — early-return guard added when clientId/emailId/hash missing. **Still open at a design level** — review round 2026-07-03 found the whole flow copies the wrong vue-app screen (registration-activation, not the email-verify screen) and both the redirect-on-any-outcome and the silent no-op need a redesign (await service, surface outcome state, redirect only on success, no swallowed errors). Tracked as **FE-2984**.

### ✅ F11 — FIXED — Register-flow `start()` resolves before the form is ready (AU-I8)
- **Test:** `auth.int.test.ts` AU-I8
- **Behaviour (was):** `start("register")` resolved as soon as the machine merely *entered* the register subtree (prefix match) while still in `register.loading`; a REGISTER submit sent then was silently dropped (only `register.available` handles it) → 30s timeout. Only AU-I8 tripped it — it runs cache-cold (query singleton, 5-min staleTime); AU-I9/AU-I10 ran warm and never hit the race.
- **Resolution (2026-07-03 afternoon):** `start()` now settles on `${flow}.available` (form ready) for all three flows, not on state-entry. `packages/headless/src/modules/auth/useAuth.actions.client.ts`. The old skip-comments blaming a missing `clients_fields` fixture were stale — the fixture already existed on disk.

### ✅ F12 — FIXED — Boot dead-token drop deleted the active session's cookie for a shared scope
- **Test:** `session-store.int.test.ts` T1 (regression, revert-proven)
- **Behaviour (was):** cookies are per-scope, held by the active session; dropping a dead token at boot dumped the scope cookie whenever ANY session of that scope had a dead token, even with a different, live session active — logging the live user out to guest.
- **Resolution (2026-07-04):** `buildInitialState` now dumps the cookie only when the dead session's `actor_id` matches the cookie's. `session-store.store.ts`.
- **Why it matters:** severe — a live user could be logged out to guest by an unrelated dead session sharing their scope.

### ✅ F13 — FIXED — Auto-promoted session never cookie-projected, dropped by the next write's reconcile
- **Test:** `session-store.int.test.ts` T2 (regression, revert-proven)
- **Behaviour (was):** a session auto-promoted by the write gate (e.g. logout of 1-of-2 clients) was never projected to its scope cookie; the next write's reconcile dropped it, losing both sessions.
- **Resolution (2026-07-04):** `updateSession`'s write gate now projects the resolved active client/staff token to its scope cookie when the cookie doesn't already hold it (`persistTokenToStorage sync:false`) — self-heals the "active session is always cookie-backed" invariant. `useSessionStore.actions.ts`.
- **Why it matters:** severe — silent full session loss after a routine logout-of-one-of-two.

### ✅ F14 — FIXED — `start()` blocks the full timeout on a register schema-load failure
- **Test:** `auth.int.test.ts` AU-I14
- **Behaviour (was):** `start()` waited only on `${flow}.available`; a register schema-load failure lands the sibling `register.unavailable` state, so `start("register")` blocked for the full 60s timeout instead of resolving.
- **Resolution (2026-07-04):** settle on `available` OR `unavailable`; verdict = reached `available`. `useAuth.actions.client.ts`.

### ✅ F15 — FIXED — REGISTER submit during `register.loading` silently dropped
- **Test:** `auth.int.test.ts` AU-I15
- **Behaviour (was):** the machine only handled `REGISTER` in `register.available`; a submit received during `register.loading` (reachable via the shared `register()` action and `useInternals().send`) was silently dropped.
- **Resolution (2026-07-04):** `register.loading` stashes the model + a `pendingSubmit` flag; `register.available`'s always-guard replays the queued submit once the form is ready; `loading.onError` clears the flag. `auth.machine.ts` (`AuthContext.pendingSubmit`).

---

## Documented omissions (ADR-021)

Not gaps in coverage — behaviours that cannot be honestly tested yet. Each has an unblock condition.

| Omission | Tests | Reason | Unblock |
|---|---|---|---|
| 2FA flows | (unwritten) | No 2FA staging account | FE-2788 provisions `Logins.email2fa` |
| 5xx handling | (unwritten) | Not reproducible from staging | A recordable 5xx source, or sanctioned synthetic per ADR |
| Staff (`admin/self` 200, scope) | session-store staff cases | Staging rejects the staff creds | Valid staff creds on staging |
| `clients_fields` 200 | auth AU-I8/9/10 (skipped) | Phase-0 capture returned **401**, not 200 | A client bearer staging accepts for that endpoint |
| Account integration arc | account AC-I1…8 (skipped) | Blocked by **F5** (seam won't register session) | Fix F5, then flip `it.skip`→`it` |

Fixtures are generator-only (23 recordings, `lint:fixtures` green); no hand-edited response bodies. No 5xx or token was faked.

---

## What was delivered

- **Docs baseline** (now the ratified spec): foundation + README/architecture/usage/gotchas/CHANGELOG for all three modules. Fresh-eyes audits: auth 96, session-store 88, account 86 (all pass-with-fixes, fixes applied). Audits under `docs/audit/docs-module-review-*-2026-07-02.md`.
- **Fixtures:** 23 generator-recorded staging fixtures across the three modules, co-located per ADR-025, lint-clean.
- **Tests:** 10 files, 70 tests. tsc + lint clean. Deterministic across 3 consecutive runs (bounded races replace all indefinite hangs).
- **ADR-021 note:** one writer disclosed an over-broad grep that surfaced two implementation identifiers; triage ruled the leaked facts were already doc/types-stated and the assertions non-tautological — accepted-with-note, grep scope tightened. No re-authorship required.

## Recommended next steps

1. **Triage F1/F5 together** — both are the store dropping a valid, cookie-backed session; likely one root cause in the reconcile step. Fixing it flips F1 green and unblocks the 8 skipped account tests.
2. **F3→F4 are one bug** — fix the never-settling guest-auth promise and 6 tests (SS-I9 + AU-I1/2/3/5/6) go green together.
3. **F2** is security-adjacent (cross-tab takeover) — prioritise.
4. Each finding's test is already written and cited — they become the regression guard the moment the code is fixed. No `it.fails`, so a fix turns them green automatically.
