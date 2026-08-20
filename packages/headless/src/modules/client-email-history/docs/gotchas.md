# client-email-history — Gotchas

The sharp edges of a client's own email history and its single-email read. For anyone consuming `useClientReceivedEmails` / `useClientReceivedEmail`, or writing tests against them.

> **🧪 For Testers:** Every section below carries a 🧪 expected-behaviour statement. Fixture names point at the recorded request/response pairs in `__tests__/fixtures/`.

## 1. `.for(CLIENT, otherId)` is type-reachable on the collection — and does nothing you'd expect

The collection's scope accepts a client id through `.for(ScopeActorTypes.CLIENT, someOtherClientId)`, and the call compiles and runs. **It does not read that other client's history.** The underlying endpoint (`self/email_history`) always resolves to the AUTHENTICATED caller — it has no client-id parameter of any kind — so the call returns the caller's OWN history, filed under a cache key that names the other client's id.

```ts
// ⚠️ Wrong: this does NOT retarget the read
const history = useClientReceivedEmails()
  .as(ScopeActorTypes.CLIENT)
  .for(ReceivedEmailsContextTypes.CLIENT, someOtherClientId);
// .useContext().data is still the CALLER's own history — just cached
// under a key that names `someOtherClientId`.

// ✅ Right: there is no capability to read another client's history here.
// Every live consumer opens the collection with a bare .as('client') call.
const history = useClientReceivedEmails().as(ScopeActorTypes.CLIENT);
```

**Why this is not a data leak:** the outbound request is unaffected by the id you pass — it is always the caller's own `self/email_history` under the caller's own token. The worst outcome is a confusing cache-key label, never someone else's data.

**Why the type was not narrowed to prevent this:** doing so means touching the module's one identity seam to guard against a call no consumer in this tree makes. If a genuine client-addressed read is ever needed, the underlying platform would need a client-addressed endpoint, which does not exist today — this module's single supported cell is a client reading their own history, and nothing else.

> **🧪 For Testers:** Do not write a test that asserts `.for(CLIENT, otherId)` changes the outbound request URL — it never does. If you need to assert cache-key partitioning behaviour, assert it directly against the scope registry, not against wire content.

## 2. There is no mutation surface — not on either composable

Neither `useClientReceivedEmails` nor `useClientReceivedEmail` can compose, send, resend, or delete an email. Both exist purely to read.

```ts
// ⚠️ Wrong: there is no send()/resend()/remove() anywhere in this module
await useClientReceivedEmails().as("client").useActions().resend(id); // undefined

// ✅ Right: this module reads what has already been sent
const { data } = useClientReceivedEmails().as("client").useContext();
```

> **🧪 For Testers:** Asserting a mutation-shaped member on either composable's actions asserts `undefined`. The collection's one schema (`useContext().schemas.query`) is a READ query schema — what `setCriteria` accepts — never a form/mutation schema, and there is no state machine anywhere in this module.

## 3. Delivery-outcome precedence is strict — error beats bounced, always

A record carrying BOTH an error id and a bounced flag reports as **errored**, never as bounced. The order is error, then bounced, then sent, then still-sending.

```ts
// A record with error_id set AND bounced: true still resolves ERROR.
```

> **🧪 For Testers:** No real captured row carries both an error id and a bounced flag at once — the staging account's whole history has zero bounced rows to sample. The precedence logic itself is carried over unchanged from the prior implementation; the ordering above is a code-path guarantee, not something asserted against a live example of the combined case. Treat that specific combination as a known gap in what could be captured, not in what the code does.

## 4. Each outcome column narrows independently — and a `filters` write replaces the WHOLE branch

Narrowing to "sent" sends only `filter[sent|eq]=1` — never paired with `filter[bounced|eq]` the way an earlier build of this module once coupled them. `sent`, `bounced` and `error_id` are three independent schema columns; combine them by naming every column you want active in the SAME `setCriteria` call.

The `filters` branch itself is a full replace, not an accumulating merge: a later `setCriteria({ filters: {...} })` call replaces whatever `filters` object the previous call set — a column left out of the new call is gone, not carried over from the old one.

```ts
const { setCriteria } = history.useActions();

setCriteria({ filters: { sent: { eq: true } } }); // filter[sent|eq]=1
setCriteria({ filters: { bounced: { eq: false } } }); // filter[bounced|eq]=0 — `sent` is GONE, not carried over

// To combine two columns, name both in ONE call:
setCriteria({
  filters: { subject: { like: "Welcome" }, error_id: { neq: "null" } }
}); // filter[subject|like]=%Welcome% AND filter[error_id|neq]=null, together

setCriteria({ filters: {} }); // clears every filter key — none survive on the wire
```

**Why this matters:** a caller that writes one filter column per `setCriteria` call, expecting the module to remember the previous one, sees only the MOST RECENT column on the wire — the earlier narrowing is silently dropped, not stacked.

> **🧪 For Testers:** Assert the exact SET of `filter[…]` keys after each `setCriteria` call, not just the presence of the one you just wrote — a stale key surviving from a previous call, and an expected key missing because it was not repeated, are both real regressions this shape can hide.

**`filterBy(intent)` is the identical call, narrowed to the `filters` branch.** `useActions().filterBy(intent)` is exactly `setCriteria({ filters: intent })` — it replaces the whole `filters` object the same way, and the same accumulation trap applies: `filterBy({ sent: { eq: true } })` followed by `filterBy({ bounced: { eq: false } })` leaves only `bounced` on the wire.

## 5. There is no auto-reset — returning to the default sort is an explicit write

An earlier build of this module's `sort()` re-applied the default order on a no-argument call. The shipped surface has no such convenience: `setCriteria` only touches the branches you give it, so a call that never mentions `sort` leaves whatever sort is currently active — it does not fall back to anything.

The collection's declared default (`created_at`, descending) governs the BOOT order only. To explicitly return to it later, read it off the published schema rather than hand-typing it, and write it back:

```ts
const { schemas } = history.useContext();

history.useActions().setCriteria({
  sort: schemas.query.schema.properties.sort.default
});
```

Writing a sort field the schema does not declare (only `created_at` and `subject` exist) is rejected outright — the write never reaches the wire and the previous sort stands.

> **🧪 For Testers:** A `setCriteria({ sort: [...] })` call naming an undeclared field produces NO change to the outbound `order=` parameter — assert the PREVIOUS sort survives, not that the call throws or that the wire goes empty.

**`sortBy(intent)` is the identical call, narrowed to the `sort` branch.** `useActions().sortBy(intent)` is exactly `setCriteria({ sort: intent })` — the same explicit-write rule applies: `sortBy` never re-applies the default on its own, so returning to it means writing `schemas.query.schema.properties.sort.default` back through `sortBy`, the same as through `setCriteria`.

## 6. The collection's total settles on the SAME response as the rows

There is no second request behind `pagination.total` — the one list request carries both the rows and the total in its response body, so `placeholderData: keepPreviousData` is what keeps the previously-known rows AND total on screen while a filter/sort/page change is in flight, not a separate probe settling independently.

```ts
const { pagination } = history.useContext();
// pagination.total / .pages update in the SAME tick the new rows land —
// there is no separate count request to wait on.
```

> **🧪 For Testers:** Do not write a test expecting a second, count-only request against this endpoint — narrowing or paging issues exactly one request, and its own response carries the new total.

## 7. Only `nextPage()` / `prevPage()` exist — there is no jump-to-page

The collection walks one page at a time. There is no member that jumps directly to an arbitrary page number in one call.

```ts
// ⚠️ Wrong: there is no goToPage() on this composable
history.useActions().goToPage(5); // not a function

// ✅ Right: walk to it
for (let i = 0; i < 4; i++) history.useActions().nextPage();
```

> **🧪 For Testers:** A consumer that previously deep-linked to `?page=N` on load can no longer jump straight there — it has to walk forward from page 1, or the capability has to be re-added at the consumer layer, not assumed present here.

## 8. `isAvailable` is two limbs, not one — and it is the request gate itself

`useMeta().isAvailable` is `true` when the session is authenticated **and** the scope resolved a client id. A session that authenticates but resolves no client correctly reports `false` — that is the case that tells this flag apart from a plain "am I logged in" check.

```ts
const { isAvailable, isLoading } = history.useMeta();

// ⚠️ Wrong: treating a false isAvailable as "signed out"
if (!isAvailable.value) showSignInPrompt(); // also fires mid-boot, before the session settles

// ✅ Right: distinguish "not mine to read" from "not read yet"
if (!isAvailable.value && !isLoading.value) showSignInPrompt();
```

> **🧪 For Testers:** Before sign-in, `isAvailable` is `false` while `isLoading` is `true`. The moment the session goes away it flips `false` in the same tick, with zero requests emitted on that flip — on BOTH composables.

## 9. `refresh()` rejects — every other read resolves quietly

`refresh()` is the one action on each composable that throws. With no addressable client it rejects with `NotAuthenticatedError` before issuing anything.

```ts
try {
  await history.useActions().refresh();
} catch (error) {
  // render it — nothing is announced for you
}
```

> **🧪 For Testers:** A forced read with no authenticated client session rejects with the typed error and emits **no** request — on both the collection and the single read.

## 10. Nothing raises feedback — errors are state you render

No action in this module produces a toast, a notification, or any other user-visible message.

| Surface              | Read the failure from                      |
| -------------------- | ------------------------------------------ |
| Collection list read | `useContext().error`, `useMeta().hasError` |
| Single email read    | `useContext().error`, `useMeta().hasError` |

> **🧪 For Testers:** A consumer that shows nothing after a failed read has not lost the error — it has not rendered `useContext().error`.

## 11. `destroy()` behaves identically on both composables

Neither surface is machine-backed, so `destroy()` on either just removes the registry entry — there is no service to stop. This is simpler than a module with a mutation-backed editor half, and it is the same on both surfaces here.

```ts
onUnmounted(() => {
  history.useActions().destroy();
  email.useActions().destroy();
});
```

> **🧪 For Testers:** After `destroy()`, the next `.as('client')` (or `.withId(id)`) mints a fresh instance rather than reusing the released one.

## 12. Known limitations in what the recorded fixtures could capture

Two edge cases in this module's behaviour are real code paths, but neither has an example in the environment the test fixtures were captured against, so neither is exercised by a recorded wire capture:

- **A row carrying both an error id and a bounced flag at once.** The staging account's entire real history returns zero bounced rows, so there is nothing of that shape to capture, let alone one that is also errored.
- **A single email whose full body comes back empty.** Every sampled row, across every subject category present, carried a populated body.

Both are gaps in what could be **captured**, not in what the code does — the delivery-outcome precedence logic and the empty-body handling are both carried over unchanged from the prior implementation this module replaced. A future consumer with access to a staging account that has a row of either shape can close the gap by re-running the fixture capture; hand-authoring either row instead is deliberately avoided, because a fabricated fixture presented as recorded would certify a contract no real system has actually exhibited.

## 13. The collection's default page is 10 rows, not the whole list

The list boots already on a bounded first page — the schema's own `pagination.limit` default (`10`) — not the caller's whole history in one response. The very FIRST request the collection ever issues already carries `limit=10`.

```ts
const history = useClientReceivedEmails().as("client");
await history.useActions().isReady();

history.useContext().pagination.value.limit; // 10, even on a fresh boot
```

**Why this matters:** a consumer that assumed the collection loads its whole history up front and paginates client-side is wrong from the very first request. `useActions().nextPage()` / `.prevPage()` walk the server-paged window one page at a time; `setCriteria({ pagination: { limit } })` changes the window size for the SAME live instance, re-issuing the request rather than minting a new one.

> **🧪 For Testers:** Assert `limit=10` on the FIRST observed request, not just a later one — a regression that drops the schema's declared page-size default would otherwise only surface once a consumer's history exceeds one page.
