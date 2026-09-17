# tickets

> A client's own support tickets — list, open one, message back and forth, and manage its lifecycle, all as the signed-in client.

## What Is This?

Think of `tickets` as the support-ticket counter a signed-in client sees: their own list of tickets, and a full conversation view on any one of them.

- Every ticket in the list belongs to the calling client.
- Opening one ticket gives you its whole conversation — replies, status changes, attachments — merged into one feed.
- Some actions are refused, not missing: a locked ticket can't be closed or renamed, a reply can't be withdrawn unless the client owns it.

The module ships **two composables**, because reading the list and managing one open ticket are different jobs:

| Surface | Composable | Use it when |
| --- | --- | --- |
| **The collection** | `useClientTickets` | You are showing the ticket list — filter, sort, page, create a new ticket |
| **The manager** | `useClientTicket` | You are showing one ticket — its conversation, its attachments, its lifecycle |

Both always operate on the **calling client's own** tickets. There is no staff or admin capability here, and no capability to reach another client's tickets.

> **🧪 For Testers:** The collection is opened `.as(ScopeActorTypes.SELF)` with no context, or `.as(ScopeActorTypes.CLIENT).for(TicketsContextTypes.PRODUCT, id)` to read the tickets raised about one of my products. The manager is opened `.as(ScopeActorTypes.CLIENT).for(TicketContextTypes.TICKET, id)` — addressing one ticket. `.for('client', id)` is unspellable on both: neither matrix declares `client`, so a list is never retargeted at another client.

## Quick Start

```ts
import {
  ScopeActorTypes,
  TicketContextTypes,
  useClientTickets,
  useClientTicket
} from "@upmind-automation/headless";

// --- The collection: the client's own ticket list
const tickets = useClientTickets().as(ScopeActorTypes.SELF);
await tickets.useActions().isReady();
const { data } = tickets.useContext();

// Narrow to open tickets only (`true` closed, `null`/absent All)
tickets.useActions().setCriteria({
  filters: { isClosed: { eq: false } }
});

// --- The manager: one ticket's conversation
const ticket = useClientTicket()
  .as(ScopeActorTypes.CLIENT)
  .for(TicketContextTypes.TICKET, "the-ticket-id");
await ticket.useActions().isReady();
const { data: one, feed } = ticket.useContext();
await ticket.useActions().reply("Thanks for the update");
```

## Features

| Capability | Surface | What it does |
| --- | --- | --- |
| List, filter, sort, page | `useClientTickets().useActions().setCriteria()` | One write verb over the whole request state — filters, sort, pagination |
| Search | `setCriteria({ query })` | Subject and reference only — never message bodies |
| Create a ticket | `useClientTickets().useActions().create()` | Raises a ticket, optionally with a send-later schedule and attachments |
| Department + status lookups | `loadAllDepartments()`, `loadDepartmentOptions()`, `loadTicketStatuses()` | Owned by this module, not the shared `system` module |
| Support preferences | `savePrefs()` | Read-modify-write over the client's own preference keys |
| Open one ticket | `useClientTicket().as(...).for(...)` | The full conversation, department and linked product |
| Message thread | `loadOlder()`, `loadNewer()`, `getMessage()` | Cursor-paged, merged with the status-change feed |
| Reply | `reply()` | A `409` "more recent reply" outcome is a caution, not an error |
| Edit / withdraw own messages | `editMessage()`, `deleteMessage()` | Refused (no request) when the message isn't the client's own |
| Attachments | `uploadAttachment()`, `loadAttachments()`, `downloadAttachment()`, `deleteAttachment()` | Uploads through this module's own endpoint, never the shared image-upload surface |
| Close / reopen | `close()`, `reopen()` | Refused when the ticket is locked, or already in the wrong state |
| Change subject | `setSubject()` | Refused when the ticket is locked |
| Link / unlink related product | `setRelatedProduct()`, `removeRelatedProduct()` | Unlinking sends an explicit `null`, never an omitted key |

## Key Concepts

### Two surfaces, one client

The collection and the manager are separate composables that share one services factory, so they can never disagree about whose tickets are being read. Whichever surface issues a request, it resolves the same target client — from the resolved scope, never from a direct session read.

> **👩‍💻 For Developers:** There is no per-address form editor here the way `client-email` has one — the manager IS the ticket-lifecycle surface. Reach for `useClientTickets` to list and create; reach for `useClientTicket` for everything about one already-existing ticket.

### The manager addresses a ticket, never a client

`useClientTicket().as('client').for('ticket', id)` names which ticket, not which client — the owning client still resolves from the active session. A ticket is a genuine context (it owns its own records — its messages), not a leaf record, so it is addressed with `.for()`, never `.withId()`.

`useClientTickets().as('client').for('product', id)` reads the same way: it names the PRODUCT the list is about, not a second client. The product a ticket is raised against is a relationship between two entities, and the platform's home for a relationship is the scope context — never a filter column beside `reference` and `subject`, which are attributes of a ticket.

> **🧪 For Testers:** `.as(ScopeActorTypes.STAFF)` and `.as(ScopeActorTypes.CLIENT).for('client', id)` are both compile-time errors on this module's scope matrices — there is no staff arm and no cross-client retarget to test against.

### Some actions are refused, not hidden

A locked ticket (`settings.lock`) refuses `close()` and `setSubject()`. A message whose `can_manage` flag is false refuses `editMessage()` and `deleteMessage()`. `reopen()` is refused unless the ticket is currently closed. Every refusal throws before any request is sent — nothing reaches the wire.

> **🧪 For Testers:** These are local guards, not server round-trips. Assert on the thrown error and on the absence of a matching outbound request in the same call.

### Reschedule and change-department are deliberately absent

This module ships no `reschedule` member and no `changeDepartment` member, on either composable, ever. Legacy reaches both only from an admin-mounted control the client path never renders — this module is client-facing only, so neither ships.

### A reply that arrives late is a caution, not a failure

Replying to a ticket someone else already replied to more recently doesn't reject — `reply()` resolves `undefined` and the thread is refetched forward so the caller sees the newer message. Nothing throws.

### Attachments go through this module's own upload endpoint

Uploads never touch the shared image-upload surface — that surface is image-only by construction. This module ships its own upload path instead, exactly matching how legacy attaches a file to a ticket message.

> **🧪 For Testers:** The 25 MiB size ceiling is enforced and provable. The allowed-file-**type** rejection branch is real code but has no proof it ever actually rejects a type on this brand — see [gotchas.md](./gotchas.md) before you assert it does.

### The poll disarms itself, it doesn't just stop firing

An open ticket polls for updates while its tab is visible, and stops polling outright — not merely skipping a tick — the moment the tab is hidden or the ticket closes. Nothing keeps ticking in the background once there's nothing left to check.

## Documentation

| Doc | Audience | Content |
| --- | --- | --- |
| **This README** | Everyone | Overview, concepts, quick start |
| [usage.md](./usage.md) | All devs | Full API reference for both composables |
| [architecture.md](./architecture.md) | Internal / contributors | Data flow, the shared identity seam, dependencies |
| [gotchas.md](./gotchas.md) | All | The sharp edges — the undotted filter key, the unproven upload-type guard, the `api/self` trap |
| [foundation.md](./foundation.md) | Teams building against the Upmind back end on another stack | Framework-neutral platform spec: endpoints, payloads, failure modes |
| [CHANGELOG.md](./CHANGELOG.md) | All | Change history, recorded fixtures, dropped capabilities |

## Playground

The collection's filter bar, sortable columns and pager render live — real requests, no mocked layer — in the `labs-nuxt` playground:

```bash
pnpm --filter @upmind-automation/labs-nuxt dev
```

Open:

```text
http://labs.localhost:3000/scenarios/client_tickets/as/client
```

The scenario ships no `useDetail` and no `useMutate` — the row's own already-loaded data drives the detail overlay directly (a ticket row already carries its department and linked product in full), and no page-level create/edit form is wired for this scenario yet.

The per-ticket conversation has its own page, addressed by the ticket it is about:

```text
http://labs.localhost:3000/useClientTicket/as/client/for/ticket/<id>
```

It draws itself — no generic surface can render a message thread or a reply composer — and carries the same scenario picker the collection does, over this module's one committed capability spec. Ten of the manager's scenarios replay there; the rest are proven by this module's own specs and are named, with their reasons, in `__tests__/tickets.steps.ts`.

See [labs-nuxt's own README](../../../../../../playgrounds/labs-nuxt/README.md) for how the playground itself works — the scenario-key pattern, the dumb rendering pipeline, and the full test-driving commands.
