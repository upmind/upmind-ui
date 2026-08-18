# client-email-history — Usage

Full API reference for the module's two composables:

- **`useClientReceivedEmails`** — the collection. Browse, search, sort, narrow by delivery outcome, and page.
- **`useClientReceivedEmail`** — the single read. Open one email in full, including its body.

Both act on the calling client's own history only. Every capability below carries a 🧪 **For Testers** expected-behaviour statement.

## Getting an instance

```ts
import {
  useClientReceivedEmails,
  useClientReceivedEmail
} from "@upmind-automation/headless";

// The collection — the calling client's own history
const history = useClientReceivedEmails().as("client");

// The single read — one email, opened by id
const email = useClientReceivedEmail().as("client").for("email", emailId);
```

Both composables return the same four sub-composables:

| Layer     | Access            | Collection contains                                                                           | Single read contains    |
| --------- | ----------------- | --------------------------------------------------------------------------------------------- | ----------------------- |
| Actions   | `.useActions()`   | `setCriteria` (narrow/sort/page), its `filterBy`/`sortBy` single-branch adapters, + lifecycle | lifecycle only          |
| Context   | `.useContext()`   | reactive list, lookups, live criteria, filter-bar schema, error                               | the mapped email, error |
| Meta      | `.useMeta()`      | seven state flags                                                                             | eight state flags       |
| Internals | `.useInternals()` | the raw list query (criteria model, filter-bar schema, `isFiltered`, `criteriaError`)         | the raw item query      |

> **🧪 For Testers:** Both composables support the client's own (`self`) scope only. `staff` and `guest` are compile-time errors, not runtime failures.

---

## The collection — `useClientReceivedEmails`

### Collection actions — `useActions()`

#### `setCriteria(intent)`

The collection's one write verb — every mutation to the live request state, direct or through `filterBy`/`sortBy` below, ends up here. There is no independent `sort()` or `filters.*()` member that keeps its own copy of the request: the withdrawn earlier facade of that shape (see [CHANGELOG.md](./CHANGELOG.md)) built raw wire keys directly and is gone for good.

| Param    | Type                                     | Required |
| -------- | ---------------------------------------- | -------- |
| `intent` | `Partial<{ filters, sort, pagination }>` | Yes      |

**Returns:** `void`.

`intent` names the TOP-LEVEL branches you want to change. A branch you leave out of the call is left exactly as it was; a branch you DO include **replaces that whole branch** — it does not merge into whatever the branch previously held. To combine two filter columns, name both in the SAME call.

A write that fails the module's declared query schema (`useContext().schemas.query.schema`) is rejected outright: the previous criteria stands, and the rejection is captured, never thrown — see `useInternals().query.criteriaError`.

> **🧪 For Testers:**
>
> - `setCriteria({ filters: { subject: { like: "Welcome" } } })` produces a request carrying `filter[subject|like]=%Welcome%` — wildcarded automatically, never a bare `subject=` or `query=`.
> - `setCriteria({ filters: { sent: { eq: true } } })` produces `filter[sent|eq]=1`; `setCriteria({ filters: { bounced: { eq: false } } })` produces `filter[bounced|eq]=0` — a `false` value is sent explicitly, never dropped.
> - `setCriteria({ filters: { error_id: { neq: "null" } } })` produces `filter[error_id|neq]=null`.
> - Two `setCriteria({ filters: {...} })` calls in a row do NOT accumulate: the second call's `filters` object is the WHOLE filters state afterwards — a column present in the first call and absent from the second is gone from the wire.
> - `setCriteria({ filters: {} })` clears every filter key — none survive on the next request.
> - `setCriteria({ sort: [{ field: "subject", dir: "asc" }] })` produces `order=subject`. A field the schema does not declare (only `created_at` and `subject` are sortable) is rejected — the write never reaches the wire and the previous sort stands.
> - `setCriteria({ pagination: { limit: 2 } })` changes the page size on the SAME live instance and re-issues the request — no fresh instance is minted.

#### `filterBy(intent)`

A named, single-branch door onto `setCriteria` — merges `intent` into the `filters` branch only, leaving `sort` and `pagination` exactly as they were. `filterBy(intent)` **is** `setCriteria({ filters: intent })`; nothing about validation, the wire shape, or the whole-branch-replace rule differs between the two spellings.

| Param    | Type                   | Required |
| -------- | ---------------------- | -------- |
| `intent` | `SentEmailFilterModel` | Yes      |

**Returns:** `void`.

> **🧪 For Testers:** `filterBy({ sent: { eq: true } })` produces `filter[sent|eq]=1`; `filterBy({ bounced: { eq: false } })` produces `filter[bounced|eq]=0` — a `false` value is sent explicitly, never dropped. `filterBy({ subject: { like: "Welcome" } })` produces `filter[subject|like]=%Welcome%`. `filterBy({})` clears every filter key. A second `filterBy` call replaces the first's `filters` branch wholesale — the SAME accumulation rule `setCriteria` follows, because `filterBy` never holds a copy of its own; see gotchas.md.

#### `sortBy(intent)`

A named, single-branch door onto `setCriteria` — merges `intent` into the `sort` branch only, leaving `filters` and `pagination` exactly as they were. `sortBy(intent)` **is** `setCriteria({ sort: intent })`.

| Param    | Type                 | Required |
| -------- | -------------------- | -------- |
| `intent` | `SentEmailSortModel` | Yes      |

**Returns:** `void`.

> **🧪 For Testers:** `sortBy([{ field: "subject", dir: "asc" }])` produces `order=subject`. A field the schema does not declare (only `created_at` and `subject` are sortable) is rejected — the write never reaches the wire and the previous sort stands. Returning to the boot order is an explicit write, the same rule `setCriteria`'s sort branch follows — see gotchas.md.

#### `nextPage()` / `prevPage()`

Moves to the next or previous page.

**Returns:** `void`.

#### `isReady()` — waiting for the list

Resolves once the collection is ready to read.

**Returns:** `Promise<boolean>` — `true` once the first fetch has settled; `false` if the session settles without an addressable client. Always settles — never hangs.

> **🧪 For Testers:** A session that never authenticates resolves `isReady()` `false` rather than leaving it pending.

#### `refresh()`

Forces a re-read of the list from the server.

**Returns:** `Promise<void>`.

**Throws:** `NotAuthenticatedError` when the scope cannot address a client — either before the request is issued, or if the session dies mid-flight.

> **🧪 For Testers:** `refresh()` is the one collection action that **rejects** rather than resolving quietly. With no addressable client it throws and no request leaves the client.

#### `invalidate()`

Marks the cached list stale so the next read re-fetches it.

**Returns:** `Promise<T | undefined>`.

#### `destroy()` — releasing the collection

Removes this scoped instance from the registry.

**Returns:** `void`.

> **🧪 For Testers:** `destroy()` removes the registry entry, so the next `.as('client')` mints a fresh collection. Call on component unmount.

### Collection context — `useContext()`

| Property     | Type                                                           | Meaning                                                                                                                                          |
| ------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `data`       | `ComputedRef<SentEmail[]>`                                     | The client's reactive list of received emails                                                                                                    |
| `error`      | `ComputedRef<ResponseError \| undefined>`                      | The list read's captured error                                                                                                                   |
| `findOne()`  | `(mapping, data?, searchableProps?) => SentEmail \| undefined` | Finds one email by a partial mapping or free text                                                                                                |
| `getOne(id)` | `(id, data?) => SentEmail \| undefined`                        | Finds one email by id                                                                                                                            |
| `pagination` | `ComputedRef<PaginationInfo>`                                  | `{ limit, total, page, pages, from, to }`                                                                                                        |
| `query`      | `ComputedRef<QueryModel>`                                      | This scope's ACTIVE request state — read-only; write through `useActions().setCriteria()`                                                        |
| `schemas`    | `{ query: { schema, uischema, sortUischema } }`                | The query schema, the filter-bar uischema a renderer derives its controls from, and a separate uischema for the sort control's own option labels |

> **🧪 For Testers:** `data` is always an array — before the first read completes, and when the read errors. `error` is **state you read**, never an event. `query` and `schemas` both travel as plain JSON — no function crosses either. `schemas.query.sortUischema` is one `Control` over the `sort` branch (`{ type: "Control", scope: "#/properties/sort", i18n: "form.sent_email_sort" }`); its `i18n` is the option-key PREFIX a sort control resolves as `<i18n>.<field>` (`form.sent_email_sort.created_at`), the same tri-state prefix mechanism the filter controls use.

### Collection meta — `useMeta()`

| Flag          | True when                                                           |
| ------------- | ------------------------------------------------------------------- |
| `hasError`    | the list read failed                                                |
| `isAvailable` | the session is authenticated **and** the scope resolved a client id |
| `isEmpty`     | the resolved list has no rows                                       |
| `isLoading`   | the list read is in flight or has not completed its first fetch     |
| `hasNextPage` | there is a further page beyond the current one                      |
| `hasPrevPage` | there is a page before the current one                              |
| `hasPages`    | the history spans more than one page                                |

`isAvailable` is the _same predicate_ every request gate in this module calls — not a second copy of it — so the flag you render and the guard the wire enforces cannot drift apart.

> **🧪 For Testers:** `isAvailable` is `false` before sign-in (while `isLoading` is still `true`), `true` once a client session is active, and `false` again the moment the session goes away, with zero requests emitted on that flip.

### Collection internals — `useInternals()`

| Property     | Meaning                                                                                                                                                                                                   |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `actorScope` | the resolved actor for this instance                                                                                                                                                                      |
| `query`      | the raw list-query object backing the list — including `query.isFiltered` (any declared filter column carries a value) and `query.criteriaError` (ajv's verdict on the last REJECTED `setCriteria` write) |

For debugging and tests. Not for production consumers.

---

## The single email — `useClientReceivedEmail`

Opens one email by id and reads it in full, including its body.

```ts
const email = useClientReceivedEmail().as("client").for("email", emailId);

await email.useActions().isReady();
const { data } = email.useContext();
```

### Single-read actions — `useActions()`

#### `isReady()` — waiting for the email

Resolves once the email is ready to read.

**Returns:** `Promise<boolean>` — `true` once available, `false` if the session settles with no addressable client. Always settles.

> **🧪 For Testers:** The single read never issues a request before the session resolves which client it is reading for.

#### `refresh()`

Forces a re-read of the email from the server.

**Returns:** `Promise<void>`.

**Throws:** `NotAuthenticatedError` when the scope cannot address a client.

#### `invalidate()`

Marks the cached read stale so the next read re-fetches it.

**Returns:** `Promise<T | undefined>`.

#### `destroy()` — releasing the read

Removes this scoped instance from the registry.

**Returns:** `void`.

> **🧪 For Testers:** After `destroy()`, a fresh `.for('email', id)` mints a new instance rather than reusing the released one.

### Single-read context — `useContext()`

| Property | Type                                      | Meaning                              |
| -------- | ----------------------------------------- | ------------------------------------ |
| `data`   | `ComputedRef<SentEmail \| undefined>`     | The mapped email, including its body |
| `error`  | `ComputedRef<ResponseError \| undefined>` | The read's captured error            |

> **🧪 For Testers:** The SAME mapper the collection uses maps this email — the two surfaces can never disagree about the same email's fields.

### Single-read meta — `useMeta()`

| Flag          | True when                                                           |
| ------------- | ------------------------------------------------------------------- |
| `hasError`    | the read failed                                                     |
| `isAvailable` | the session is authenticated **and** the scope resolved a client id |
| `isComplete`  | the first fetch has completed, regardless of outcome                |
| `isEmpty`     | the resolved email carries no id                                    |
| `isLoading`   | the read is in flight or has not completed its first fetch          |
| `isBounced`   | this email bounced                                                  |
| `isError`     | this email errored                                                  |
| `isSent`      | this email sent successfully                                        |

> **🧪 For Testers:** `isBounced` / `isError` / `isSent` mirror the same delivery-outcome precedence the collection's rows carry — error outranks bounced, bounced outranks sent.

### Single-read internals — `useInternals()`

| Property     | Meaning                                     |
| ------------ | ------------------------------------------- |
| `actorScope` | the resolved actor for this instance        |
| `query`      | the raw item-query object backing this read |

For debugging and tests. Not for production consumers.

---

## Errors are state, never announcements

Nothing in this module raises a toast, a notification, or any other message on your behalf. Every failure is captured where you can read and render it:

```ts
// Collection
const { error } = history.useContext();
const { hasError } = history.useMeta();

// Single read
const { error: emailError } = email.useContext();
const { hasError: emailHasError } = email.useMeta();
```

> **🧪 For Testers:** A consumer that shows nothing after a failed read has not lost the error — it has not rendered `useContext().error`.

## Types

```ts
import {
  useClientReceivedEmails,
  useClientReceivedEmail,
  RECEIVED_EMAILS_SCOPE_MATRIX,
  ReceivedEmailsContextTypes,
  RECEIVED_EMAIL_SCOPE_MATRIX,
  ReceivedEmailContextTypes,
  ReceivedEmailsSortableProperties,
  SentEmailStatus,
  type UseClientReceivedEmails,
  type UseClientReceivedEmailsActions,
  type UseClientReceivedEmailsContext,
  type UseClientReceivedEmailsMeta,
  type UseClientReceivedEmailsInternals,
  type UseClientReceivedEmail,
  type UseClientReceivedEmailActions,
  type UseClientReceivedEmailContext,
  type UseClientReceivedEmailMeta,
  type UseClientReceivedEmailInternals,
  type ReceivedEmailsScopeMatrix,
  type ReceivedEmailScopeMatrix,
  type SentEmail,
  type SentEmailModel
} from "@upmind-automation/headless";
```

That list is the module's whole public surface. The services and mappers are internal and are not exported — see [gotchas.md](./gotchas.md) and [architecture.md](./architecture.md).
