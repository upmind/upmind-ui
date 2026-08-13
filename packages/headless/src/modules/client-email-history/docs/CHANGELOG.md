# Changelog

All notable changes to the `client-email-history` module are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

- **`useClientReceivedEmails`** and **`useClientReceivedEmail`** rebuilt as scoped composables — `.as('client')` resolves the calling client's own history; `staff` and `guest` are compile-time errors on both scope matrices, because the underlying endpoints have no client-targeted or staff-targeted form to give them.
- **`useActions().filters.status(status?)`** on the collection — a typed runtime action for narrowing to sent / bounced / error, replacing a raw wire-key object built by the caller.
- **`useContext().findOne()` / `.getOne(id)`** on the collection — row lookups over the loaded list.
- **`useActions().destroy()`** on both composables — releases a scoped instance so a fresh `.as()` / `.for()` call mints a new one, per the scope registry's own lifecycle.
- **`useInternals()`** on both composables — debug access to the raw backing query.

### Changed

- **Identity now resolves from the scope context, never from a global flag.** The prior implementation chose between a plain endpoint and an admin-prefixed variant using a process-wide setting; both variants were always self-shaped (neither ever addressed a different client's history), so the admin-prefixed variant is removed rather than carried forward, and the endpoint choice no longer depends on anything outside the resolved scope.
- **The single email read gained the same availability gate the collection already had.** It previously reported itself as always available while sending a token-bearing request that could still 401 on the wire; it now answers "is this mine to read?" with the exact same predicate the collection uses.
- **`isReady()` on both composables always settles.** It previously polled on an interval that never resolved once a read was gated, which could hang a caller waiting on it forever; it now resolves the addressability question first, then waits on a fetch that is actually coming.
- **`refresh()` on both composables rejects with a typed error** when the scope cannot address a client, instead of silently returning nothing.
- **Every collection meta flag is a named computed**, not a spread of the backing query's own `meta` object — `hasError`, `isAvailable`, `isEmpty`, `isLoading`, `hasNextPage`, `hasPrevPage`, `hasPages`.
- **`sort()` with no argument re-applies the default order explicitly**, rather than clearing the sort parameter off the wire entirely.
- **Documentation refreshed against the shipped surface** — README, usage, architecture, gotchas and foundation now describe both composables, the real recorded fixtures, and the real failure modes.

### Removed

- **The admin-prefixed endpoint variant** (previously selected by a process-wide flag). Both endpoints it selected between were always self-shaped — neither ever addressed a different client's history — so nothing that ever varied by actor or context was removed; see [architecture.md](./architecture.md) for the identity-resolution mechanism that replaces it.
- **Toast and notification feedback.** No action in this module raises a success or error message. Errors are captured as state; the consumer raises its own feedback.

### Withdrawn (before this became the shipped surface)

An earlier iteration of this rebuild carried a deep-linked-pagination capability and the shared-platform additions that backed it. Both were withdrawn before this became the shipped surface, so a reader who saw an earlier draft of this module is not left wondering where they went:

- **`useActions().goToPage(page)`** on the collection — a one-request jump to an arbitrary page, clamped into range rather than throwing at the boundary. The collection's paging surface is now exactly `pagination` / `nextPage()` / `prevPage()`; there is no direct-jump member. A consumer that deep-linked to `?page=N` on load has to walk forward from page 1 instead, or reimplement the jump itself.
- **The count probe.** The row-carrying list request previously carried `skip_count=1` and reported `total: null`, with a second, independent request (`limit=count`) answering the real count — reactive, generation-tagged so a late-resolving probe could never overwrite a newer one's answer. That whole mechanism is gone: the list request now carries no count side-channel, and `total` arrives on the SAME response as the rows.
- **Five platform additions to the shared `query` module** that the two withdrawn capabilities above depended on — an `ItemQuery` type, the `goToPage` member, the count-probe reactivity, its unhandled-rejection guard, and a `total`-fallback fix on the next-page walk. `packages/headless/src/modules/query/useQuery.ts` and `query.types.ts` are untouched by this module now; it consumes the shared platform exactly as every other scoped composable does. The item-level query shape the single read needs (`ReceivedEmailItemQuery`) is declared locally in this module's own types instead.
- This module's pagination and query pattern now follows `product-catalogue`'s (`packages/headless/src/modules/product-catalogue/`): one `list()` call, `placeholderData: keepPreviousData` so a filter/sort/page change keeps the previous rows and total on screen while the next response is in flight, and `enabled` gated on this module's own addressability predicate. See [architecture.md](./architecture.md#platform-additions-this-build-required).
- Two "Fixed" entries from an earlier draft of this changelog — a pagination total that went stale after a filter/sort change, and a next-page walk that could reset a known total to zero — described defects in the now-withdrawn count-probe machinery and the platform patch backing it. Neither defect exists in the shipped surface, because the mechanism they were fixing no longer exists either.

### Recorded fixtures

Eleven request/response pairs captured against a live environment back the documented behaviour:

| Fixture                                                                               | Covers                                                                   |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `get-self-email-history-case-default.json`                                            | the default (unfiltered, unsorted) list read, total on the same response |
| `get-self-email-history-case-page-1.json` / `-page-2.json`                            | paging, `offset=0` / `offset=10`                                         |
| `get-self-email-history-case-subject-sort.json`                                       | sorting by subject, descending                                           |
| `get-self-email-history-query-invoice.json` / `-query-invoice-subject-invoice.json`   | free-text filter, then free-text + subject composed                      |
| `get-self-email-history-filter-sent-true.json`                                        | the "sent" outcome narrowing                                             |
| `get-self-email-history-filter-bounced-true.json`                                     | the "bounced" outcome narrowing (an empty result — see gotchas.md)       |
| `get-self-email-history-filter-error-id-neq-null.json` / `-filter-error-id-null.json` | the "error" outcome narrowing and its complement                         |
| `get-emails-id.json`                                                                  | the single full read, including its rendered body                        |

### Notes

- Both composables act on the calling client's own history only. `staff` and `guest` are compile-time errors in both scope matrices.
- `.for('client', otherId)` is type-reachable on the collection but does not retarget the outbound request — see [gotchas.md](./gotchas.md#1-forclient-otherid-is-type-reachable-on-the-collection--and-does-nothing-youd-expect). This is a deliberately accepted, documented limitation, not a defect awaiting a fix.
- Delivery-outcome precedence (error over bounced over sent over still-sending) and the empty-body handling on the single read are both carried over unchanged from the prior implementation.

### Not captured

- A row carrying both an error id and a bounced flag at the same time — the staging account sampled has zero bounced rows in its entire real history.
- A single email whose nested body comes back empty — every sampled row carried a populated one.

Both are disclosed limitations of what the recorded fixtures could capture, not of what the code does. See [gotchas.md](./gotchas.md#12-known-limitations-in-what-the-recorded-fixtures-could-capture).

---

## Migration Guide

### Calling either composable

**Breaking change:** both composables are now scope-based; a bare call with no `.as()` no longer resolves anything.

```ts
// Before
const history = useClientReceivedEmails();
const email = useClientReceivedEmail({ emailId });

// After
const history = useClientReceivedEmails().as("client");
const email = useClientReceivedEmail().as("client").for("email", emailId);
```

### Reading state flags

**Breaking change:** both composables' state now lives behind `useMeta()` / `useContext()` rather than a single object returned alongside the data.

```ts
// Before
const { data, meta } = useClientReceivedEmails();
if (meta.isLoading) …

// After
const { data } = useClientReceivedEmails().as("client").useContext();
const { isLoading } = useClientReceivedEmails().as("client").useMeta();
```

### Narrowing by delivery outcome

**Breaking change:** the caller no longer builds the wire filter object directly.

```ts
// Before
const filters = { "filter[bounced]": "true" };

// After
history.useActions().filters.status(SentEmailStatus.BOUNCED);
```

### Paging

**Breaking change:** pagination is no longer a constructor-time argument, and there is no direct jump to an arbitrary page — an earlier draft of this rebuild carried a `goToPage(page)` member, but it was withdrawn (see "Withdrawn" above) before this became the shipped surface. Walk forward or backward instead.

```ts
// Before
useClientReceivedEmails({ pagination: { offset: (urlPage - 1) * 10 } });

// After
const history = useClientReceivedEmails().as("client");
history.useActions().nextPage(); // or .prevPage() — one page at a time
```

### Waiting for readiness

```ts
// Before — could hang forever once the read was gated
await new Promise(resolve => {
  const interval = setInterval(() => {
    if (!meta.isLoading) {
      clearInterval(interval);
      resolve();
    }
  }, 100);
});

// After — always settles
await history.useActions().isReady();
```
