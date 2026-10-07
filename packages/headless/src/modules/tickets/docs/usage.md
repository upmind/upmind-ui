# tickets — Usage

Full API reference for both composables. Every member below is read off the shipped surface, not from a docblock — where a comment in source disagrees with this page, the source's returned object is the truth (see [gotchas.md](./gotchas.md) #17).

```ts
import {
  ScopeActorTypes,
  TicketsContextTypes,
  TicketsSortableProperties,
  useTicket,
  useTickets
} from "@upmind-automation/headless";
```

---

## Getting an instance

The two composables are addressed differently, and this is deliberate; see [gotchas.md](./gotchas.md) #5.

```ts
import { ScopeActorTypes, TicketsContextTypes, useTicket, useTickets } from "@upmind-automation/headless";

declare const contractProductId: string;
declare const ticketId: string;

// THE COLLECTION — the client's own ticket list.
const tickets = useTickets().as(ScopeActorTypes.SELF);

// THE COLLECTION, read about ONE of my products.
// CLIENT actor + PRODUCT context. The product is a relationship, so it is
// the SCOPE — there is no product filter column to set.
const productTickets = useTickets()
  .as(ScopeActorTypes.CLIENT)
  .for(TicketsContextTypes.CONTRACT_PRODUCT, contractProductId);

// THE MANAGER — one ticket, addressed by its record id.
// CLIENT actor, one ticket by record id. No cast on the builder, ever.
const ticket = useTicket()
  .as(ScopeActorTypes.CLIENT)
  .withId(ticketId);
```

`.for('client', id)` is unspellable on **both** composables — the list is never
retargeted at another client, and neither matrix declares `client`. That is a
different axis from the entity a read is ABOUT, which is what `product` and
`ticket` name.

Both return the uniform four-layer shape:

```ts
import { ScopeActorTypes, useTickets } from "@upmind-automation/headless";

const tickets = useTickets().as(ScopeActorTypes.SELF);

const { useActions, useContext, useMeta, useInternals } = tickets;
```

One instance is minted per resolved scope and held in the scope registry, so it survives component lifecycles. Two calls with the same actor and context resolve to the **same** instance; `useActions().destroy()` releases it so the next call mints a fresh one.

Always wait for readiness before reading:

```ts
import { ScopeActorTypes, useTickets } from "@upmind-automation/headless";

const tickets = useTickets().as(ScopeActorTypes.SELF);

await tickets.useActions().isReady(); // resolves true when ready, false when not addressable
```

`isReady()` **always settles**. It answers addressability first (is there an authenticated session with a resolved client?) and only then waits on the fetch — so it never hangs behind a query that will never fire.

---

## The collection — `useTickets`

### Collection actions — `useActions()`

Fifteen members.

#### Reading and refreshing

| Member                | Signature                    | Notes                                                                                 |
| --------------------- | ---------------------------- | ------------------------------------------------------------------------------------- |
| `isReady()`           | `() => Promise<boolean>`     | Always settles. `false` means the scope cannot address a client.                       |
| `refresh()`           | `() => Promise<void>`        | Forces a server re-read. **Rejects** with `NotAuthenticatedError` when not addressable. |
| `invalidate()`        | `() => Promise<unknown>`     | Marks the shared cache key stale (non-exact) so the next read refetches.               |
| `reset()`             | `() => Promise<unknown>`     | Drops the shared key's rows; the next read starts from loading.                        |
| `destroy()`           | `() => void`                 | Removes this scoped instance from the registry.                                        |

#### Narrowing, sorting, paging

```ts
import { ScopeActorTypes, SortDirection, TicketsSortableProperties, useTickets } from "@upmind-automation/headless";

const tickets = useTickets().as(ScopeActorTypes.SELF);

tickets.useActions().setCriteria({
  query: "invoice",                                     // free text — min 3 chars
  filters: {
    reference: "XGD-235-12434",                         // bare EQUAL leaf
    subject: "Renewal",                                 // bare EQUAL leaf
    isClosed: { eq: false },                            // tri-state — gotchas #1
    created_at: { gte: "2026-01-01T00:00:00Z" }
  },
  sort: [{ field: TicketsSortableProperties.SUBJECT, dir: SortDirection.ASC }],
  pagination: { limit: 20, offset: 0 }
});
```

| Member            | Signature                                        | Notes                                                                       |
| ----------------- | ------------------------------------------------ | --------------------------------------------------------------------------- |
| `setCriteria()`   | `(candidate: Partial<TicketsQueryModel>) => void` | The one write verb. Validated **before** it commits — see below.            |
| `nextPage()`      | `() => Promise<…>`                               | Fetches the next page.                                                      |
| `prevPage()`      | `() => Promise<…>`                               | Fetches the previous page.                                                  |
| `setPageSize()`   | `(limit: number) => Promise<void>`               | Applies the limit **and** persists it to the client's prefs (`savePrefs`).  |

**Every filter is an ATTRIBUTE of a ticket.** A reference, a subject, a status,
a date. The product a ticket is about is a RELATIONSHIP, so it is not here — it
is the scope context (`.for(TicketsContextTypes.CONTRACT_PRODUCT, id)` above), and no
`setCriteria` write can widen it away.

**`setCriteria` merges branches, and a branch that IS given replaces that whole branch.** Naming `filters` replaces the entire filters branch; branches left out are untouched.

**A rejected write sends nothing and stands the previous criteria.** The candidate is merged onto the live model and re-validated against the raw schema before it is forwarded. A key the schema never declared — a typo'd filter name — is rejected here, where the query core's own parse-then-validate order would have silently dropped it and committed as if valid. The rejection surfaces on **both** `useContext().error` and `useMeta().hasError`.

Sortable fields (`TicketsSortableProperties`): `REFERENCE`, `SUBJECT`, `CREATED_AT`, `UPDATED_AT`. The default is `updated_at` descending — most recently updated first.

#### Writing

| Member                     | Signature                                                     | Notes                                                                      |
| -------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `create()`                 | `(model: TicketCreateModel) => Promise<Ticket>`               | Raises a ticket; invalidates the list on success.                          |
| `uploadAttachment()`       | `(file: File) => Promise<TicketAttachmentRef>`                | Upload **before** the ticket exists; pass the ref on `model.files`.        |
| `savePrefs()`              | `(prefs: Partial<TicketSupportPrefs>) => Promise<TicketSupportPrefs>` | Read-modify-write over the client's meta map.                       |

```ts
import { ScopeActorTypes, useTickets } from "@upmind-automation/headless";
import type { TicketAttachmentRef, TicketCreateModel } from "@upmind-automation/headless";

declare const deskId: string;
declare const productId: string;
declare const ref: TicketAttachmentRef;

const tickets = useTickets().as(ScopeActorTypes.SELF);

const model: TicketCreateModel = {
  subject: "Renewal question",
  body: "When does this renew?",          // optional when files are attached
  ticketDepartmentId: deskId,             // from loadDepartmentOptions().value
  contractProductId: productId,           // optional
  scheduledAt: "2026-10-01T09:00:00Z",    // optional — create-time send-later
  files: [ref]                            // optional — from uploadAttachment()
};
const created = await tickets.useActions().create(model);
```

`scheduledAt` travels as `settings.scheduled_datetime`. `body` is required **only when no files are attached** — see [gotchas.md](./gotchas.md) #9. `client_id` and `brand_id` are filled in by the module; do not supply them.

#### Lookups

| Member                       | Signature                                             | Returns                                        |
| ---------------------------- | ----------------------------------------------------- | ---------------------------------------------- |
| `loadDepartmentOptions()`    | `() => Promise<TicketDepartmentOption[]>`             | `{ value, label, isDefault }` — the desk picker |
| `loadAllDepartments()`       | `() => Promise<ITicketDepartment[]>`                  | the full desk list, raw                        |
| `loadTicketStatuses()`       | `() => Promise<{ code: TicketStatusCodes; name: string }[]>` | the status vocabulary                   |

`value` on a department option is `ticket_department_id`, **not** `id` — see [gotchas.md](./gotchas.md) #8. All three are cached for a day.

### Collection context — `useContext()`

| Member         | Type                                       | Notes                                                                 |
| -------------- | ------------------------------------------ | --------------------------------------------------------------------- |
| `data`         | `ComputedRef<Ticket[]>`                    | The reactive list. **Always an array**, never `undefined`.            |
| `error`        | `ComputedRef<ResponseError \| undefined>`  | Captured failure — criteria rejection first, then service, then query. |
| `findOne`      | `(partial) => Ticket \| undefined`         | Lookup over the loaded rows by a partial mapping.                     |
| `getOne`       | `(id) => Ticket \| undefined`              | Lookup over the loaded rows by id.                                    |
| `pagination`   | reactive pagination descriptor             | Totals, pages, current offset.                                        |
| `query`        | the live criteria model, **read-only**     | Write it only through `setCriteria`.                                  |
| `schemas`      | `{ query: { schema, uischema, sortUischema }, create: { schema, uischema } }` | The filter bar and create form, as plain JSON. |

`schemas.query.sortUischema` is a separate one-element control over the `sort` branch, so an ordering control can be rendered independently of the filter bar.

### Collection meta — `useMeta()`

| Flag           | True when                                                          |
| -------------- | ------------------------------------------------------------------ |
| `isAvailable`  | authenticated **and** a client id resolved — the request gate itself |
| `isLoading`    | the list is loading, or has not completed its first fetch          |
| `isEmpty`      | no rows, or the reported total is `0`                              |
| `hasError`     | the service errored, the query errored, **or** a criteria write was rejected |
| `hasNextPage`  | a further page exists                                              |
| `hasPrevPage`  | a page exists before the current one                               |
| `hasPages`     | the list spans more than one page                                  |

`isAvailable` is the *same predicate* every request gate in the module calls, not a second copy — the flag you render and the guard the wire enforces cannot drift apart.

### Collection internals — `useInternals()`

| Member       | Notes                                        |
| ------------ | -------------------------------------------- |
| `actorScope` | the resolved actor for this instance         |
| `query`      | the raw TanStack query backing the collection |

Debugging only.

---

## The manager — `useTicket`

### Manager actions — `useActions()`

Nineteen members.

#### Reading and refreshing

| Member          | Signature                | Notes                                                        |
| --------------- | ------------------------ | ------------------------------------------------------------ |
| `isReady()`     | `() => Promise<boolean>` | Always settles.                                              |
| `refresh()`     | `() => Promise<void>`    | Re-reads the ticket. Rejects when not addressable.           |
| `invalidate()`  | `() => Promise<unknown>` | Marks **this ticket's** cache key stale, not the whole list. |
| `destroy()`     | `() => void`             | Disarms the poll, drops the visibility listener, unregisters. |

#### The conversation

```ts
import { ScopeActorTypes, useTicket } from "@upmind-automation/headless";

declare const ticketId: string;

const ticket = useTicket().as(ScopeActorTypes.CLIENT).withId(ticketId);

await ticket.useActions().loadOlder(); // the FIRST load — gotchas #4
const { entries, hasOlder, hasNewer, isLoading } = ticket.useContext().feed;
```

| Member                | Signature                                    | Notes                                                                   |
| --------------------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| `loadOlder()`         | `() => Promise<void>`                        | Pages back — `filter[id\|lt]` on the oldest held message id.            |
| `loadNewer()`         | `() => Promise<void>`                        | Pages forward — `filter[id\|gt]` on the newest held message id.         |
| `loadAttachments()`   | `() => Promise<void>`                        | The attachments-only view: a **different request**, not a local filter. |
| `getMessage()`        | `(messageId: string) => Promise<TicketMessage>` | Re-reads one message and replaces its row in the feed in place.      |

The attachments-only view loads messages only — it skips the status-log half entirely, so the feed carries no `log` rows while it is showing.

#### Replying and editing

| Member             | Signature                                                                            | Notes                                                        |
| ------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| `reply()`          | `(body: string, options?: { isPrivate?: boolean; files?: TicketAttachmentRef[] }) => Promise<TicketMessage \| undefined>` | Resolves `undefined` on a stale-reply 409. |
| `editMessage()`    | `(messageId: string, body: string) => Promise<TicketMessage>`                        | Refused with no request when `can_manage` is false.          |
| `deleteMessage()`  | `(messageId: string, reason: string) => Promise<void>`                               | Same refusal. The reason travels in the request body.        |
| `uploadAttachment()` | `(file: File) => Promise<TicketAttachmentRef>`                                     | Upload first, then pass the ref on `reply`'s `files`.        |

```ts
import { ScopeActorTypes, useTicket } from "@upmind-automation/headless";

declare const ticketId: string;
declare const file: File;

const ticket = useTicket().as(ScopeActorTypes.CLIENT).withId(ticketId);

const ref = await ticket.useActions().uploadAttachment(file);
await ticket.useActions().reply("See attached.", { files: [ref] });
```

`reply()` sends the newest held message's id as `last_message_id`, which is how the platform detects a stale reply. **A resolved `undefined` is not a failure** — it means support replied first; the module has already pulled the thread forward via `loadNewer()`. On success it refreshes the ticket too, because a reply can move the status server-side.

#### Attachments

| Member                  | Signature                                                  | Notes                                       |
| ----------------------- | ---------------------------------------------------------- | ------------------------------------------- |
| `downloadAttachment()`  | `(fileId: string) => Promise<ArrayBuffer>`                 | Raw bytes, un-mapped, uncached — gotchas #19 |
| `deleteAttachment()`    | `(messageId: string, fileId: string) => Promise<void>`     | Removes one file from one message.          |

#### Lifecycle

| Member                    | Signature                                       | Refused when                      |
| ------------------------- | ----------------------------------------------- | --------------------------------- |
| `close()`                 | `() => Promise<Ticket>`                         | `settings.lock` is true (`403`)   |
| `reopen()`                | `() => Promise<Ticket>`                         | the ticket is not closed (`422`)  |
| `setSubject()`            | `(subject: string) => Promise<Ticket>`          | `settings.lock` is true (`403`)   |
| `setRelatedProduct()`     | `(contractProductId: string) => Promise<Ticket>` | —                                |
| `removeRelatedProduct()`  | `() => Promise<Ticket>`                         | —                                 |

`setRelatedProduct()` both **links** and **changes** — calling it again replaces the link rather than adding a second. `removeRelatedProduct()` sends an explicit `null`; see [gotchas.md](./gotchas.md) #12.

**There is no `reschedule` and no `changeDepartment`.** Both are dropped as admin-only — see [gotchas.md](./gotchas.md) #6.

### Manager context — `useContext()`

| Member           | Type                                            | Notes                                                 |
| ---------------- | ----------------------------------------------- | ----------------------------------------------------- |
| `data`           | `ComputedRef<Ticket \| undefined>`              | `undefined` before the first fetch settles.           |
| `department`     | `ComputedRef<…>`                                | The ticket's desk relation.                           |
| `relatedProduct` | `ComputedRef<ContractProductEmbedded \| undefined>` | The linked contract product, if any. It omits `allowedMigrations`, `clientInvoiceConsolidationEnabled`, `contractBillingCycleLabel`, `contractCurrencyId`, `contractStatus` and `contractTaxType`; read the product through `useContractProduct` for plan-change facts. |
| `error`          | `ComputedRef<ResponseError \| undefined>`       | Captured read failure. Local refusals **throw** instead. |
| `feed`           | `{ entries, hasOlder, hasNewer, isLoading }`    | The merged message + status-log feed.                 |

`feed.entries` is a discriminated union:

```ts
import type { TicketMessage, TicketStatusLog } from "@upmind-automation/headless";

type TicketFeedEntry =
  | { kind: "message"; message: TicketMessage }
  | { kind: "log"; log: TicketStatusLog };
```

Ordered newest-first by `created_at` across **both** kinds.

### Manager meta — `useMeta()`

| Flag           | True when                                                     |
| -------------- | ------------------------------------------------------------- |
| `isAvailable`  | the scope can address a client                                |
| `isLoading`    | loading, or first fetch not yet complete                      |
| `hasError`     | the service or the query errored                              |
| `isClosed`     | the ticket's status code is `ticket_closed`                   |
| `isLocked`     | `settings.lock` is true                                       |
| `isScheduled`  | the status code is the send-later status                      |
| `isStaged`     | the ticket originated from a staged import                    |
| `isDelegated`  | the ticket is delegated in, not owned                         |
| `isPollable`   | a ticket is loaded and it is not closed                       |
| `canReply`     | not locked                                                    |
| `canReopen`    | the ticket is closed (alias of `isClosed`)                    |

Every one of these is derived **per record**, off the loaded ticket — never per actor.

### Manager internals — `useInternals()`

| Member         | Notes                                                              |
| -------------- | ------------------------------------------------------------------ |
| `actorScope`   | the resolved actor for this instance                               |
| `query`        | the raw TanStack query backing the manager                         |
| `armPoll()`    | arms the 60s poll if the loaded ticket is pollable                 |
| `disarmPoll()` | clears the interval, leaving the visibility listener in place      |
| `teardown()`   | disarms the poll **and** removes the visibility listener           |

The poll arms itself automatically on every status change; you rarely need `armPoll()` directly. `destroy()` calls `teardown()` for you.

---

## Errors are state, never announcements

Nothing in this module raises a toast or a notification. There are two shapes of failure and they land in two different places:

| Failure                                                  | Where it lands                                     |
| -------------------------------------------------------- | -------------------------------------------------- |
| A read failed (list, ticket, thread)                     | `useContext().error` + `useMeta().hasError`        |
| A `setCriteria` write was rejected                       | `useContext().error` + `useMeta().hasError`        |
| A local refusal (locked, not mine, not closed)           | **thrown** `DetailedError` — wrap the call         |
| `refresh()` with no addressable client                   | **thrown** `NotAuthenticatedError`                 |
| A download failed                                        | **thrown** `DetailedError` carrying the HTTP status |

A consumer that wants user-visible feedback renders it from those members, or catches the throw.

---

## Types

Exported from `@upmind-automation/headless`:

| Type                      | What it is                                                             |
| ------------------------- | ---------------------------------------------------------------------- |
| `Ticket`                  | `ITicket`, un-reduced — the row and the detail record are the same shape |
| `TicketMessage`           | `ITicketMessage` plus a derived `isDeleted`                            |
| `TicketStatusLog`         | a hook-log row, plus an optional `statusCode`                          |
| `TicketFeedEntry`         | the `message` \| `log` union above                                     |
| `TicketAttachmentRef`     | the upload response row (the subset this module consumes)              |
| `TicketCreateModel`       | the create form's model                                                |
| `TicketSubjectModel`      | the rename form's model                                                |
| `TicketMessageEditModel`  | the message-correction form's model                                    |
| `TicketDepartmentOption`  | `{ value, label, isDefault }`                                          |
| `TicketSupportPrefs`      | `{ submitWithShortcut, newLineKey, limit }`                            |
| `TicketsQueryModel`       | the whole criteria model                                               |
| `TicketsFilterModel`      | its `filters` branch                                                   |
| `TicketsSortModel`        | its `sort` branch                                                      |
| `TicketsScopeMatrix` / `TicketScopeMatrix` | the two scope matrices' types                          |

Runtime values: `TICKETS_SCOPE_MATRIX`, `TICKET_SCOPE_MATRIX`, `TicketsContextTypes`, `TicketsSortableProperties`.

`Ticket` is `ITicket` with the raw fields kept, plus the date descriptors, `meta`, and `contract_product`. `contract_product` is present on the single read only. It is a `ContractProductEmbedded` view model (camelCase), mapped by `mapContractProductEmbedded`, not the wire record. It omits `allowedMigrations`, `clientInvoiceConsolidationEnabled`, `contractBillingCycleLabel`, `contractCurrencyId`, `contractStatus` and `contractTaxType`. List rows carry `contract_product_id` alone.
