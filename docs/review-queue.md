# Review Queue Tracker

> Personal tracker for `dominic.dacosta` — Linear "Needs Review" issues + open MRs in `upmind/upmind-monorepo`.
> Last updated: **2026-05-05** (AM)

Legend:
- 🟢 done today | 🔄 in progress / partially landed | ⏳ pending
- 🔴 Urgent | 🟠 High | 🟡 Medium | 🟢 Low | ⚪ none

---

## ✅ Closed today

| Linear | MR | Pts | Pri | Notes |
|---|---|---|---|---|
| [FE-1269](https://linear.app/upmind-automation/issue/FE-1269) | !373 | 3 | 🟠 | Basket refresh optimisation. Fixed currency-empty-products bug + added `isPricesUpdating` skeletons. |
| [FE-2317](https://linear.app/upmind-automation/issue/FE-2317) | !413 | 1 | 🟡 | Discount in `add_to_cart`/`remove_from_cart` dataLayer. Verified live both tax modes. |
| [FE-2554](https://linear.app/upmind-automation/issue/FE-2554) | !412 | 1 | 🟡 | Redirect to `platformUrl` on no-tenant. Added 4xx no-retry to QueryClient (perf bonus). |
| [FE-2621](https://linear.app/upmind-automation/issue/FE-2621) | !414 | 1 | 🟢 | 2FA modal close on 429. Bundled into FE-2638. |
| [FE-2638](https://linear.app/upmind-automation/issue/FE-2638) | !424 | 1 | 🟢 | OTP autocomplete (TOTP/Email) + clear-on-failure (Email only via `isEmailTwofa` guard). Includes FE-2621. |
| [FE-2563](https://linear.app/upmind-automation/issue/FE-2563) | !415 | 2 | 🟡 | `sub_pids` normalisation (array/string/CSV) + recommendation add resolves to attributes/options + parent-term inheritance. |
| [FE-2660](https://linear.app/upmind-automation/issue/FE-2660) | !427 | 2 | 🟠 | Reviewed (Rhodri's MR). Stripe `amount_too_small` surfaces; gateway `cleanupSdk` idempotent. |
| [FE-1365](https://linear.app/upmind-automation/issue/FE-1365) | !375 | — | — | Merged develop in (no other code changes by me today). |

---

## ⏳ Tomorrow's queue — sorted by size × urgency

### 🥇 Top priorities (small + High)

| # | Linear | MR | Pts | Pri | Status | Action |
|---|---|---|---|---|---|---|
| 1 | [FE-2661](https://linear.app/upmind-automation/issue/FE-2661) | !419 (Draft, Rhodri) | 3 | 🟠 | MR open (Draft) | Password field redesign (cart aligns with widgets). Review Rhodri's MR. |
| 2 | [FE-1698](https://linear.app/upmind-automation/issue/FE-1698) | !416 | 3 | 🟡 | 🔄 In review | Lazy `useSystem`. Reviewed + test cases posted 2026-05-05. Awaiting QA + merge. |

### 🥈 Medium (5pt)

| # | Linear | MR | Pts | Pri | Status | Action |
|---|---|---|---|---|---|---|
| 3 | [FE-1424](https://linear.app/upmind-automation/issue/FE-1424) | !411 | 5 | 🟠 | MR open | Honour in-situ catalogue add. Review. |
| 4 | [FE-1329](https://linear.app/upmind-automation/issue/FE-1329) | !426 → FE-1365 | 5 | 🟠 | MR open | Enforce email verification (BOS). Goes into FE-1365 not develop. |
| 5 | [FE-2654](https://linear.app/upmind-automation/issue/FE-2654) | !408 (Draft, Rhodri) | 5 | 🟠 | MR open (Draft) | Basket product card redesign. Review Rhodri's MR. |
| 6 | [FE-1565](https://linear.app/upmind-automation/issue/FE-1565) | — | 5 | 🟡 | No MR yet | Product cards: configure if invalid, auto-add if valid. |
| 7 | [FE-2636](https://linear.app/upmind-automation/issue/FE-2636) | !417 | 5 | 🟢 | MR open | Extract shared `useCalculate` composable. Refactor. |

### 🥉 Larger (8pt)

| # | Linear | MR | Pts | Pri | Status | Action |
|---|---|---|---|---|---|---|
| 8 | [FE-2539](https://linear.app/upmind-automation/issue/FE-2539) | — | 8 | 🟠 | No MR yet | `SmartDomainField` component + machine evolution. |
| 9 | [WOM-22](https://linear.app/upmind-automation/issue/WOM-22) | — | 8 | 🟠 | No MR yet | Real-time domain availability check before basket add. |

### Unsized but High-priority

| # | Linear | MR | Pts | Pri | Status | Action |
|---|---|---|---|---|---|---|
| 10 | [FE-2263](https://linear.app/upmind-automation/issue/FE-2263) | !423 | — | 🟠 | MR open | Conditional visibility for recommendations. |
| 11 | [FE-2655](https://linear.app/upmind-automation/issue/FE-2655) | !410 | — | 🟠 | MR open | Conditional rules for `@context` settings. |
| 12 | [FE-1567](https://linear.app/upmind-automation/issue/FE-1567) | — | — | 🟠 | No MR yet | Warning popups → banner on basket/checkout. |
| 13 | [WOM-26](https://linear.app/upmind-automation/issue/WOM-26) | — | — | 🟠 | No MR yet | Domain search migration to new `/suggestions` endpoint. |

---

## 👀 MRs where you're a reviewer (Rhodri / others)

| MR | Linear | State | Notes |
|---|---|---|---|
| !427 | [FE-2660](https://linear.app/upmind-automation/issue/FE-2660) | Draft | Stripe `amount_too_small` — reviewed today, ready to come out of Draft |
| !419 | [FE-2661](https://linear.app/upmind-automation/issue/FE-2661) | Draft | Password renderer — pending |
| !408 | [FE-2654](https://linear.app/upmind-automation/issue/FE-2654) | Draft | Basket upsells redesign — pending |

> Run `glab mr list --reviewer dominic.dacosta` to refresh this section.

---

## 📊 Suggested order for tomorrow

1. **Knock out the 3-pointers** — FE-1698 (review only) + FE-2661 (likely small implementation). Quick wins.
2. **Tackle one 5-pointer** — FE-1424 or FE-2636 (refactor — clean review). Avoid FE-1329/FE-1565 unless paired with related work.
3. **WOM tickets** are larger — schedule deep-work blocks if BE side is ready.
4. **FE-2539 SmartDomainField** is the biggest refactor — needs design alignment first.

---

## 🔁 Workflow recap (per ticket)

For each open MR / Linear issue:
1. `git checkout` branch + `git merge origin/develop`
2. Resolve conflicts (see prior session for submodule patterns)
3. `/story-review` walkthrough
4. Generate manual test cases → post as Linear comment
5. Live-verify if possible (e.g. `http://collabstudio.localhost:5173`)
6. Push + ensure MR exists / is up to date

---

## 📝 Update log

- **2026-05-04** — Initial creation. Cleared 7 tickets. Queue sorted for tomorrow.
- **2026-05-04 (PM)** — Added section for MRs where I'm reviewer (!427, !419, !408 — all Rhodri, Draft).
- **2026-05-05 (AM)** — Closed FE-1698 (lazy `useSystem`).
