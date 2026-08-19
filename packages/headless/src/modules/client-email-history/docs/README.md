# client-email-history

> A client's own record of every email the system has sent them — a browsable collection, and a full single read.

## What Is This?

Think of `client-email-history` as a client's sent-mail log: every email the platform has sent them, in one place.

- Every entry was sent **to** the client — never something the client sent.
- Each entry carries its own delivery outcome: sending, sent, bounced, or errored.
- Opening one entry shows its full rendered body; the list itself only shows the summary fields.

The module ships **two composables**, because browsing a list and reading one email in full are different jobs:

| Surface              | Composable                | Use it when                                                              |
| -------------------- | ------------------------- | ------------------------------------------------------------------------ |
| **The collection**   | `useClientReceivedEmails` | You are showing the history list — search, sort, narrow by outcome, page |
| **The single email** | `useClientReceivedEmail`  | You are showing one email's full content                                 |

Both always read the **calling client's own** history. There is nothing here to compose, send, resend, or delete an email — this module only reads what has already been sent — and there is no capability here to open a different client's history.

> **🧪 For Testers:** Both composables support the client's own (`self`) scope only. `staff` and `guest` are compile-time errors — the underlying platform endpoints have no client-targeted form for a staff member to be given in the first place.

## Quick Start

```ts
import {
  useClientReceivedEmails,
  useClientReceivedEmail
} from "@upmind-automation/headless";

// The collection — browse, search, narrow by delivery outcome
const history = useClientReceivedEmails().as("client");
await history.useActions().isReady();
const { data, schemas } = history.useContext();

// Narrow to failed sends — `setCriteria` is the one write verb
history.useActions().setCriteria({ filters: { error_id: { neq: "null" } } });

// `filterBy` / `sortBy` are the same write, named to one branch each
history.useActions().filterBy({ sent: { eq: true } });
history.useActions().sortBy([{ field: "subject", dir: "asc" }]);

// `schemas.query` is the SAME schema a filter bar renders from
schemas.query.schema;

// The single email — open one in full, including its body
const email = useClientReceivedEmail().as("client").for("email", emailId);
await email.useActions().isReady();
```

## Features

| Capability                            | Surface                                                    | What it does                                                         |
| ------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------- |
| List my email history                 | `useClientReceivedEmails().useContext().data`              | Reactive list of emails sent to me                                   |
| Narrow / sort / page the list         | `…useActions().setCriteria({ filters, sort, pagination })` | The one write verb — merges the given branches into the live request |
| Sort the list (single-purpose door)   | `…useActions().sortBy(sortIntent)`                         | Named adapter over `setCriteria` — merges only the `sort` branch     |
| Narrow the list (single-purpose door) | `…useActions().filterBy(filterIntent)`                     | Named adapter over `setCriteria` — merges only the `filters` branch  |
| Search by subject                     | `…setCriteria({ filters: { subject: { like } } })`         | Wildcarded subject search                                            |
| Narrow by delivery outcome            | `…setCriteria({ filters: { sent, bounced, error_id } })`   | Each outcome column narrows independently                            |
| Render the filter bar                 | `useContext().schemas.query`                               | The schema + uischema pair a renderer derives the filter bar from    |
| Read the live request state           | `useContext().query`                                       | The active filters/sort/pagination model — read-only                 |
| Page                                  | `…useActions().nextPage()` / `.prevPage()`                 | Moves through the list past its default 10-email page                |
| Know whether the list is mine to read | `…useMeta().isAvailable`                                   | Authenticated **and** a client resolved                              |
| Refresh / invalidate                  | `…useActions().refresh()` / `.invalidate()`                | Forces or schedules a re-read                                        |
| Open one email in full                | `useClientReceivedEmail().as('client').for('email', id)`   | Reads that email's complete rendered body                            |
| Know its delivery outcome             | `…useMeta().isBounced` / `.isError` / `.isSent`            | Named flags, mirrored on the collection's own rows                   |

## Key Concepts

### Two surfaces, one identity seam

The collection and the single read are separate composables, but they share one identity seam and one cache key. Whichever surface issues a request, it resolves the same target client — from the active session, never from a direct read of it inside either composable.

> **🧪 For Testers:** With no authenticated client session, NEITHER surface fires a request. `useMeta().isAvailable` reads `false` on both, and any forced `refresh()` rejects rather than reaching the network.

### The collection is always the client's own — and so is the single read

`useClientReceivedEmails().as('client')` and `useClientReceivedEmail().as('client')` both resolve to the calling client's own history. There is no acting-on-behalf-of-another-client capability anywhere in this module, because the underlying platform endpoints have no client-targeted form at all.

> **👩‍💻 For Developers:** Passing a different client's id into `.for('client', id)` on the collection does **not** retarget the read — see [gotchas.md](./gotchas.md#1-forclient-otherid-is-type-reachable-on-the-collection--and-does-nothing-youd-expect) before reaching for it.

### Delivery outcome has a strict precedence

An email carrying both an error and a bounce reports as **errored**, never as bounced. The order is error, then bounced, then sent, then sending — checked in that order, always.

> **🧪 For Testers:** `useMeta().isError` / `.isBounced` / `.isSent` on the single read mirror the SAME status logic the collection's rows use — one mapper serves both, so the two can never disagree about the same email.

### `isAvailable` has two limbs

`useMeta().isAvailable` is `true` when the session is authenticated **and** the scope resolved a client id. Both limbs matter: a session that authenticates without resolving a client correctly reports `false`. It is the _same predicate_ every request gate in the module reads — not a second copy of it — so the flag you render and the guard the wire enforces cannot drift apart.

> **🧪 For Testers:** Before sign-in, `isAvailable` is `false` while `isLoading` is still `true` — the pair distinguishes "not mine to read" from "not read yet."

### The read-only module

There is no `add`, `update`, `remove`, `send`, or `resend` anywhere in this module. Every action either reads, re-reads, narrows, sorts, pages, or releases an instance.

> **🧪 For Testers:** Asserting a mutation-shaped action on either composable asserts `undefined`.

### One write verb, one schema — reached through three names

`useActions().setCriteria(intent)` is the collection's one write path for narrowing, sorting, or paging. `intent` names the top-level branches you want to change (`filters` / `sort` / `pagination`); a branch you leave out stays exactly as it was, and a branch you DO provide replaces that whole branch, not merges into it — combine two filter columns by naming both in the SAME call.

`useActions().filterBy(intent)` and `.sortBy(intent)` are named, single-branch doors onto the exact same path — `filterBy(intent)` **is** `setCriteria({ filters: intent })`, `sortBy(intent)` **is** `setCriteria({ sort: intent })`. Neither holds a copy of the request state of its own, so validation, the wire shape, and the whole-branch-replace rule are identical no matter which of the three names you write through. This is not the same thing as an earlier, withdrawn `sort()` / `filters.*()` facade that built raw wire keys directly and kept its own state — see [CHANGELOG.md](./CHANGELOG.md).

`useContext().schemas.query` publishes the paired `{ schema, uischema }` that describes exactly what all three accept — the same door a filter-bar renderer reads to draw its controls, with no per-field UI code written for it. A write that fails that schema is rejected outright: the previous criteria stands, and the rejection is surfaced, never thrown.

> **🧪 For Testers:** `setCriteria({ filters: { sent: { eq: true } } })` then `setCriteria({ filters: { bounced: { eq: false } } })` leaves the wire carrying only the bounced narrowing — the sent narrowing from the first call does not survive the second, because each call's `filters` branch replaces the last one wholesale. `filterBy` and `sortBy` follow the identical rule, because they forward into the same call.

### Errors are state — the module raises nothing

No toast, no notification, no message is raised on your behalf. Every failure is captured where the consumer can read and render it: `useContext().error` / `useMeta().hasError` on both surfaces.

> **👩‍💻 For Developers:** If your UI shows nothing after a failed read, the error was not lost — it is sitting in `useContext().error` waiting to be rendered.

## Documentation

| Doc                                  | Audience                                                    | Content                                                             |
| ------------------------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------- |
| **This README**                      | Everyone                                                    | Overview, concepts, quick start                                     |
| [usage.md](./usage.md)               | All devs                                                    | Full API reference for both composables                             |
| [architecture.md](./architecture.md) | Internal / contributors                                     | Data flow, the shared identity seam, dependencies                   |
| [gotchas.md](./gotchas.md)           | All                                                         | The sharp edges — the `.for()` hazard, outcome precedence, filters  |
| [foundation.md](./foundation.md)     | Teams building against the Upmind back end on another stack | Framework-neutral platform spec: endpoints, payloads, failure modes |
| [CHANGELOG.md](./CHANGELOG.md)       | All                                                         | Change history and porting notes                                    |

## Playground

None yet. Drive both composables through wherever a client's account area shows their email history.
