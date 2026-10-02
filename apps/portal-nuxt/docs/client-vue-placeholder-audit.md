# Placeholder audit — what the client-vue refactor will and will not fill

**Date:** 11 September 2026. **Re-counted:** 15 September 2026.
**Companion to:** [`client-vue-adoption.md`](./client-vue-adoption.md), which this corrects.

Every route in this app that shows a **"Provided by client-vue"** row was audited against
the ADR 023 phase roster, to answer one question: *will each one be filled?*

The original answer was no, with fourteen placeholder sites and nine of them needing a
component that does not exist and is in no phase.

**Six pages and two panel rows remain.** Eight sites closed between 11 and 15 September,
because those surfaces were mocked directly on `develop` rather than waiting for a phase.

What is left: three auth rows that are still live on develop but orphaned on the ADR 023 stack,
one page and two panel rows waiting on a barrel export that is already agreed, and two pages
blocked on one small defect.

**Read every row below with the branch in mind.** Develop carries none of the ADR 023
packages, so a surface the stack fills with a real component is still a placeholder there.
An earlier draft of this document mixed the two states and called three live rows dead.

This document exists so the remainder is known now rather than at the end of the migration,
when the placeholder count is supposed to reach zero and will not reach it on its own.

---

## 1. The mistake at the root

`client-vue-adoption.md` opens with a sound rule, ruled on 7 September 2026:

> The sandbox mocks what is new. Six client-portal families already exist as
> `@upmind-automation/client-vue` components over `@upmind-automation/headless` modules,
> so this app does not mock them: each of their routes renders one stub row.

The rule is right. Mocking a surface that already exists is wasted work.

It was applied to surfaces the rule does not cover. Three had **no `client-vue` component at
all** — verify your account, and the two email-history pages, whose module was retired in
FE-3103. Four more had a component for a *different* surface: a password recover form but no
reset-with-token step, a register form but no organisation variant, a product setup step
belonging to the basket funnel, and profile row renderers arranged for the checkout billing
screen.

Either way the row was wrong. *"Provided by client-vue"* reads as **waiting for a move**. For
three of these there was nothing to wait for, and for four the thing that arrives does not fit
the surface it was promised to.

### The profile page is a different case, and an earlier draft of this document got it wrong

`mock/facades/useMockContacts.ts` records, in its own header:

> The client's contact emails as the REAL scoped collection headless ships (plan R1 (a)),
> kept for the token opt-ins page alone: **phones, addresses and companies are
> client-vue's**.

**That claim is correct.** An earlier draft of this document called it false and used it as
the example of the root mistake. It is not an example of the mistake.

`client-vue` held `AddressItem.vue`, `CompanyItem.vue` and `PhoneItem.vue` in
`src/modules/billing/components/`. They now sit in `packages/modules-client/src/rows/`, and the
generic frames they fill — `List`, `Item`, `Form`, `Manage`, `Select`, `Actions`,
`Skeleton` — sit in `packages/modules-foundation/src/modules/manage/`, where Phase 7 put them.

So the profile page's parts exist, and any package may now reach them. What never existed is
the **page** that arranges them for an account-settings context rather than a checkout
billing screen.

They moved on Phase 7's own branch rather than in a later cleanup, because Phase 7 is where
the frames moved and it missed the rows those frames draw. It scoped by folder: the frames
sat in a shared `components/manage/` directory, the rows in a feature directory.

The move needed a ruling, and it took two goes. §2 admits to `foundation` on a measured
count of two or more domain-package consumers, and each row knows one subject, which §2's
second half does not admit at all. Amendment 4 proposed a route on genericness alone, for
rows it read as stranded: one consumer, `client-vue`'s billing module, which Phase 9
re-homes into `basket`, and no `basket → client` grant to let a second appear.

They were stranded only by the grant matrix, so the matrix is what changed.
**ADR 023 Amendment 7 (2026-09-17, ratified)** withdraws
Amendment 4, grants `basket → client`, and sends the three rows to `packages/modules-client/src/rows/`.
The frames stay in `foundation` on the count they really pass.
**FE-3219**: one component, two surfaces.

### And it misled the migration

ADR 023's Phase 7 (FE-3196) carried an acceptance criterion reading *"the manage kit **and
client-profile views** are re-homed"*. There are no client-profile views. The phase found
none, and — because nothing in its brief told it to stop when there is nothing to move —
**wrote five new files** rather than reporting and halting: `Profile.vue`, `Addresses.vue`,
`Emails.vue`, `Phones.vue` and `components/ProfileManage.vue`.

That work was taken back out. This migration moves code; it does not author new surfaces, and
a page written that way carries no design review from anyone.

The genuine migration work in that phase stands: the shared `manage` editing kit moved down
into `foundation` on a measured consumer count of two, and the `Address` and `Manage` form
controls moved out of `client-vue`.

---

## 2. What remains — six pages and two panel rows

Counted from the callers of `clientVuePage` and `clientVueRow` on `develop`.

### Filled on the ADR 023 stack, still live on develop — 3

| Page key | Placeholder names | On develop | On the stack |
| --- | --- | --- | --- |
| `AUTH_LOGIN` (and `AUTH_LOGIN_TWOFA`) | `UpmAuthLogin` | **Live.** `pages/login.vue` renders it through `PortalPageHost`. | `pages/login.vue` mounts `UpmAuthLogin` directly. Key orphaned. |
| `AUTH_REGISTER` | `UpmAuthRegister` | **Live.** | `pages/register.vue` mounts the organism. Key orphaned. |
| `AUTH_FORGOTTEN_PASSWORD` | `UpmAuthRecoverPassword` | **Live.** | `pages/forgotten-password.vue` mounts the organism. Key orphaned. |

**Action: delete them on the stack, not on develop.** Develop carries none of the ADR 023
packages, so those three routes there have nothing else to render. Removing the configs on
develop breaks all three pages. They become dead only once the auth phase rewires the routes.

Note the fourth key: `AUTH_LOGIN_TWOFA` shares the `login` config, so it goes with it.

### Waiting on one export — 1 page, 2 further rows

| Site | Needs |
| --- | --- |
| `BILLING_PAYMENT_METHODS` | `PaymentDetails` · `StoredPaymentMethods` |
| `billing-pages.ts:321` row | `PaymentDetails` |
| `product-pages.ts:525` row | `StoredPaymentMethods` |

`PaymentDetails` is already published as `UpmPaymentDetails`. `StoredPaymentMethods.vue`
exists at `packages/modules-payment/src/components/` but is **not exported** from that package's
barrel — its only importer is `PaymentDetails.vue`.

**Decided (operator, September 2026): publish it.** It has two real portal consumers, which is
exactly the test that package applies to a published symbol. Once it is in the barrel, all
three sites use the real component rather than a mock, because the components exist.

### Needs a component — 2

| Page key | Placeholder names | Reality |
| --- | --- | --- |
| `BILLING_ORDERS` | `UpmOrder` over headless `orders` | Phase 8 extracted the order surface into `packages/modules-invoice`, but the portal cannot mount it. See below. Recorded on !585. |
| `BILLING_ORDER_DETAIL` | `UpmOrder` (detail) | Same blocker. |

**The blocker.** `packages/modules-invoice/src/components/Order.vue:255` reads its id from a fixed route
parameter:

```js
const orderId = route.params?.[QUERY_PARAMS.ORDER_ID]?.toString();
```

`QUERY_PARAMS.ORDER_ID` is `"oid"`. `OrderProps` carries no id, so the id can only arrive
through a route parameter of that exact name. This app's route is
`app/pages/billing/orders/[id].vue`, whose parameter is `id`, so `route.params.oid` is
`undefined` and `useOrder` receives nothing.

The fix is small: accept an optional `orderId` prop and fall back to the route parameter. The
cart keeps working unchanged, and a host with a different route shape can pass the id in.

These two were listed as "filled by Phase 8" until 14 September 2026. Phase 8 ran and could
not fill them.

---

## 3. What "done" should look like

When ADR 023 completes, every one of these routes should render either a **mock** or a
**real component** — and never a "Provided by client-vue" row, because there will be no
client-vue.

The rule that decides which, per the operator on 11 and 15 September 2026:

> If we have the `.vue` component for what we need — essentially, it existed in client-vue
> before — then we should use it. Otherwise we mock it up, so that we can decide on the
> final design before we integrate the real data later.

The test is the **component**, not the composable. A ready headless module is not a reason to
build a surface; it is what the surface will eventually bind to. Until the design is settled,
a mocked surface with mocked data is the right answer, because it can be reviewed without
real data in the way.

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

- [x] Mock password reset, email verification and organisation registration — `reset-password.vue`, `verify-email.vue`, `verify.vue`, and `AUTH_REGISTER_ORG`.
- [x] Mock the email-history list and detail — `account/logs/index.vue` and `account/logs/emails/[id].vue`.
- [x] Mock the profile page — `account/profile.vue` with `mock/forms/profile-context.ts`.
- [x] Mock the post-purchase product setup form, and stop naming `UpmProductSetup` for it.
- [ ] Delete the four orphaned auth keys (`AUTH_LOGIN`, `AUTH_LOGIN_TWOFA`, `AUTH_REGISTER`, `AUTH_FORGOTTEN_PASSWORD`) — **on the ADR 023 stack only**. They are live on develop.
- [ ] Export `StoredPaymentMethods` from `packages/modules-payment`'s barrel. Decided; not yet done.
- [x] `BILLING_PAYMENT_METHODS` stays mocked, and the reason is capability, not a missing export. `UpmStoredPaymentMethods` is published, but headless `payment-details` has **no writes at all** — remove, set-default, auto-payment, rename and verify exist in no service, composable or machine event, and the wire records a `405` on set-default with `PUT` owed on FE-3130. Three drawn facts also have no source: `mapPaymentDetail` drops `sca_verified` and the joined gateway, and nothing reads `inherit_payment_details`.
- [ ] Give `Order.vue` an optional `orderId` prop with a route-parameter fallback, then wire the two orders pages.
- [x] Settle where `AddressItem`, `CompanyItem` and `PhoneItem` land — `client`, on Phase 7's branch, under Amendment 7. Amendment 4 sent them to `foundation` and was withdrawn.
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

- The two orders pages, blocked on the `Order.vue` order-id defect.
- The `StoredPaymentMethods` barrel export, decided but not yet done. It covers one page and two panels.
- The four orphaned auth keys, which need deleting on the stack rather than filling.
- Where the three profile row renderers land in Phase 9.
