# client-custom-pages

> A brand's own custom content pages — a browsable collection, and a full
> single read by route slug.

## What Is This?

Think of `client-custom-pages` as the source for a brand's extra pages — the
ones a brand administrator has added beyond the standard client-area screens
(an "About Us", a policy page, anything else the brand configured).

- Every page belongs to the **brand**, not to any individual client — every
  signed-in client of the same brand sees the identical set.
- Each page carries a menu label and a display title, both independently
  translatable, plus a flag for whether it should appear in navigation.
- Opening one page resolves it by its **route slug** — the same short string
  the page's own URL carries — not by an internal id.

There is nothing here to create, edit, or remove a page, and there is no page
**body** in this module's data at all — see [Key Concepts](#key-concepts).

The module ships **two composables**, because browsing a list and opening one
page are different jobs:

| Surface           | Composable              | Use it when                                                          |
| ------------------ | ------------------------ | --------------------------------------------------------------------- |
| **The collection**  | `useClientCustomPages`  | You are rendering a menu or a browsable list of the brand's pages    |
| **The single page** | `useClientCustomPage`   | You are opening one specific page, by its route slug                 |

> **🧪 For Testers:** The collection resolves for every actor, including a
> guest with no session at all — the list read carries no bearer token. The
> single-page read carries a bearer token whenever a session is active, but
> the underlying resource is not scoped to any individual client either way.
> See [gotchas.md](./gotchas.md#1-forclient-otherid-on-the-collection-type-checks--and-retargets-nothing)
> before assuming a client id passed into the collection's scope changes
> which pages come back — it does not.

## Quick Start

```ts
import {
  ScopeActorTypes,
  useClientCustomPages,
  useClientCustomPage,
  ClientTemplateSlotCodes
} from "@upmind-automation/headless";

// The collection — every actor, including a signed-out guest, can read it
const pages = useClientCustomPages().as(ScopeActorTypes.CLIENT);
await pages.useActions().isReady();
const { data } = pages.useContext();

// Narrow to the pages a menu should show
pages.useActions().filters.showOnMenu(true);

// The single page — opened by its route slug, self is the default actor
const slug = "about";
const page = useClientCustomPage().withId(slug);
await page.useActions().isReady();
const { data: pageData } = page.useContext();

// Rendering the page's actual body is a separate, already-shipped surface,
// keyed by the resolved page's id — this module mints no renderer of its own
// import { useClientTemplate } from "@upmind-automation/headless";
// useClientTemplate({ code: ClientTemplateSlotCodes.CUSTOM_PAGE, objectId: pageData.value?.id });
```

## Features

| Capability                             | Surface                                                     | What it does                                                       |
| --------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------- |
| List the brand's custom pages          | `useClientCustomPages().useContext().data`                  | Reactive list of the brand's pages, readable with no session         |
| Narrow to menu-visible pages           | `…useActions().filters.showOnMenu(true \| false \| undefined)` | Sends the menu-visibility filter; see [gotchas.md](./gotchas.md#3-whether-the-menu-visibility-filter-narrows-the-wire-response-is-unconfirmed) for what is confirmed |
| Narrow to one page by slug (list door) | `…useActions().filters.slug(value)`                          | Narrows the list itself, alongside — not instead of — the single-read door |
| Sort the collection                    | `…useActions().sort(property, direction)`                   | Orders by creation order or name; omitting a property returns to the platform's own order |
| Page through the collection            | `…useActions().nextPage()` / `.prevPage()`                  | Moves through the server-paged window                                |
| Read the live request state            | `useContext().query`                                        | The active filters/sort/pagination model — read-only                 |
| Find one page already on the list      | `useContext().findOne(mapping)` / `.getOne(id)`              | No network request                                                    |
| Know whether the list is ready         | `…useMeta().isReady()` / `useMeta().isLoading`               | Resolves even when there is nothing to read                          |
| Refresh / invalidate the collection    | `…useActions().refresh()` / `.invalidate()`                  | Forces or schedules a re-read                                        |
| Open one page in full by slug          | `useClientCustomPage().withId(slug)`                         | Reads that page's record; short-circuits when the slug is already loaded on a collection — see [gotchas.md](./gotchas.md#4-opening-an-already-listed-page-by-slug-is-built-to-skip-a-second-request--proving-the-skip-itself-needs-a-page-that-does-not-exist-yet) |
| Know a slug does not exist             | `…useMeta().isNotFound`                                     | Discriminates "this page does not exist" from any other read failure |
| Know a background re-read is running   | `…useMeta().isReloading`                                    | Distinct from `isLoading`, which covers only the first load           |

## Key Concepts

### Two surfaces, one identity seam

The collection and the single-page read are separate composables, built over
one shared services layer. Whichever surface issues a request, the resource
they read is the same brand-wide set of pages — neither surface is scoped to
an individual client's own data, because the resource itself has no
per-client owner.

> **🧪 For Testers:** The collection needs no session at all —
> `useMeta().isAvailable` reads `true` even for a signed-out caller, because
> the list read carries no bearer token and the resource is brand-wide, not
> account-scoped.

### The collection accepts a client-scoping id that does nothing

`useClientCustomPages().as('client').for('client', id)` type-checks and
**does not change which pages come back**. There is no per-client owner
anywhere on a page record, and no client id anywhere in the request.

> **👩‍💻 For Developers:** See
> [gotchas.md](./gotchas.md#1-forclient-otherid-on-the-collection-type-checks--and-retargets-nothing)
> before reaching for this — it is a compile-time-reachable no-op, not a
> working capability.

### The read-only module

There is no `create`, `update`, or `remove` anywhere in this module. Every
action either reads, re-reads, narrows, sorts, pages, or releases an
instance.

> **🧪 For Testers:** Asserting a mutation-shaped action on either composable
> asserts `undefined`.

### There is no page body here

A resolved page carries its identifying and menu fields only. Rendering the
page's actual content is a separate, already-shipped surface this module
hands its resolved id to — it mints no renderer of its own.

> **👩‍💻 For Developers:** See
> [gotchas.md](./gotchas.md#6-the-resource-has-no-page-body--the-module-owes-only-the-identifier)
> for the exact hand-off shape.

### Errors are state — the module raises nothing

No toast, no notification, no message is raised on your behalf, including
the not-found case. Every failure is captured where the consumer can read and
render it: `useContext().error` / `useMeta().hasError` / `useMeta().isNotFound`
on the single-page read.

> **👩‍💻 For Developers:** If your UI shows nothing for an unknown slug, the
> error was not lost — it is sitting in `useContext().error` and
> `useMeta().isNotFound`, waiting to be rendered.

## Documentation

| Doc                                  | Audience                                                    | Content                                                             |
| ------------------------------------ | ------------------------------------------------------------ | --------------------------------------------------------------------- |
| **This README**                      | Everyone                                                     | Overview, concepts, quick start                                      |
| [usage.md](./usage.md)               | All devs                                                     | Full API reference for both composables                              |
| [architecture.md](./architecture.md) | Internal / contributors                                      | Data flow, the shared services layer, dependencies                   |
| [gotchas.md](./gotchas.md)           | All                                                          | The sharp edges — the `.for()` no-op, the unpaged default, the built-but-unproven short-circuit |
| [foundation.md](./foundation.md)     | Teams building against the Upmind back end on another stack | Framework-neutral platform spec: endpoints, payloads, failure modes  |
| [CHANGELOG.md](./CHANGELOG.md)       | All                                                          | Change history and what is and is not yet proven                     |

## Playground

A driveable scenario exists at
`playgrounds/labs-nuxt/modules/scenarios/useClientCustomPages/` — it drives
both composables: the collection as a table/card list, and the single-page
read in a read-only detail overlay opened from a row.
