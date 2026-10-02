# Affiliate Usage & API

Every composable in this module is scoped. The client composables refuse any actor other than `"client"` and reject `.for(...)`. Only the public barrel (`index.ts`) is importable from outside the module.

| Composable | Purpose |
| --- | --- |
| `useAffiliateActiveAccount` | Publishes the client's own account id |
| `useClientAffiliate` | Account, balance, settings, enrol, withdraw |
| `useAffiliateLinks` | Links list (search, sort, page, delete) |
| `useAffiliateLinkManager` | One link's create / edit form |
| `useAffiliateReferrals` | Referrals list |
| `useAffiliateCommissions` | Pending commissions list |
| `useAffiliatePayouts` | Payouts list |
| `useAffiliatePayoutDestinationManager` | Payout destination and PayPal email form |
| `useAffiliateLinkVisit` | Guest visit, cookie, redirect target |

Each returns the four-layer shape:

```typescript
const module = useClientAffiliate().as("client");

const meta = module.useMeta();       // State flags
const context = module.useContext(); // Computed values
const actions = module.useActions(); // Methods
const internals = module.useInternals(); // Raw state access, for debugging
```

## useAffiliateActiveAccount

```typescript
const source = useAffiliateActiveAccount().as("client");
await source.useActions().isReady(); // resolves true once resolution settled, with or without an id

const { activeAccountId, error } = source.useContext();
const { isAvailable, hasError } = source.useMeta();
```

The id is the `/self` `account_id` when it names one of the client's accounts, otherwise the client's only account. A client with several accounts and no matching `account_id` resolves no id. The id clears and re-resolves on logout, on a session change and on a change of the account list. Server-side (no `window`) the source stays inert.

## useClientAffiliate

### Actions

```typescript
const { isReady, enrol, requestWithdrawal, refresh, invalidate, reset, destroy } =
  useClientAffiliate().as("client").useActions();

await isReady();                  // account id published and account, balance, settings reads settled
await enrol();                    // POST accounts/{a}/affiliate; no-op while already enrolled
const ticketId = await requestWithdrawal({ message: "Please process my withdrawal" });
await refresh();                  // account, balance and settings together
await invalidate();               // marks the account and balance reads stale
reset();                          // clears locally held values and reloads settings
destroy();                        // removes this instance from the registry
```

`requestWithdrawal` resolves the created ticket's id, or `undefined` on failure with the failure on `error`.

### Meta

All `ComputedRef<boolean>` unless noted:

| Flag | Description |
| --- | --- |
| `isLoading` | Account, balance or settings still loading |
| `isProcessing` | Enrol or withdrawal in flight |
| `hasError` | A write failed, or the account or balance read errored |
| `isAvailable` | An account id is active |
| `isComplete` | Not loading, and available |
| `isEmpty` | No affiliate record |
| `isProgrammeEnabled` | Both gate keys are truthy |
| `isEnrolled` | Account id active and affiliate record non-empty |
| `isDisabled` / `isStaged` | The record's `disabled` / `staged_import` flag |
| `hasPayableCommissions` | Combined available balance is non-zero |
| `canWithdraw` | The withdraw setting is truthy and there are payable commissions |
| `balanceAvailable` / `balancePending` / `balanceWithdrawn` | Formatted strings, `""` when absent |
| `affiliateSince` / `linkVisitCount` / `referralCount` | Record fields; counts default to `0` |

### Context

| Value | Type | Description |
| --- | --- | --- |
| `data` | `IAffiliate \| undefined` | The affiliate record |
| `balances` | `IAffiliateBalance \| undefined` | The balance read |
| `brand` | `IBrand \| undefined` | The account's brand, else the brand of the `/self` read |
| `referralOrigin` | `string` | Origin of the brand's `default` oauth client, `""` when none |
| `error` | `ResponseError \| undefined` | Last write or load failure |
| `defaultRedirectUrl` | `string` | The brand's default redirect, `""` when absent |
| `withdrawal` | `{ schema, uischema, defaults }` | Withdrawal form contract; `defaults.message` is prefilled with the available balance |

The shareable link URL is built by the consumer: `` `${referralOrigin.value}/aff/${link.hash}` ``.

## Collections

`useAffiliateLinks`, `useAffiliateReferrals`, `useAffiliateCommissions` and `useAffiliatePayouts` share one shape. Each keys on the active account, resets its criteria when the account changes, and serves no rows while no account is active.

```typescript
const links = useAffiliateLinks().as("client");
await links.useActions().isReady();            // first fetch settled; false while no account is keyed

const { data, error, pagination, query, schemas } = links.useContext();
const { isLoading, isEmpty, isFiltered, hasNextPage, hasPrevPage, hasPages, hasError, isAvailable } =
  links.useMeta();
```

Actions on every collection: `isReady`, `refresh`, `nextPage`, `prevPage`, `setCriteria`, `sortBy`, `invalidate`, `reset`, `destroy`.

Links only: `filters.query(value)` writes `filters.name.like`, and `remove(linkId)` deletes then refetches with the current criteria. A refused delete fills `error`, keeps the row and does not reject.

```typescript
links.useActions().filters.query("spring");
links.useActions().sortBy([{ field: "visit_count", dir: "desc" }]);
links.useActions().setCriteria({ pagination: { limit: 10, offset: 10 } });
await links.useActions().remove(linkId);
```

| Collection | Sort fields | Filters | Default page |
| --- | --- | --- | --- |
| links | `created_at`, `visit_count`, `referral_count` | `name`, `redirect_url`, `visit_count`, `referral_count`, `created_at` | 10 |
| referrals | `created_at` | `created_at`, `affiliate_link.name`, `.redirect_url`, `.visit_count`, `.referral_count`, `.created_at` | 5 |
| commissions | `amount`, `created_at` | `created_at` | 10 |
| payouts | `amount`, `created_at` | `created_at` | 10 |

Rows are raw wire rows (`IAffiliateLink`, `IAffiliateReferral`, `IAffiliatePendingCommission`), except payouts, which are mapped to `AffiliatePayoutRow` (`id`, `createdAt`, `amount`, `amountFormatted`, `success`, `paymentLog`, `destinationName`).

Context exposes the schemas that drive the criteria form: `schemas.query.schema`, `schemas.query.uischema` (links, referrals) and `schemas.query.sortUischema`.

Pure helpers exported from the barrel:

```typescript
import { commissionTagStatus, commissionSummaryStatus } from "@upmind-automation/headless";

commissionTagStatus(row);     // per-row tag order
commissionSummaryStatus(row); // summary order; see Gotchas for how the two differ
```

## useAffiliateLinkManager

```typescript
const draft = useAffiliateLinkManager().as("client").fresh();      // new link
const editor = useAffiliateLinkManager().as("client").withId(linkId); // existing link

await editor.useActions().isReady();   // true when available; false when unavailable; rejects after 15 s
await editor.useActions().update({ name: "Spring", redirectUrl: "https://shop.example.com/order/" });

const { model, schema, uischema, errors, validationErrors, defaultRedirectUrl, brandName } =
  editor.useContext();
const { isDirty, isNew, isValid, hasError, isProcessing, isComplete } = editor.useMeta();
```

Actions: `input`, `update`, `revert`, `onDone`, `isReady`, `clear`, `stop`, `destroy`.

- `update()` resolves with the model on a settled server failure. It does not reject. Read `hasError` and `errors` afterwards. Only a machine that never settles rejects, with a timeout error.
- `errors` joins the per-field messages of a 422 before it falls back to the generic envelope message.
- `update()` called again after a refused save sends the save again.
- A create opens with the brand's default redirect as `redirectUrl` when the brand sets one, and a name of `""`.

## useAffiliatePayoutDestinationManager

```typescript
const manager = useAffiliatePayoutDestinationManager().as("client").fresh();
await manager.useActions().isReady();

const { model, destinations, emails, errors } = manager.useContext();
const { isPaypal, isDirty, defaultDestination, hasError, isProcessing } = manager.useMeta();

await manager.useActions().input({ payoutDestinationId, paypalEmailId });
await manager.useActions().update();           // PUT accounts/{a}, then re-seeds from the saved account
await manager.useActions().addEmail(newEmail); // re-reads the client's emails, chooses the new one
```

- The form seeds from the account's two payout ids. An unset destination (`null`) reads as the brand's default destination for `isPaypal`.
- A PayPal destination with no email chooses the client's default email (else the first email).
- `update()` resolves on a settled server failure, with the edit kept and no re-read. A second `update()` after a refusal sends the save again.
- A destinations or emails read that fails leaves that lookup empty. The form still seeds from the account.
- The manager belongs to the account that was active when it opened. A save for an account the client no longer holds rejects with the "account no longer available" error before any request.
- Open the payout editor and a new-link editor with `.as("client").fresh()`. Open an existing-link editor with `.as("client").withId(linkId)`. The registry keeps an instance until `destroy()`, and it does not count mounted consumers. A remount on the same key without `.fresh()` gets the old instance with its old account and seed.
- Call `destroy()` on each editor when it unmounts, for example in `onUnmounted`.

## useAffiliateLinkVisit

```typescript
const target = await useAffiliateLinkVisit().as("guest").useActions().visit();
window.location.assign(target);

const { target: last } = useAffiliateLinkVisit().as("guest").useContext();
const { hasVisited } = useAffiliateLinkVisit().as("guest").useMeta();
```

`visit(overrides?)` defaults `visitUrl`, `referrerUrl` and `userAgent` from the browser. It never rejects: a failed request resolves the visitor's own origin. It sends the existing `upm_aff` value back to the platform, writes or deletes the cookie from the answer and returns the redirect target.

## Lifecycle

```typescript
const affiliate = useClientAffiliate().as("client");

await affiliate.useActions().isReady();   // wait for the account id and the four reads
affiliate.useActions().destroy();         // remove from the registry when done
```

Managers also expose `stop()` (stops the machine and keeps the registry entry) and `destroy()` (stops and removes).

## Vue Component Integration

```vue
<template>
  <p v-if="isLoading">Loading…</p>
  <p v-else-if="hasError">{{ error?.message }}</p>
  <div v-else-if="!isEnrolled">
    <button :disabled="isProcessing" @click="enrol">Join the programme</button>
  </div>
  <div v-else>
    <p>{{ balanceAvailable }} available, {{ balancePending }} pending</p>
    <button v-if="canWithdraw" @click="withdraw">Withdraw</button>
  </div>
</template>

<script setup>
const affiliate = useClientAffiliate().as("client");
const { error, withdrawal } = affiliate.useContext();
const { isLoading, hasError, isEnrolled, isProcessing, canWithdraw, balanceAvailable, balancePending } =
  affiliate.useMeta();
const { enrol } = affiliate.useActions();
const withdraw = () => affiliate.useActions().requestWithdrawal(withdrawal.defaults.value);
</script>
```

For the schema-driven forms (link editor, payout destination, withdrawal), pass `schema`, `uischema` and `model` to the form renderer and write changes back with `input`.
