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

> **🧪 For Testers:** Asserting a mutation-shaped member on either composable's actions asserts `undefined`. There is no schema layer and no state machine anywhere in this module.

## 3. Delivery-outcome precedence is strict — error beats bounced, always

A record carrying BOTH an error id and a bounced flag reports as **errored**, never as bounced. The order is error, then bounced, then sent, then still-sending.

```ts
// A record with error_id set AND bounced: true still resolves ERROR.
```

> **🧪 For Testers:** No real captured row carries both an error id and a bounced flag at once — the staging account's whole history has zero bounced rows to sample. The precedence logic itself is carried over unchanged from the prior implementation; the ordering above is a code-path guarantee, not something asserted against a live example of the combined case. Treat that specific combination as a known gap in what could be captured, not in what the code does.

## 4. The three outcome-filter keys move as a SET

Narrowing to "sent" sends `filter[sent]=true` **and** `filter[bounced]=false` in the same request — never `filter[sent]=true` alone. Clearing the narrowing back to "all" means the request carries **none** of the three outcome keys, not the three keys with empty values.

```ts
const { filters } = history.useActions();

filters.status(SentEmailStatus.SENT); // filter[sent]=true & filter[bounced]=false
filters.status(SentEmailStatus.BOUNCED); // filter[bounced]=true
filters.status(SentEmailStatus.ERROR); // filter[error_id|neq]=null
filters.status(); // none of the three keys on the wire
```

**Why this matters:** the request layer only deletes a key it visits on the CURRENT call; a key silently dropped from the filters object rather than explicitly cleared lingers on the wire from a previous call, because the URL instance backing a query is reused for its whole lifetime.

> **🧪 For Testers:** Assert the ABSENCE of all three keys when narrowing back to "all," not merely the absence of the one you last set.

## 5. `sort()` with no argument re-applies the default explicitly — it is not a "clear"

Calling the underlying request layer's own sort-clear would drop the `order` parameter from the wire entirely, rather than falling back to a sensible default. This module's `sort()` catches that: no-argument calls re-apply the documented default order (most recent first) explicitly.

```ts
history.useActions().sort(); // order=-created_at on the wire — not an absent parameter
```

> **🧪 For Testers:** A no-argument `sort()` call still produces a request carrying `order=-created_at`. Do not assert an absent `order` parameter as the no-argument behaviour.

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

> **🧪 For Testers:** After `destroy()`, the next `.as('client')` (or `.for('email', id)`) mints a fresh instance rather than reusing the released one.

## 12. Known limitations in what the recorded fixtures could capture

Two edge cases in this module's behaviour are real code paths, but neither has an example in the environment the test fixtures were captured against, so neither is exercised by a recorded wire capture:

- **A row carrying both an error id and a bounced flag at once.** The staging account's entire real history returns zero bounced rows, so there is nothing of that shape to capture, let alone one that is also errored.
- **A single email whose full body comes back empty.** Every sampled row, across every subject category present, carried a populated body.

Both are gaps in what could be **captured**, not in what the code does — the delivery-outcome precedence logic and the empty-body handling are both carried over unchanged from the prior implementation this module replaced. A future consumer with access to a staging account that has a row of either shape can close the gap by re-running the fixture capture; hand-authoring either row instead is deliberately avoided, because a fabricated fixture presented as recorded would certify a contract no real system has actually exhibited.
