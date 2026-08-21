# client-email

> A client's own email-address book — list, add, edit, delete, set a default, and ask for a verification message.

## What Is This?

Think of `client-email` as a client's personal address book, but for email addresses instead of contacts.

- Every entry is an address the client owns.
- One entry can be flagged as the **default** — the one used first.
- Each entry carries its own status: **verified**, **bounced**, and whether it **can be deleted**.

The module ships **two composables**, because reading a list and filling in a form are different jobs:

| Surface            | Composable              | Use it when                                                                            |
| ------------------ | ----------------------- | -------------------------------------------------------------------------------------- |
| **The collection** | `useClientEmails`       | You are showing the list and acting on rows — delete, set default, resend verification |
| **The editor**     | `useClientEmailManager` | You are showing a form — add a new address, or change an existing one                  |

Both always manage the **calling client's own** book. There is no capability here to open or edit someone else's.

> **🧪 For Testers:** Both composables support the client's own (`self`) scope only. `staff` and `guest` are compile-time errors — there is nothing in this module for one client or a staff member to reach another client's addresses.

## Quick Start

```ts
import {
  useClientEmails,
  useClientEmailManager
} from "@upmind-automation/headless";

// --- The collection: read the list, promote a verified address
const emails = useClientEmails().as("self");
const { data } = emails.useContext(); // the reactive list you render
await emails.useActions().isReady();
await emails.useActions().setDefault("some-verified-email-id");

// --- The editor: add a new address through the validated form
const draft = useClientEmailManager().as("self").fresh();
await draft.useActions().isReady();
await draft.useActions().update({ email: "me@example.com" });
```

The editor's save invalidates the shared cache, so an open collection picks the change up on its next read.

## Features

| Capability                             | Surface                                                      | What it does                                                 |
| -------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| List own addresses                     | `useClientEmails().useContext().data`                        | Reactive list of the client's own addresses                  |
| Read per-address status                | `…useContext().data[].meta`                                  | Default / verified / bounced / deletable flags               |
| Know whether the list is yours to read | `useClientEmails().useMeta().isAvailable`                    | Authenticated **and** a client id resolved                   |
| Know whether the list is filtered      | `useClientEmails().useMeta().isFiltered`                     | True while any declared filter column carries a value        |
| Delete                                 | `useClientEmails().useActions().remove()`                    | Removes a deletable address                                  |
| Set default                            | `…useActions().setDefault()`                                 | Promotes a **verified** address to the default               |
| Request verification                   | `…useActions().verify()`                                     | Asks the platform to (re-)send a verification message        |
| Find or create                         | `…useActions().ensure()`                                     | Resolves an existing match, or creates the address if absent |
| Filter                                 | `…useActions().filterBy()`                                   | Narrows by email text or verified/bounced/default status     |
| Sort                                   | `…useActions().sortBy()`                                     | Reorders by a declared column, re-querying the server        |
| Page                                   | `…useActions().nextPage()` / `.prevPage()`                   | Moves through the list past its default 10-address page      |
| Add a new address                      | `useClientEmailManager().as('self').fresh()` then `update()` | Creates through the validated form                           |
| Change an address                      | `…for('email', id)` then `update()`                          | Edits through the validated form; resets the verified flag   |
| Validate as the client types           | `…useActions().input()` + `useMeta().isValid`                | Reports acceptance and which field is wrong                  |
| Render the form                        | `…useContext().schema` / `.uischema`                         | The form definition, served by the editor                    |

## Key Concepts

### Two surfaces, one client

The collection and the editor are separate composables, but they share one identity seam, one cache key and one set of request gates. Whichever surface issues a request, it resolves the same target client — from the scope the consumer opened, never from a direct session read.

> **👩‍💻 For Developers:** Per-address form editing (`add`, `update`, field validation) lives on the **editor**, not on the collection. The collection's create seam is `ensure()` — find-or-create. If you are reaching for `add()` on the collection, you want the editor.

### The collection is always the client's own

`useClientEmails().as('self')` resolves to the calling client's own address book. There is no acting-on-behalf-of-another-client capability in this module.

> **🧪 For Testers:** With no authenticated client session, the list never fires a request, `useMeta().isAvailable` is `false`, and any mutation rejects immediately rather than reaching the network.

### `isAvailable` has two limbs

`useMeta().isAvailable` is `true` when the session is authenticated **and** the scope resolved a client id to address. Both limbs matter: a session that authenticates without resolving a client correctly reports `false`.

It is the _same predicate_ every request gate in the module calls, not a second copy — so the flag you render and the guard the wire enforces cannot drift apart. It is reactive: it flips `false` in the same tick the session goes away.

> **🧪 For Testers:** Before sign-in, `isAvailable` is `false` while `isLoading` is still `true` — the pair distinguishes "not mine to read" from "not read yet". On sign-out it flips `false` immediately, emitting no request.

### Editing resets verification

Changing an address's value also resets that record's verified flag — even when the submitted value is identical to what is already stored.

> **🧪 For Testers:** A save through the editor on an existing address always sends `{ email, verified: 0 }`. A previously verified address is unverified again after any save, regardless of whether the address text actually changed.

### Defaulting needs a verified address

The platform rejects a promotion to default when the target is unverified, with a `409` and the message _"The default email cannot be changed to unverified email address!"_. Nothing is checked locally before the request goes out — the record's own `isVerified` flag is your only advance warning.

> **🧪 For Testers:** `setDefault()` on an unverified address is a real server rejection, not a local guard. The failure lands in `useContext().error` for the consumer to render.

### Status flags are informational client-side

`meta.canDelete` and `meta.isDefault` describe what the platform last reported. This module does not block a `remove()` or `setDefault()` call based on them.

> **🧪 For Testers:** Calling `remove()` against a record whose flags suggest it should not be allowed is not stopped here — whatever happens next is decided by the platform.

### Find-or-create avoids duplicate adds

`ensure({ email })` checks the loaded collection first; only when no match is found does it create. Saving a fresh draft in the editor takes the same path.

> **🧪 For Testers:** Calling `ensure({ email })` twice with the same address issues at most one create request — the second call resolves the existing record.

### Errors are state — the module raises nothing

No toast, no notification, no message is raised on your behalf. Every failure is captured where the consumer can read and render it: `useContext().error` / `useMeta().hasError` on the collection, `useContext().errors` and `.validationErrors` / `useMeta().hasErrors` on the editor.

> **👩‍💻 For Developers:** If your UI shows nothing after a failed delete, the error was not lost — it is sitting in `useContext().error` waiting to be rendered.

### Two drafts never collide

Each `.fresh()` call mints its own editor instance with its own model. Two new-address forms open at the same time do not interfere.

## Documentation

| Doc                                  | Audience                                                    | Content                                                                                 |
| ------------------------------------ | ----------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **This README**                      | Everyone                                                    | Overview, concepts, quick start                                                         |
| [usage.md](./usage.md)               | All devs                                                    | Full API reference for both composables, plus the paste-ready form schema and UI schema |
| [architecture.md](./architecture.md) | Internal / contributors                                     | Data flow, the shared identity seam, dependencies                                       |
| [gotchas.md](./gotchas.md)           | All                                                         | The sharp edges — verification reset, informational flags, scope, error handling        |
| [foundation.md](./foundation.md)     | Teams building against the Upmind back end on another stack | Framework-neutral platform spec: endpoints, payloads, failure modes                     |
| [CHANGELOG.md](./CHANGELOG.md)       | All                                                         | Change history and porting notes                                                        |

## Playground

The collection's filter bar, sortable columns and pager render live — real requests, no mocked layer — in the `labs-nuxt` playground:

```bash
pnpm --filter @upmind-automation/labs-nuxt dev
```

Open:

```text
http://labs.localhost:3000/scenarios/client_emails/as/client
```

That renders the signed-in client's own collection: a full-width search box and three status switches above a sortable, pageable table — every control drawn from `useContext().schemas.query` alone, with no per-field UI code written for it. The panel on the right (open by default) shows, side by side and with zero requests fired to produce it, the query schema, its UI schema, the current parsed model, and the exact request parameters that model builds — so a filter, a sort, or a page click can be checked against the schema-to-wire mapping before it reaches the network.

The collection boots on its declared page size of **10** rows; filtering, sorting and the current page all survive a browser reload.

The per-address form editor has no playground yet.

See [labs-nuxt's own README](../../../../../../playgrounds/labs-nuxt/README.md) for how the playground itself works — the scenario-key pattern, the dumb rendering pipeline, and the full test-driving commands.
