# Affiliate Module

A client's own affiliate programme: enrol, see the balance, manage referral links, review referrals, commissions and payouts, request a withdrawal, choose the payout destination. It also records an anonymous visitor's referral-link visit.

## What Is This? (ELI5)

Think of a shop that pays people for sending customers. The affiliate module is the signed-in customer's counter for that scheme.

- **Enrol** = sign up for the scheme.
- **Links** = business cards with a tracking code. Each visit and each customer who arrives from a card is counted.
- **Commissions** = what the shop owes for those customers, not yet approved.
- **Payouts** = what the shop has already paid.
- **Withdraw** = ask the shop to pay the available balance. The shop opens a support ticket.
- **Visit** = a stranger opens a card. The shop writes a tag (a cookie) on them and sends them on to the shop page.

> **🧪 For Testers:** Most mistakes hide in the "account is not enrolled", "brand has no default redirect" and "settings failed to load" paths. Read [Gotchas](./docs/gotchas.md) first, and the unproven list below.

> **👩‍💻 For Developers:** The module addresses the client's own account only. There is no account switching, no staff cell and no `.for(...)` retargeting. Every composable resolves the account from the session by itself.

## Quick Start

```typescript
const affiliate = useClientAffiliate().as("client");
await affiliate.useActions().isReady();

const { data, balances, referralOrigin } = affiliate.useContext();
const { isEnrolled, canWithdraw } = affiliate.useMeta();

if (!isEnrolled.value) await affiliate.useActions().enrol();
```

See [Usage](./docs/usage.md) for the complete API.

## Features

| Feature | Status | Notes |
| --- | --- | --- |
| Own-account resolution (session account) | ✅ | Clears on logout and on session change. The only-account fall-back is listed below as unproven |
| Account read, enrolment, balance, statistics | ✅ | A 404 reads as "not enrolled" |
| Programme gate and area settings | ✅ | Flat dotted brand configuration keys |
| Links: list, search, sort, page, create, edit, delete | ✅ | Editor opens dirty on create |
| Referrals, pending commissions, payouts | ✅ | Criteria-driven lists; payout rows mapped |
| Withdrawal request | ✅ | Returns the support ticket id |
| Payout destination and PayPal email editor | ✅ | Re-seeds from the saved account |
| Guest referral-link visit and `upm_aff` cookie | ✅ | Raw cookie, top-level domain |
| Disabled account condition | ✅ | A disabled account reads `isDisabled` true, enrolled, not staged, no error |
| Empty (never saved) payout destination inherits the brand default | ✅ | Proven on a brand whose default is PayPal: PayPal is offered and a PayPal email is required |
| PayPal destination with no email preselects the default email on open | ✅ | Proven on a client with an empty destination and no PayPal email |
| Emails list replacement after adding an email | ✅ | The list read after the add replaces the earlier list; the unsaved destination choice is kept |
| Brand default redirect pre-fill on a new link | ✅ | Proven on a brand that sets one; a brand without one opens the redirect empty and the editor still opens dirty |
| Staged account condition | ⏳ | wired, not proven: no staged account could be read |
| Fallback to the only account when `/self` has no account id | ⏳ | not proven |

The `⏳` rows are tagged in `__tests__/affiliate.feature` as pending scenarios. They describe wired behaviour with no recording that proves it. A stored PayPal destination with no PayPal email is unreachable in practice, so no state exists to record.

## Key Concepts

### Active account

Every composable keys its requests on one account id, published by `useAffiliateActiveAccount`. It is the session's own `/self` account id when that names one of the client's accounts, otherwise the client's only account. A client with several accounts and no matching own-account id has no active account, and every read stays idle.

### Not enrolled is a state

The account and balance reads treat a 404 as an empty success. `isEnrolled` is true only when an account is active and the affiliate record is non-empty.

### Actor Types

The module follows the scoped composable pattern, with a narrow matrix. Every client composable refuses any actor other than the client and exposes no `.for(...)` context.

```typescript
// The client's own affiliate account and collections
const links = useAffiliateLinks().as("client");

// Link editor: a new link, or an existing one
const draft = useAffiliateLinkManager().as("client").fresh();
const edit = useAffiliateLinkManager().as("client").withId(linkId);

// Guest visit: no session read, same request for every actor
const target = await useAffiliateLinkVisit().as("guest").useActions().visit();
```

## Documentation

| Doc | Audience | Content |
| --- | --- | --- |
| **This README** | Everyone | Overview, concepts, quick start, unproven list |
| [Foundation](./docs/foundation.md) | Anyone rebuilding the platform | Endpoints, data shapes, flows, lessons, stack-neutral |
| [Usage](./docs/usage.md) | All Devs (incl. external) | API reference, examples |
| [Architecture](./docs/architecture.md) | Internal / Contributors | Files, data flow, dependencies |
| [Gotchas](./docs/gotchas.md) | All | Edge cases, known issues |
| [Changelog](./docs/changelog.md) | All | Version history |
