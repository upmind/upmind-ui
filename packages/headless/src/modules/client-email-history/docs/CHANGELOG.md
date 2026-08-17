# Changelog

All notable changes to the `client-email-history` module are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

- **`useClientReceivedEmails`** and **`useClientReceivedEmail`** rebuilt as scoped composables — `.as('client')` resolves the calling client's own history; `staff` and `guest` are compile-time errors on both scope matrices, because the underlying endpoints have no client-targeted or staff-targeted form to give them.
- **`useActions().setCriteria(intent)`** on the collection — the one write verb for narrowing, sorting and paging, validated against the module's own declared query schema. Merges the given `filters` / `sort` / `pagination` branches into the live request state; branches left out are untouched, a branch that IS given replaces that whole branch.
- **`useActions().filterBy(intent)` / `.sortBy(intent)`** on the collection — named, single-branch adapters over `setCriteria`, matching the sibling `client-email` module's shape: `filterBy(intent)` is exactly `setCriteria({ filters: intent })`, `sortBy(intent)` is exactly `setCriteria({ sort: intent })`. Neither keeps a copy of the request state, so both carry the same validation, wire shape, and whole-branch-replace behaviour as writing through `setCriteria` directly. This is a different thing from the earlier, withdrawn `sort()` / `filters.*()` facade below — that one built raw wire keys and its own state directly; these two forward straight into the one schema-validated write path.
- **`useContext().schemas.query`** (`{ schema, uischema }`) on the collection — the filter-bar renderer's door: what is filterable/sortable, published as plain JSON so a renderer can derive its controls with no per-field UI code.
- **`useContext().query`** on the collection — the live, read-only criteria model; write it only through `setCriteria`.
- **`useContext().findOne()` / `.getOne(id)`** on the collection — row lookups over the loaded list.
- **`useActions().destroy()`** on both composables — releases a scoped instance so a fresh `.as()` / `.for()` call mints a new one, per the scope registry's own lifecycle.
- **`useInternals()`** on both composables — debug access to the raw backing query.

### Changed

- **Identity now resolves from the scope context, never from a global flag.** The prior implementation chose between a plain endpoint and an admin-prefixed variant using a process-wide setting; both variants were always self-shaped (neither ever addressed a different client's history), so the admin-prefixed variant is removed rather than carried forward, and the endpoint choice no longer depends on anything outside the resolved scope.
- **The single email read gained the same availability gate the collection already had.** It previously reported itself as always available while sending a token-bearing request that could still 401 on the wire; it now answers "is this mine to read?" with the exact same predicate the collection uses.
- **`isReady()` on both composables always settles.** It previously polled on an interval that never resolved once a read was gated, which could hang a caller waiting on it forever; it now resolves the addressability question first, then waits on a fetch that is actually coming.
- **`refresh()` on both composables rejects with a typed error** when the scope cannot address a client, instead of silently returning nothing.
- **Every collection meta flag is a named computed**, not a spread of the backing query's own `meta` object — `hasError`, `isAvailable`, `isEmpty`, `isLoading`, `hasNextPage`, `hasPrevPage`, `hasPages`.
- **The collection's request state is the declared query schema**, validated at every `setCriteria` write, rather than a hand-built filters object the caller assembled directly. A write that fails the schema is rejected: the previous criteria stands, surfaced at `useInternals().query.criteriaError`.
- **Boolean outcome filters travel independently.** `filter[sent|eq]` and `filter[bounced|eq]` no longer travel as a coupled pair when narrowing to one outcome — each declared column narrows on its own; a caller combines columns by naming all of them in one `setCriteria` call.
- **Free-text search travels as `filter[subject|like]`**, wildcarded automatically, never a bare `query=` or `subject=` parameter.
- **Documentation refreshed against the shipped surface** — README, usage, architecture, gotchas and foundation now describe both composables, the real recorded fixtures, and the real failure modes.

### Removed

- **The admin-prefixed endpoint variant** (previously selected by a process-wide flag). Both endpoints it selected between were always self-shaped — neither ever addressed a different client's history — so nothing that ever varied by actor or context was removed; see [architecture.md](./architecture.md) for the identity-resolution mechanism that replaces it.
- **Toast and notification feedback.** No action in this module raises a success or error message. Errors are captured as state; the consumer raises its own feedback.

### Withdrawn (before this became the shipped surface)

An earlier iteration of this rebuild carried a deep-linked-pagination capability, an intermediate hand-rolled filter/sort facade, and the shared-platform additions that backed the pagination capability. All were withdrawn before this became the shipped surface, so a reader who saw an earlier draft of this module is not left wondering where they went:

- **`useActions().sort(property?, direction?)` and `.filters.query(value)` / `.subject(value)` / `.status(status?)`** — an intermediate hand-rolled filters/sort facade that owned its own request state and built raw wire keys (`filter[sent]`, `filter[bounced]`, `filter[error_id|neq]`) with string `"true"` / `"false"` / `"null"` values, and no schema behind it. Replaced by the single `setCriteria(intent)` write verb, validated against `useContext().schemas.query`, before this became the shipped surface.
- **`useActions().goToPage(page)`** on the collection — a one-request jump to an arbitrary page, clamped into range rather than throwing at the boundary. The collection's paging surface is now exactly `pagination` / `nextPage()` / `prevPage()`; there is no direct-jump member. A consumer that deep-linked to `?page=N` on load has to walk forward from page 1 instead, or reimplement the jump itself.
- **The count probe.** The row-carrying list request previously carried `skip_count=1` and reported `total: null`, with a second, independent request (`limit=count`) answering the real count — reactive, generation-tagged so a late-resolving probe could never overwrite a newer one's answer. That whole mechanism is gone: the list request now carries no count side-channel, and `total` arrives on the SAME response as the rows.
- **Five platform additions to the shared `query` module** that the two withdrawn capabilities above depended on — an `ItemQuery` type, the `goToPage` member, the count-probe reactivity, its unhandled-rejection guard, and a `total`-fallback fix on the next-page walk. `packages/headless/src/modules/query/useQuery.ts` and `query.types.ts` are untouched by this module now; it consumes the shared platform exactly as every other scoped composable does. The item-level query shape the single read needs (`ReceivedEmailItemQuery`) is declared locally in this module's own types instead.
- This module's pagination and query pattern now follows `product-catalogue`'s (`packages/headless/src/modules/product-catalogue/`): one `list()` call, `placeholderData: keepPreviousData` so a filter/sort/page change keeps the previous rows and total on screen while the next response is in flight, and `enabled` gated on this module's own addressability predicate. See [architecture.md](./architecture.md#platform-additions-this-build-required).
- Two "Fixed" entries from an earlier draft of this changelog — a pagination total that went stale after a filter/sort change, and a next-page walk that could reset a known total to zero — described defects in the now-withdrawn count-probe machinery and the platform patch backing it. Neither defect exists in the shipped surface, because the mechanism they were fixing no longer exists either.

### Recorded fixtures

Thirteen request/response pairs captured against a live environment back the documented behaviour:

| Fixture                                                                               | Covers                                                                       |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `get-self-email-history-case-default.json`                                            | the default (unfiltered, unsorted) list read, total on the same response     |
| `get-self-email-history-case-page-1.json` / `-page-2.json`                            | paging, `offset=0` / `offset=10`                                             |
| `get-self-email-history-case-subject-sort.json`                                       | sorting by subject, descending                                               |
| `get-self-email-history-case-subject-like-filter-subject-like-welcom.json`            | the real `setCriteria`-driven search — `filter[subject\|like]=%Welcom%`      |
| `get-self-email-history-case-sent-eq-filter-sent-eq-1.json`                           | the real `setCriteria`-driven sent narrowing — `filter[sent\|eq]=1`          |
| `get-self-email-history-case-bounced-eq-filter-bounced-eq-1.json`                     | the real `setCriteria`-driven bounced narrowing — `filter[bounced\|eq]=1`    |
| `get-self-email-history-case-error-neq-filter-error-id-neq-null.json`                 | the real `setCriteria`-driven error narrowing — `filter[error_id\|neq]=null` |
| `get-self-email-history-filter-sent-true.json`                                        | the one real SENT row's content                                              |
| `get-self-email-history-filter-bounced-true.json`                                     | the real EMPTY result (an empty history slice — see gotchas.md)              |
| `get-self-email-history-filter-error-id-neq-null.json` / `-filter-error-id-null.json` | the real ERROR rows' content and its complement                              |
| `get-emails-id.json`                                                                  | the single full read, including its rendered body                            |

The `case=subject-like` / `case=sent-eq` / `case=bounced-eq` / `case=error-neq` captures are the ones that pin the actual wire shape `setCriteria` produces — `filter[column|operator]=value` — as distinct from the withdrawn `filters.*()` facade's bare-parameter shape.

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

### Sorting

**Breaking change:** the caller no longer builds the wire sort parameter directly, and there is no `sort(property, direction)` method — an intermediate draft of this rebuild carried one, but it was withdrawn (see "Withdrawn" above) before this became the shipped surface.

```ts
// Before
useClientReceivedEmails({ sort: "-subject" });

// After
history.useActions().setCriteria({
  sort: [{ field: "subject", dir: SortDirection.DESC }]
});

// Equivalent named shorthand — sortBy(intent) is setCriteria({ sort: intent })
history.useActions().sortBy([{ field: "subject", dir: SortDirection.DESC }]);
```

### Searching and narrowing by delivery outcome

**Breaking change:** the caller no longer builds the wire filter object directly, and the free-text term is no longer a bare `query=` / `subject=` parameter — it is the `subject` column's own `like` operator, reached the same way every other column is.

```ts
// Before
const filters = { "filter[bounced]": "true", query: "invoice" };

// After
history.useActions().setCriteria({
  filters: { bounced: { eq: true }, subject: { like: "invoice" } }
});

// Equivalent named shorthand — filterBy(intent) is setCriteria({ filters: intent })
history.useActions().filterBy({ bounced: { eq: true }, subject: { like: "invoice" } });
```

### Paging

**Breaking change:** pagination is no longer a constructor-time argument, and there is no direct jump to an arbitrary page — an earlier draft of this rebuild carried a `goToPage(page)` member, but it was withdrawn (see "Withdrawn" above) before this became the shipped surface. Walk forward or backward instead, or resize the page through the same criteria channel.

```ts
// Before
useClientReceivedEmails({ pagination: { offset: (urlPage - 1) * 10 } });

// After
const history = useClientReceivedEmails().as("client");
history.useActions().nextPage(); // or .prevPage() — one page at a time
history.useActions().setCriteria({ pagination: { limit: 25 } }); // resize the window
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
