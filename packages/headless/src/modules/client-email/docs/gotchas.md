# client-email — Gotchas

The sharp edges of the client's own email-address collection and its per-email editor. For anyone consuming `useClientEmails` / `useClientEmailManager`, or writing tests against them.

> **🧪 For Testers:** Every section below carries a 🧪 expected-behaviour statement. Fixture names point at the recorded request/response pairs in `__tests__/fixtures/`.

## 1. The collection has no `add()` — the create seams are `ensure()` and the editor

Per-address **form** editing lives on `useClientEmailManager`. The collection deliberately does not expose `add`, `update` or field validation, because those need the dirty/valid state the editor owns.

```ts
// ⚠️ Wrong: there is no add() on the collection
const { add } = useClientEmails().as("self").useActions(); // undefined

// ✅ Right, when you want find-or-create without a form
const { ensure } = useClientEmails().as("self").useActions();
await ensure({ email: "me@example.com" });

// ✅ Right, when the client is filling in a form
const draft = useClientEmailManager().as("self").fresh();
await draft.useActions().isReady();
await draft.useActions().update({ email: "me@example.com" });
```

The collection's twelve actions are `destroy`, `ensure`, `filterBy`, `invalidate`, `isReady`, `nextPage`, `prevPage`, `refresh`, `remove`, `setDefault`, `sortBy`, `verify`. Nothing else.

> **🧪 For Testers:** Asserting `add` on the collection asserts `undefined`. The create request is issued by `ensure()` or by an editor save — both go through the same find-or-create path, so neither can produce a duplicate the other would not.

Fixture: `__tests__/fixtures/post-clients-id-emails.json`.

## 2. Saving an address resets its verified flag — even when the value is unchanged

An editor save on an existing address always sends `{ email, verified: 0 }`. This happens on **every** save, not only when the submitted address differs from the stored one.

```ts
const manager = useClientEmailManager().as("self").for("email", id);

// ⚠️ Wrong: saving as a generic "form closed" action
await manager.useActions().update(); // unverifies the address even if nothing changed

// ✅ Right: only save when the model is actually dirty
if (manager.useMeta().isDirty.value) {
  await manager.useActions().update();
}
```

> **🧪 For Testers:** The outgoing body is `{ email, verified: 0 }` — the numeric `0`, not the boolean the read returns. A verified address loses that status after any save.

Fixture: `__tests__/fixtures/put-clients-id-emails-id.json`.

## 3. Promoting an unverified address to default is rejected by the platform — with a `409`

`setDefault(id)` does not check the target's verified state before sending. The platform does, and rejects:

> `409 — The default email cannot be changed to unverified email address!`

```ts
// ⚠️ Wrong: promoting whatever the user clicked
await setDefault(email.id); // 409 when email.meta.isVerified is false

// ✅ Right: gate on the flag you already have, and offer verification instead
if (email.meta.isVerified) {
  await setDefault(email.id);
} else {
  await verify(email.id); // ask for a fresh verification message first
}
```

> **🧪 For Testers:** This is a real server rejection, not a local guard — the request goes out. The failure lands in `useContext().error`; nothing is thrown at the UI and no notification is raised.

Fixture: `__tests__/fixtures/put-clients-id-emails-id-case-set-default-unverified.json`.

## 4. `verify()` sends a message — it does not accept a code

Despite the name, `verify(id)` does not submit a verification code or hash. It asks the platform to (re-)send a verification message for that address. Submitting a code, or following a verification link, is a separate capability outside this collection.

> **🧪 For Testers:** `verify(id)` sends a request with no body and expects no code in return. Do not target this action when testing code-entry or link-based verification.

Fixture: `__tests__/fixtures/patch-clients-id-emails-id-send-verify.json`.

## 5. `canDelete` is informational — nothing stops a disallowed delete locally

`meta.canDelete` reflects what the platform last reported. Calling `remove()` on a record whose `canDelete` is `false` is not stopped in this module.

```ts
// ⚠️ Wrong: assuming the module blocks a disallowed action locally
await remove(email.id); // fires the DELETE regardless of email.meta.canDelete

// ✅ Right: gate the call in your own UI using the status flag
if (email.meta.canDelete) await remove(email.id);
```

> **🧪 For Testers:** No local guard exists for `canDelete` before a `remove()` request is sent. The rejection shape for a non-deletable record has not been captured — treat the flag as advisory and the platform as the final word.

## 6. Adding an address never sends a `type` field

The create body is `{ email }` only — no category, no type discriminator. Every new record is assigned the same platform-controlled type.

> **🧪 For Testers:** The outgoing create body never contains a `type` field, even though the returned record carries one (`type: 1`, "Account"). Do not assert a `type` in the request body.

Fixture: `__tests__/fixtures/post-clients-id-emails.json`.

## 7. `ensure()` only checks the collection already loaded

`ensure({ email })` waits for the collection's first read to finish, then checks the loaded list before deciding whether to create. It does not issue a fresh, dedicated lookup of its own.

> **🧪 For Testers:** `ensure({ email })` against an already-loaded collection containing that address resolves the existing record with **no** create request fired; against an absent address it creates. Its answer is exactly as fresh as the last list read.

## 8. The collection's default page is 10 rows, not the whole list

The list read boots on the collection's declared page size — `limit=10&offset=0` — rather than returning the entire collection in one unbounded response. For a collection of ten addresses or fewer this is invisible: everything still arrives on the first read, and `nextPage()` / `prevPage()` still have no other page to move to. A collection larger than that now needs paging to see the rest, which previously required nothing at all.

> **🧪 For Testers:** Asserting the first request's `limit` param now asserts `"10"`, not `"0"`. A fixture with ten rows or fewer will not exercise paging by itself — seed more than that to see `nextPage()` actually reach the wire.

Fixtures: `__tests__/fixtures/get-clients-id-emails.json` (the default page, under ten rows), `get-clients-id-emails-case-page-1.json` / `-page-2.json` (an explicitly requested smaller page, walked in full).

## 9. `isAvailable` is two limbs, not one — and it is the request gate itself

`useMeta().isAvailable` is `true` when the session is authenticated **and** the scope resolved a client id. A session that authenticates without resolving a client reads `false` — that is the case that tells this flag apart from a plain "am I logged in" check.

It is not a mirror of the guard; it _is_ the guard, exposed reactively. One predicate is read by the meta layer, by the actions layer and by all eight request gates.

```ts
const { isAvailable, isLoading } = useClientEmails().as("self").useMeta();

// ⚠️ Wrong: treating a false isAvailable as "signed out"
if (!isAvailable.value) showSignInPrompt(); // also fires mid-boot, before the session settles

// ✅ Right: distinguish "not mine to read" from "not read yet"
if (!isAvailable.value && !isLoading.value) showSignInPrompt();
```

> **🧪 For Testers:** Before sign-in, `isAvailable` is `false` while `isLoading` is `true`. Once a client session is active it is `true`. The moment the session goes away it flips `false` in the same tick, and no request is emitted on that flip.

## 10. `refresh()` rejects — every other collection read resolves quietly

`refresh()` is the one collection action that throws. With no addressable client it rejects with `NotAuthenticatedError` before issuing anything, and it also rejects if the session dies between the pre-check and the response.

```ts
// ⚠️ Wrong: a bare forced re-read
await refresh(); // throws NotAuthenticatedError when the session is gone

// ✅ Right
try {
  await refresh();
} catch (error) {
  // render it — nothing is announced for you
}
```

> **🧪 For Testers:** A forced read with no authenticated client session rejects with the typed error and emits **no** request. There is no failed network call to observe or mock against.

## 11. Nothing raises feedback — errors are state you render

No mutation in this module produces a toast, a notification or any other user-visible message. Every failure is captured for the consumer to read.

| Surface                              | Read the failure from                                                   |
| ------------------------------------ | ----------------------------------------------------------------------- |
| Collection row mutation or list read | `useContext().error`, `useMeta().hasError`                              |
| Editor save                          | `useContext().errors`, `useMeta().hasErrors` — and the rejected promise |
| Editor field validation              | `useContext().validationErrors`, `useMeta().isValid`                    |

> **🧪 For Testers:** A consumer that shows nothing after a failed delete has not lost the error — it has not rendered `useContext().error`. Assert on the captured state, never on a notification.

## 12. The form definition is only available through the editor

The barrel exports no `useSchema` / `useUischema`. The schema and UI schema enter the system inside the editor's machine configuration and reach consumers as `useClientEmailManager().useContext().schema` / `.uischema`.

```ts
// ⚠️ Wrong: importing the pair
import { useSchema } from "@upmind-automation/headless"; // not exported

// ✅ Right
const { schema, uischema } = useClientEmailManager()
  .as("self")
  .for("email", id)
  .useContext();
```

A form rendered from a definition the editor has not adopted validates against a different contract than the one that saves — which is why there is no second door. A copy of the pair, rendered as plain JSON for pasting into a form playground, is in [usage.md](./usage.md#the-form-definition--paste-ready).

> **🧪 For Testers:** The module's runtime exports are exactly: both composables, both scope matrices, both context enums, and the email categories. Anything else asserted on the barrel asserts `undefined`.

## 13. `.fresh()` and `.for('email', id)` mint different instances — and `destroy()` differs per half

Each `.fresh()` call mints an editor with its own scope key, so two concurrent drafts never share a model. An editor opened `.for('email', id)` is keyed to that address.

The two halves also clean up differently:

| Half       | `destroy()` does                                                |
| ---------- | --------------------------------------------------------------- |
| Collection | removes the registry entry (there is no service to stop)        |
| Editor     | stops the underlying service **and** removes the registry entry |

The editor additionally offers `stop()`, which stops the service but leaves the registry entry in place.

```ts
onUnmounted(() => {
  emails.useActions().destroy();
  manager.useActions().destroy();
});
```

> **🧪 For Testers:** Typing into one `.fresh()` draft leaves a second draft untouched. Destroying the collection does not destroy an open editor, and vice versa — they are separate registry entries even though they belong to the same module.

## 14. `input()` is debounced — and `update()` flushes it for you

The editor's `input()` is debounced, so rapid keystrokes collapse into one parse. `update()` flushes any pending input before saving, so a save fired immediately after a keystroke persists the typed value rather than the pre-edit one.

> **🧪 For Testers:** `input()` resolves the _parsed_ model, not the raw one passed in. An invalid address does not reject — it resolves and flips `useMeta().isValid` to `false`, with the field reason in `useContext().validationErrors`.

## 15. `isReady()` means "the first fetch settled" — not "the first fetch succeeded"

The collection's `isReady()` resolves once the first fetch has settled. A fetch that settles in **error** counts as settled, so `isReady()` can resolve `true` over a list that never loaded — at which point `isEmpty` reads `true` for a collection that is failed, not empty.

```ts
// ⚠️ Wrong: inferring an empty collection from readiness alone
await isReady();
if (isEmpty.value) showEmptyState();

// ✅ Right: check the error first
await isReady();
if (hasError.value) showErrorState();
else if (isEmpty.value) showEmptyState();
```

> **🧪 For Testers:** Pair `isReady()` with `hasError` before treating an empty list as an empty collection. `isReady()` resolves `false` only when the session settles without an addressable client.

## 16. An unrecognised filter or sort column is silently dropped, a known column with a bad value is REJECTED WHOLE, not partially applied

`filterBy()` and `sortBy()` only accept the columns and operators `useContext().schemas.query.schema` declares (`email`, `verified`, `bounced`, `default` for filters; `created_at`, `email`, `default` for sort). An **unknown** key is quietly left out of the candidate before it is ever checked — it never reaches `useContext().error` and it never reaches the wire; it behaves as if it had never been passed.

```ts
// ⚠️ Wrong: expecting an unrecognised column to surface a validation error
await filterBy({ title: { like: "x" } }); // silently has no effect at all

// ✅ Right: only filter/sort on what the schema declares
await filterBy({ email: { like: "x" } });
```

A **declared** column carrying an invalid value is a different case, and it is stricter than it looks: the whole write is refused, not just the bad part. The candidate is validated **before** it is committed, and a failing candidate never reaches the live model at all — `useContext().query` (what you render) keeps its last valid state, **no new request is fired**, and the only trace of the attempt is `useContext().error`, which carries ajv's verdict (the failing keyword and the exact path inside the model that failed).

```ts
await filterBy({ verified: { eq: false } }); // applies, re-queries
await filterBy({ verified: { eq: "nope" } } as never); // REFUSED — model unchanged, zero requests, error set
// useContext().query.value.filters is still { verified: { eq: false } }
```

> **🧪 For Testers:** `filterBy({ title: { like: "x" } })` (unknown column) leaves the request exactly as it was before the call — no `filter[title|…]` param, no error, and any _other_ filter in the same call still applies. `filterBy({ verified: { eq: "nope" } })` (known column, bad value) also leaves the request and the rendered rows exactly as they were — **but** `useContext().error` is now set with the ajv failure, and `useMeta().hasError` stays `false` (a refused write is a verdict on the write, not a broken collection — the rows on screen are still correct for the criteria that IS applied). Assert the wire params and the model together, not a rejected promise — nothing here ever rejects.

## 17. Clearing the search box is a valid empty state, not an error

The search box binds `filters.email.like`, which accepts `null` as well as a non-empty string (`minLength: 1` applies only when the value is a string). Clearing the box writes `null` (or omits the key entirely) rather than an empty string, so the model stays valid and no request narrows to nothing — this is a deliberate schema shape (`["string", "null"]`), not an accident of what happened to be typed.

> **🧪 For Testers:** Clearing the rendered search control leaves `useContext().error` undefined and the list back to its unfiltered rows. The one way to still hit a validation failure here is to write the leaf directly as an empty string — `filterBy({ email: { like: "" } })` — which item 16's "known column, bad value" rule applies to: the write is refused whole, the previous filter (if any) stays live, and `useContext().error` reports the `minLength` failure. A consumer driving the module through its own rendered controls never produces that state; only a caller writing `""` by hand does.
