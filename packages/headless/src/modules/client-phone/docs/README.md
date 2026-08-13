# client-phone

> A client's own phone-number book — list, add, edit, delete, and set a default.

## What Is This?

Think of `client-phone` as a client's personal phone book, but the platform manages it.

- Every entry is a number the client owns.
- One entry can be flagged as the **default** — the one used first.
- Each entry carries its own status: **verified** (display-only — see Gotchas), **deletable**, and a numeric **category**.

The module ships **two composables**, because reading a list and filling in a form are different jobs:

| Surface            | Composable              | Use it when                                                          |
| ------------------ | ----------------------- | -------------------------------------------------------------------- |
| **The collection** | `useClientPhones`       | You are showing the list and acting on rows — delete, set default    |
| **The editor**     | `useClientPhoneManager` | You are showing a form — add a new number, or change an existing one |

Both always manage the **calling client's own** book. There is no capability here to open or edit someone else's.

> **🧪 For Testers:** Both composables support the client's own (`self`) scope only. `staff` and `guest` are compile-time errors — there is nothing in this module for a staff member to reach another client's phone numbers. Staff phone management is a real capability the platform has elsewhere; it is tracked, not delivered here — see [gotchas.md](./gotchas.md#13-staff-phone-management-is-not-delivered-here--its-tracked-not-forgotten).

## Quick Start

```ts
import {
  useClientPhones,
  useClientPhoneManager
} from "@upmind-automation/headless";

// --- The collection: read the list, promote a verified-looking number
const phones = useClientPhones().as("self");
const { data } = phones.useContext(); // the reactive list you render
await phones.useActions().isReady();
await phones.useActions().setDefault("some-phone-id");

// --- The editor: add a new number through the validated form
const draft = useClientPhoneManager().as("self").fresh();
await draft.useActions().isReady();
await draft.useActions().update({
  phone: {
    number: null,
    nationalNumber: "7911123456",
    countryCallingCode: null,
    country: null
  }
});
```

The editor's save invalidates the shared cache, so an open collection picks the change up on its next read.

## Features

| Capability                             | Surface                                                      | What it does                                                       |
| -------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------ |
| List own numbers                       | `useClientPhones().useContext().data`                        | Reactive list of the client's own phone numbers                    |
| Read per-number status                 | `…useContext().data[].meta`                                  | Default / verified (display-only) / deletable flags                |
| Know whether the list is yours to read | `useClientPhones().useMeta().isAvailable`                    | Authenticated **and** a client id resolved                         |
| Delete                                 | `useClientPhones().useActions().remove()`                    | Removes a deletable number; confirms success or failure by message |
| Set default                            | `…useActions().setDefault()`                                 | Promotes a number to the default; confirms success or failure      |
| Find or create                         | `…useActions().ensure()`                                     | Resolves an existing match, or creates the number if absent        |
| Filter                                 | `…useActions().filters.query()`                              | Narrows the list to a search term                                  |
| Add a new number                       | `useClientPhoneManager().as('self').fresh()` then `update()` | Creates through the validated form                                 |
| Change a number                        | `…for('phone', id)` then `update()`                          | Edits through the validated form                                   |
| Validate as the client types           | `…useActions().input()` + `useMeta().isValid`                | Reports acceptance and which part is wrong                         |
| Render the form                        | `…useContext().schema` / `.uischema`                         | The form definition, served by the editor                          |

## Key Concepts

### Two surfaces, one client

The collection and the editor are separate composables, but they share one identity seam, one cache key and one set of request gates. Whichever surface issues a request, it resolves the same target client — from the scope the consumer opened, never from a direct session read.

> **👩‍💻 For Developers:** Per-number form editing (`add`, `update`, field validation) lives on the **editor**, not on the collection. The collection's create seam is `ensure()` — find-or-create. If you are reaching for `add()` on the collection, you want the editor.

### The collection is always the client's own

`useClientPhones().as('self')` resolves to the calling client's own phone book. There is no acting-on-behalf-of-another-client capability in this module today.

> **🧪 For Testers:** With no authenticated client session, the list never fires a request, `useMeta().isAvailable` is `false`, and any mutation rejects immediately rather than reaching the network.

### The editor waits on a country before it is usable

Opening the editor — fresh or on an existing number — resolves the client's country reference data first, and seeds the form's starting country from it. A form that became usable before that resolved would have nothing to validate a typed number against.

> **🧪 For Testers:** `useMeta().isLoading` stays `true` while the editor waits on this resolution. Nothing is sent to the server before it settles.

### Deleting and setting default confirm with a message; nothing else does

Unlike some sibling collections in this codebase, this one raises a success or failure message for exactly two mutations: `remove()` and `setDefault()`. Every other capability — adding, editing, find-or-create — reports its outcome only through the state the caller reads (`useContext().error`, the rejected/resolved promise), never a message of its own.

> **🧪 For Testers:** Only `remove()` and `setDefault()` produce a user-visible confirmation. Do not expect one from a manager save.

### `type` (category) and `verified` are read-only

Every phone record carries a numeric category and a verified flag. Both are informational: nothing in this module lets a consumer set the category, and nothing confirms a number's ownership. See [gotchas.md](./gotchas.md) for what that means for a reader porting from a sibling module that does support one of these.

### Status flags are informational client-side

`meta.canDelete` describes what the platform last reported. This module does not block a `remove()` call based on it.

> **🧪 For Testers:** Calling `remove()` against a record whose flags suggest it should not be allowed is not stopped here — whatever happens next is decided by the platform.

### Find-or-create avoids duplicate adds

`ensure({ phone })` checks the loaded collection first; only when no match is found does it create. Saving a fresh draft in the editor takes the same path.

> **🧪 For Testers:** Calling `ensure({ phone })` twice with the same number issues at most one create request — the second call resolves the existing record.

### Two drafts never collide

Each `.fresh()` call mints its own editor instance with its own model. Two new-number forms open at the same time do not interfere.

## Documentation

| Doc                                  | Audience                                                    | Content                                                                                 |
| ------------------------------------ | ----------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **This README**                      | Everyone                                                    | Overview, concepts, quick start                                                         |
| [usage.md](./usage.md)               | All devs                                                    | Full API reference for both composables, plus the paste-ready form schema and UI schema |
| [architecture.md](./architecture.md) | Internal / contributors                                     | Data flow, the shared identity seam, dependencies                                       |
| [gotchas.md](./gotchas.md)           | All                                                         | The sharp edges — pagination, session stalls, scope, drops, error handling              |
| [foundation.md](./foundation.md)     | Teams building against the Upmind back end on another stack | Framework-neutral platform spec: endpoints, payloads, failure modes                     |
| [CHANGELOG.md](./CHANGELOG.md)       | All                                                         | Change history and porting notes                                                        |

## Playground

None yet. Drive the collection and the editor through wherever a client manages their own contact phone numbers — the personal-details form, the billing-detail step of checkout, or a phone-selector field.
