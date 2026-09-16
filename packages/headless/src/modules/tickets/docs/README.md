# tickets

> A client's own support desk — list, search and page their tickets, raise a new one, open a ticket's conversation, reply, correct or withdraw their own messages, attach and download files, close, reopen, rename, and link the ticket to one of their products.

## What Is This?

Think of `tickets` as the client side of a help desk. Every ticket is a conversation between the client and the support team, with a subject, a reference, a status, a desk (department), and — optionally — one of the client's own products attached to it.

The module ships **two composables**, because browsing a list and living inside one conversation are different jobs:

| Surface            | Composable         | Use it when                                                                   |
| ------------------ | ------------------ | ----------------------------------------------------------------------------- |
| **The collection** | `useClientTickets` | You are showing the ticket list — search, filter, sort, page, raise a new one |
| **The manager**    | `useClientTicket`  | You are inside one ticket — read the thread, reply, close, reopen, rename     |

Both always read the **calling client's own** desk. There is no staff surface here, no acting-on-behalf-of-another-client, and no admin path: every request this module issues is `api/…`, never `api/admin/…`.

> **🧪 For Testers:** The two composables are addressed **differently**, and the difference is deliberate. The collection is `.as(ScopeActorTypes.SELF)` over an **all-`never`** scope matrix, so `.for()` is unspellable on it. The manager is `.as(ScopeActorTypes.CLIENT).for(TicketContextTypes.TICKET, id)`, because a ticket is a genuine ADR-001 **context** — it owns its own records (its messages), so it is not a leaf. Always enum members, never string literals, and **never a cast on the scope builder** — see [gotchas.md](./gotchas.md).

## Quick Start

```ts
import {
  ScopeActorTypes,
  TicketContextTypes,
  useClientTicket,
  useClientTickets
} from "@upmind-automation/headless";

// --- The collection: the client's own ticket list
const tickets = useClientTickets().as(ScopeActorTypes.SELF);
const { data, schemas } = tickets.useContext(); // the reactive list you render
await tickets.useActions().isReady();

// Narrow to the "active" tab — note the UNDOTTED schema key (gotchas #1)
tickets.useActions().setCriteria({
  filters: { statusCode: { neq: "ticket_closed" } }
});

// --- The manager: one ticket and its conversation
const ticket = useClientTicket()
  .as(ScopeActorTypes.CLIENT)
  .for(TicketContextTypes.TICKET, ticketId);

const { data: one, feed } = ticket.useContext();
await ticket.useActions().isReady();
await ticket.useActions().loadOlder(); // the FIRST thread load — gotchas #4
await ticket.useActions().reply("Thanks for the update");
```

Both halves are built from **one services factory**, so they share one identity seam, one base cache key (`["client", "tickets"]`) and one addressability predicate. A write on the manager invalidates that ticket's own cache key; a create on the collection invalidates the list.

## Features

| Capability                          | Surface                                                         | What it does                                                      |
| ----------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------- |
| List own tickets                    | `useClientTickets().useContext().data`                          | Reactive list, most-recently-updated first                        |
| Narrow / search / sort / page       | `…useActions().setCriteria()`                                   | One validated write verb over filters · query · sort · pagination |
| Walk pages                          | `…useActions().nextPage()` / `.prevPage()`                      | Moves through the list                                            |
| Persist the page size               | `…useActions().setPageSize(n)`                                  | Applies it **and** saves it to the client's own prefs             |
| Raise a new ticket                  | `…useActions().create(model)`                                   | Creates, including create-time scheduling; invalidates the list   |
| Attach a file (before a ticket)     | `…useActions().uploadAttachment(file)`                          | Uploads, returning the ref `create()`'s `files` consumes          |
| Desk options for the create form    | `…useActions().loadDepartmentOptions()`                         | The brand's public desks, with the default pre-marked             |
| All desks                           | `…useActions().loadAllDepartments()`                            | The full desk list — a **different shape** (gotchas #8)           |
| Status vocabulary                   | `…useActions().loadTicketStatuses()`                            | Ticket statuses, named not coded                                  |
| Support preferences                 | `…useActions().savePrefs(prefs)`                                | Submit-shortcut, new-line key, page size — read-modify-write      |
| Render the filter bar / create form | `…useContext().schemas`                                         | Query + create schema and uischema, served by the module          |
| Open one ticket                     | `useClientTicket().useContext().data`                           | The full detail record with its relations                         |
| Read the conversation               | `…useContext().feed.entries`                                    | Messages **and** status-log rows merged into one ordered feed     |
| Page the conversation               | `…useActions().loadOlder()` / `.loadNewer()`                    | Cursor-paged on the message id, in both directions                |
| Attachments-only view               | `…useActions().loadAttachments()`                               | A different request, never a client-side filter                   |
| Re-read one message                 | `…useActions().getMessage(id)`                                  | Replaces that row in the feed in place                            |
| Reply                               | `…useActions().reply(body, { files, isPrivate })`               | Posts a reply; a stale-reply 409 resolves as a caution            |
| Correct own message                 | `…useActions().editMessage(id, body)`                           | Refused with **no request** when the message is not the client's  |
| Withdraw own message                | `…useActions().deleteMessage(id, reason)`                       | Same refusal; the reason travels on the wire                      |
| Download an attachment              | `…useActions().downloadAttachment(fileId)`                      | The file's own raw bytes                                          |
| Remove an attachment                | `…useActions().deleteAttachment(messageId, fileId)`             | Deletes one file off one message                                  |
| Close / reopen                      | `…useActions().close()` / `.reopen()`                           | Close refused when locked; reopen only when already closed        |
| Rename                              | `…useActions().setSubject(subject)`                             | Refused when locked                                               |
| Link / change / unlink a product    | `…useActions().setRelatedProduct()` / `.removeRelatedProduct()` | Unlink sends an **explicit null**, never an omitted key           |
| Watch a live ticket                 | `…useMeta().isPollable`, `useInternals().armPoll()`             | A 60s poll on a visible tab only, armed automatically             |

## Key Concepts

### Two surfaces, one client, one services factory

The collection and the manager are separate composables registered under the **same** module name; the composable name and the scope key carry the differentiation. Both build from `createTicketsServices`, so the two halves can never disagree about whose tickets are being read. The target client falls out of `resolveClientId(scopeContext)` — the module's one identity seam — and nothing in this module ever spells `.for('client', id)`.

### The conversation is a *merged* feed, not a message list

`useContext().feed.entries` is one ordered sequence of two kinds of row, discriminated by `kind`:

- `{ kind: "message", message }` — a real message in the thread
- `{ kind: "log", log }` — a ticket-lifecycle status change (opened, closed, reopened, in progress, client replied, waiting response)

The two come from **two different endpoints** and are merged newest-first inside the module. Agent-internal log rows are excluded from the message half (`filter[is_log]=0`); the status-log half is a separate read of the client's own hook logs, narrowed to the six ticket hook codes.

> **🧪 For Testers:** The thread request asks for `limit + 1` rows and reports `hasMore` from the overflow, then trims back to `limit`. A thread page of ten issues `limit=11`. That probe is what `feed.hasOlder` / `feed.hasNewer` are computed from — an even, round `limit` on the wire means the probe was lost.

### Every write gate is per-**record**, never per-actor

`close()`, `setSubject()`, `editMessage()` and `deleteMessage()` refuse **before any request** based on what the loaded record says — `settings.lock` on the ticket, `can_manage` on the message. There is no actor branch anywhere in this module: one client, one code path.

> **🧪 For Testers:** A refused write sends **nothing**. Assert on the absence of an outbound request, not only on the thrown error.

### Errors are state — the module raises nothing

No toast, no notification. Every failure is captured where the consumer can read and render it: `useContext().error` and `useMeta().hasError` on both halves. A rejected `setCriteria` write lands there too — it is validated against the module's own schema **before** anything reaches the wire.

### A stale reply is a caution, not a failure

If support replies while the client is typing, the reply POST returns `409 ticket_has_more_recent_reply`. This module resolves that to `undefined` and pulls the thread forward instead of surfacing an error — exactly as the legacy app treats it.

### The module deliberately ships **no** reschedule and **no** change-department

Post-creation reschedule and changing a ticket's desk are **admin-only** in the legacy app — reachable only from an admin-mounted controls dropdown, never from the client action list. They are dropped under operator ruling **R5**, and there is no member for either on either composable. Create-time scheduling (`scheduledAt` on the create model) **is** supported and is a different thing. See [gotchas.md](./gotchas.md).

### This module owns its own desk and status lookups

The department and status lookups live **here**, not in the shared `system` module (whose equivalents sit commented out at `useSystem.ts:37-38`). That is operator ruling **R3**, and it is deliberate — see [architecture.md](./architecture.md).

### Attachments use a tickets-local upload

Uploads go to `POST api/ticket_messages/files`, not the shared `system-upload` surface — ruling **R2**. `system-upload` switches on image object types and every branch emits a `.../images` path, so it cannot carry an arbitrary file.

## Documentation

| Doc                                  | Audience                                                    | Content                                                                               |
| ------------------------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **This README**                      | Everyone                                                    | Overview, concepts, quick start                                                       |
| [usage.md](./usage.md)               | All devs                                                    | Full API reference for both composables, plus the exported schemas                    |
| [architecture.md](./architecture.md) | Internal / contributors                                     | Data flow, the one services factory, the criteria-key translation, dependencies       |
| [gotchas.md](./gotchas.md)           | All                                                         | The sharp edges — the undotted criteria key, the upload path, the unproven type guard |
| [foundation.md](./foundation.md)     | Teams building against the Upmind back end on another stack | Framework-neutral platform spec: endpoints, payloads, failure modes                   |
| [CHANGELOG.md](./CHANGELOG.md)       | All                                                         | Change history, recorded fixtures, and porting notes                                  |

## Playground

The collection's filter bar, sortable columns, pager and read-only detail overlay render live — real requests, no mocked layer — in the `labs-nuxt` playground:

```bash
pnpm --filter @upmind-automation/labs-nuxt dev
```

Open:

```text
http://labs.localhost:3000/useClientTickets
```

The directory name (`useClientTickets`) is the route name **and** the url segment; the optional `/as/:actor` and `/for/:type/:id` segments move the page's scope.

The page binds the **collection** only. It declares no `useDetail`, because the manager addresses its ticket through `.for(TicketContextTypes.TICKET, id)` and the playground runtime's generic single-read wiring only ever calls `.withId(id)` — binding it would boot a manager with no ticket context at all. The detail overlay draws the clicked row's own data instead, which loses nothing: `Ticket` is `ITicket` un-reduced, so the list row already carries `department`, `settings` and `contract_product` in full. It declares no `handoff` either: the module's writes live on the per-record manager, and the collection carries no matching generic `update` / `resolve` member for the runtime's form flow to drive.

See [labs-nuxt's own README](../../../../../../playgrounds/labs-nuxt/README.md) for how the playground itself works.
