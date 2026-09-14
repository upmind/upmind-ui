# Placeholder audit — what the client-vue refactor will and will not fill

**Date:** 11 September 2026
**Companion to:** [`client-vue-adoption.md`](./client-vue-adoption.md), which this corrects.

Every route in this app that shows a **"Provided by client-vue"** row was audited against
the ADR 023 phase roster, to answer one question: *will each one be filled?*

**No.** Fourteen placeholder sites. **None** is filled by a remaining phase, three are already
done, two are blocked on one decision, and **nine need components that do not exist and are
in no phase** — including the two orders pages, corrected on 2026-09-14 after Phase 8 ran.

This document exists so that is known now rather than at the end of the migration, when the
placeholder count is supposed to reach zero and will not.

---

## 1. The mistake at the root

`client-vue-adoption.md` opens with a sound rule, ruled on 7 September 2026:

> The sandbox mocks what is new. Six client-portal families already exist as
> `@upmind-automation/client-vue` components over `@upmind-automation/headless` modules,
> so this app does not mock them: each of their routes renders one stub row.

The rule is right. Mocking a surface that already exists is wasted work.

It was applied to seven surfaces where **client-vue provides nothing**. Those were never
"not new" — there is no component to wait for. They should have been treated like any other
new surface and mocked, or scheduled as work to build.

Instead each got a row saying *"Provided by client-vue"*, which reads as **waiting for a
move** rather than **needs building**.

### It changed real decisions

This is not only cosmetic. `mock/facades/useMockContacts.ts` records, in its own header:

> The client's contact emails as the REAL scoped collection headless ships (plan R1 (a)),
> kept for the token opt-ins page alone: **phones, addresses and companies are
> client-vue's**.

So the portal **deliberately skipped mocking phones, addresses and companies**, on the
strength of a claim that turned out to be false. That is why the profile page has no mock
today.

### And it misled the migration

ADR 023's Phase 7 (FE-3196) carried an acceptance criterion reading *"the manage kit **and
client-profile views** are re-homed"*. There are no client-profile views. The phase found
none, and — because nothing in its brief told it to stop when there is nothing to move —
**wrote five new files** rather than reporting and halting: `Profile.vue`, `Addresses.vue`,
`Emails.vue`, `Phones.vue` and `components/ProfileManage.vue`.

That work is being taken back out. This migration moves code; it does not author new
surfaces, and a page written that way carries no design review from anyone.

The genuine migration work in that phase stands: the shared `manage` editing kit moved down
into `foundation` on a measured consumer count of two, and the `Address` and `Manage` form
controls moved out of `client-vue`.

---

## 2. The fourteen placeholder sites

### Will be filled by the refactor — 0

**Corrected 2026-09-14.** This section previously listed the two orders pages as Phase 8's. They are not.

| Page | Placeholder names | What happened |
| --- | --- | --- |
| `/billing/orders` | `UpmOrder` | **Not filled.** Phase 8 extracted the component into `packages/invoice` and registered the feature in portal-nuxt, but mounted no organism — see below. |
| `/billing/orders/[id]` | `UpmOrder` | **Not filled.** Same. |

`UpmOrder` reads its invoice id from `route.params.oid` and nothing else — it takes no id prop. The portal's routes are `/billing/orders/[id]`, so the component cannot find an id there. It is also an async-setup component needing a `<Suspense>` boundary, and it renders a cart-shaped page: a hero, a thank-you and a storefront call to action.

So mounting it on a portal orders page needs an **arrangement that does not exist** — a different id source and a different page shape. That is a component to build, exactly like the seven below, and Phase 8 halted rather than writing one. That halt is the correct outcome under the rule Phase 7 broke.

**These two therefore move into the "will NOT be filled" count, making it nine, not seven.**

### Already filled — 3, and these placeholders are now lies

| Page | Placeholder names | Reality |
| --- | --- | --- |
| `AUTH_LOGIN` | `UpmSessionLogin` | `/login` mounts the real organism. The page key is referenced by **no route**. |
| `AUTH_REGISTER` | `UpmSessionRegister` | `/register` mounts the real organism. Page key unrouted. |
| `AUTH_RECOVER` | `UpmSessionRecoverPassword` | `/forgotten-password` mounts the real organism. Page key unrouted. |

**Action:** delete all three from `portal/config/auth-pages.ts`. They are leftovers from
before those routes were rewired, and they inflate the placeholder count by three.

### Blocked on one decision — 2

| Page | Needs | Problem |
| --- | --- | --- |
| `/billing/payment-methods` | `PaymentDetails` · `StoredPaymentMethods` | `PaymentDetails` is published as `UpmPaymentDetails`. `StoredPaymentMethods` is **not exported** from `packages/payment` — its only importer is `PaymentDetails.vue`. |
| Product → Payment method panel | `StoredPaymentMethods` | Same. |

`StoredPaymentMethods.vue` exists at `packages/payment/src/components/`. Two portal surfaces
need it on its own, and ADR 023 Phase 10 deletes `client-vue`, so the old route to it
disappears.

**Decision owed:** publish it from the payment package's barrel — it has two real consumers,
which is exactly the test that package applies — or give those two panels a different
surface.

### Will NOT be filled — 7

Each of these needs a component **written**, not moved.

| Page | Placeholder names | Reality |
| --- | --- | --- |
| Choose a new password | `UpmSessionRecoverPassword` (reset step) | Component exists; the reset-with-token step does not. The placeholder text already says "to be added". |
| Verify your account | `UpmSessionVerify` | Does not exist anywhere. Text already says "to be added". |
| Register your organisation | `UpmSessionRegister` (organisation variant) | Component exists; the organisation variant does not. Text already says "to be added". |
| Logs → email history list | `UpmEmailHistory` | Does not exist. Client-vue's `emailHistory` module was **retired in FE-3103**, so there is nothing to move. |
| Email detail | `UpmEmailHistory` (detail) | Same. |
| Product → Setup | `UpmProductSetup` | Exists, but it is the **basket funnel's repair step** — route `BASKET_PRODUCTS_SETUP`, driven entirely by basket state. This page is post-purchase, for a product the client already owns, with no basket. Two surfaces, one name. See **FE-3219**. |
| Account → Profile | `UpmBilling` manage lists | The editing parts exist and are moving to `foundation`. The **profile page itself does not exist**. |

---

## 3. What "done" should look like

When ADR 023 completes, every one of these routes should render either a **mock** or a
**real component** — and never a "Provided by client-vue" row, because there will be no
client-vue.

The rule that decides which, per the operator on 11 September 2026:

> If we have the component and the composable ready, we should use it. Otherwise we mock it.

Applied to the seven above, **every one is "mock it"** — their data layers are ready and
their components are not. For the profile page specifically the data layer is not merely
present but complete: `client-address`, `client-email`, `client-company`, `client-phone` and
`client-personal-details` each ship a list composable *and* a manager machine for add and
edit.

### One thing the profile build will need to know

Recorded staging traffic for all four collections already exists, captured into the
headless units' own `fixtures/` directories — `client-address`, `client-email`,
`client-company`, `client-phone` and `session-store`.

It is captured there and nowhere else on purpose: `pnpm fixtures:generate <unit>` resolves
both its generator and its output directory under `packages/headless/src/modules/<unit>/`
only. There is no capture path that writes into a domain package, so a pool co-located with
a test could only be a hand-copy that drifts from the one the tool maintains.

Each collection was captured twice — the list a panel opens with, and the single-row read
behind it. The two carry **different rows**, which is what makes re-hydration visible: a
panel resolving its selection through the single read shows one row, a panel taking the list
row straight shows another. Both render; only one matches the recording.

### Checklist to reach parity

- [ ] Delete the three out-of-date placeholders (`AUTH_LOGIN`, `AUTH_REGISTER`, `AUTH_RECOVER`).
- [ ] Decide `StoredPaymentMethods`: publish from `packages/payment`, or re-plan those two panels.
- [ ] Wire `/billing/payment-methods` and the product renewal-card panel once that is settled — both components then exist, so by the rule they are used, not mocked.
- [x] Mock the profile page's four collections. This needs the three the portal skipped — **phones, addresses and companies** — added to its mock layer, and `useMockContacts`' header corrected.
- [x] Mock password reset, email verification and organisation registration.
- [x] Mock the email-history list and detail.
- [ ] Mock the post-purchase product setup form, and stop naming `UpmProductSetup` for it.
- [ ] Rewrite every remaining placeholder so it names what is missing and what already exists to build against, rather than implying a move is coming.
- [ ] Re-run this audit at Phase 10 and confirm the count is zero.

---

## 4. Already corrected

- `client-vue-adoption.md`'s mounts table no longer promises `UpmProductSetup` for the
  product setup page, and its gap list explains that the two surfaces share a name and
  nothing else.
- **FE-3219** records the product-setup finding and rules the module into `basket` (Phase 9).
- **FE-3222** carries this audit in the tracker.
- ADR 023 **Amendment 3** records the renderer-placement test that the same investigation
  produced.

## 5. Still open

- The seven surfaces above, none of which is in any ADR 023 phase.
- The `StoredPaymentMethods` decision.
