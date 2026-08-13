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

| Layer     | Access            | Collection contains                   | Single read contains    |
| --------- | ----------------- | ------------------------------------- | ----------------------- |
| Actions   | `.useActions()`   | sort/filter/page controls + lifecycle | lifecycle only          |
| Context   | `.useContext()`   | reactive list, lookups, error         | the mapped email, error |
| Meta      | `.useMeta()`      | seven state flags                     | eight state flags       |
| Internals | `.useInternals()` | the raw list query                    | the raw item query      |

> **🧪 For Testers:** Both composables support the client's own (`self`) scope only. `staff` and `guest` are compile-time errors, not runtime failures.

---

## The collection — `useClientReceivedEmails`

### Collection actions — `useActions()`

#### `sort(property?, direction?)`

Sorts the history. With no property, restores the default order (most recent first) — explicitly, not by clearing the sort to nothing.

| Param       | Type                               | Required |
| ----------- | ---------------------------------- | -------- |
| `property`  | `ReceivedEmailsSortableProperties` | No       |
| `direction` | `RequestSortDirection`             | No       |

**Returns:** `void`.

> **🧪 For Testers:** `sort(SUBJECT, DESC)` produces a request whose URL carries `subject`. A subsequent no-argument `sort()` produces a request carrying `created_at` — the default tuple is re-applied, never left to fall out of an absent parameter.

#### `filters.query(value)` / `filters.subject(value)`

Applies a free-text filter and/or a subject filter. The two compose: applying one after the other narrows by both together.

**Returns:** `void`.

> **🧪 For Testers:** `filters.query("invoice")` produces a request carrying `query=invoice`. A following `filters.subject("Welcome")` produces a request carrying BOTH `query=invoice` and `subject=Welcome`.

#### `filters.status(status?)`

Narrows to one delivery outcome — sent, bounced, or error — or clears the narrowing with no argument.

| Param    | Type                           | Required |
| -------- | ------------------------------ | -------- |
| `status` | `SentEmailStatus \| undefined` | No       |

**Returns:** `void`.

> **🧪 For Testers:** Each status produces exactly its own wire keys; switching back to no status produces a request carrying NONE of the three outcome-filter keys. The scope stays on the SAME live instance — no fresh instance is minted on a filter change.

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

| Property     | Type                                                           | Meaning                                           |
| ------------ | -------------------------------------------------------------- | ------------------------------------------------- |
| `data`       | `ComputedRef<SentEmail[]>`                                     | The client's reactive list of received emails     |
| `error`      | `ComputedRef<ResponseError \| undefined>`                      | The list read's captured error                    |
| `findOne()`  | `(mapping, data?, searchableProps?) => SentEmail \| undefined` | Finds one email by a partial mapping or free text |
| `getOne(id)` | `(id, data?) => SentEmail \| undefined`                        | Finds one email by id                             |
| `pagination` | `ComputedRef<PaginationInfo>`                                  | `{ limit, total, page, pages, from, to }`         |

> **🧪 For Testers:** `data` is always an array — before the first read completes, and when the read errors. `error` is **state you read**, never an event.

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

| Property     | Meaning                                    |
| ------------ | ------------------------------------------ |
| `actorScope` | the resolved actor for this instance       |
| `query`      | the raw list-query object backing the list |

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
