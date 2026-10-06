# client-custom-pages — Gotchas

The sharp edges of the brand's custom-pages collection and its single-page
read. For anyone consuming `useClientCustomPages` / `useClientCustomPage`, or
writing tests against them.

> **🧪 For Testers:** Every section below carries a 🧪 expected-behaviour
> statement. Fixture names point at the recorded request/response pairs in
> `__tests__/fixtures/`.

## 1. `.for('client', otherId)` on the collection type-checks — and retargets nothing

The collection's scope accepts a client id through
`.as('client').for('client', otherId)`, and the call compiles and runs. **It
does not change which pages come back.** The underlying resource is owned by
the brand as a whole, not by any individual client: there is no client id
anywhere in the outbound request, and no client-owner field exists on a page
record at all. Supplying an id here mirrors a shape a related, previously
landed contract also declares — it does not describe a working capability.

```ts
import {
  ClientCustomPagesContextTypes,
  ScopeActorTypes,
  useClientCustomPages
} from "@upmind-automation/headless";

const someClientId = "3f1c8a04-9d2b-4c77-8f31-6b0e5a2d9c14";

// ⚠️ Wrong: this does NOT retarget the read — it type-checks and changes
// nothing about which pages are returned.
const retargeted = useClientCustomPages()
  .as(ScopeActorTypes.CLIENT)
  .for(ClientCustomPagesContextTypes.CLIENT, someClientId);
// retargeted.useContext().data is the SAME brand-wide page list every other
// caller reading this brand sees — the id has no effect on the request.

// ✅ Right: there is no capability to read a different scope's pages here.
// Every live consumer opens the collection with a bare .as('client') call.
const pages = useClientCustomPages().as(ScopeActorTypes.CLIENT);
```

**Why this is not a data leak:** the outbound request is unaffected by the id
you pass — it is always the SAME brand-wide `custom_pages` read. The worst
outcome is a misleading call site, never someone else's data, because there
is no "someone else's data" to leak: every client of the same brand already
sees the identical page set.

**Why the type was not narrowed to prevent this:** the underlying capability
this module mirrors a landed, related contract's own shape, and that contract
is not itself reachable through code paths that would exercise a real
request. Narrowing the type to refuse the id would mean diverging from the
contract it mirrors, for a call no shipped consumer makes.

> **🧪 For Testers:** Do not write a test that asserts `.for('client',
> otherId)` changes the outbound request URL — it never does. The list read
> takes no client-identifying parameter of any kind, under any scope.

## 2. The `0` in `limit=0` / `offset=0` is not "no pagination" — it is a real request

The collection's default page window is `limit=0` / `offset=0`, and both
parameters travel on the wire on every unnarrowed request. On this platform,
a `0` limit is the positive instruction "return every row" — it is not the
same thing as omitting the parameter, and it is not a placeholder a caller
should replace with a small positive default "to be safe".

```ts
import { ScopeActorTypes, useClientCustomPages } from "@upmind-automation/headless";

const pages = useClientCustomPages().as(ScopeActorTypes.CLIENT);
await pages.useActions().isReady();

// The FIRST request this collection ever issues already carries
// limit=0&offset=0 — not an absent pair of parameters, and not a
// small positive default.
```

**Why this matters, concretely.** An earlier draft of this module's query
schema declared a small positive default limit instead of `0`. It reached the
wire on every request and silently truncated the brand's custom pages past
the tenth row — with no error, no empty-result signal, and nothing a caller
watching `isEmpty` or `hasError` would ever see. The regression was caught
only by a human reviewer reading the schema, not by any test, because at the
time no test asserted the window's actual value. A dedicated guard test now
exists specifically to keep this from recurring silently.

> **🧪 For Testers:** Assert `limit=0` and `offset=0` on the collection's
> FIRST observed request, by value — not merely that a `limit` parameter is
> present. A regression that substitutes any small positive default passes a
> "parameter exists" check while still truncating every brand whose page
> count exceeds it.

## 3. Whether the menu-visibility filter narrows the wire response is unconfirmed

The collection accepts a menu-visibility narrowing parameter, and it reaches
the wire as declared. Whether the platform actually applies it is **not
known** — every capture taken so far, with and without the parameter, returns
the identical empty result, because the environment these captures were taken
against currently has zero configured pages. An empty catalogue cannot
distinguish "the filter was honoured and correctly returned nothing" from
"the filter was silently ignored".

```ts
import { ScopeActorTypes, useClientCustomPages } from "@upmind-automation/headless";

const pages = useClientCustomPages().as(ScopeActorTypes.CLIENT);

// This narrows the request as declared. Whether the platform's response
// actually reflects the narrowing cannot currently be confirmed either way.
pages.useActions().filters.showOnMenu(true);
```

**Do not treat this as either "confirmed working" or "known broken".** It is
neither. Once at least one page exists on the recorded environment, a repeat
capture will settle it in one direction; until then, a consumer that depends
on this narrowing actually reducing the row set on the wire is depending on
something this module cannot currently vouch for.

> **🧪 For Testers:** Do not write a test asserting the RESPONSE narrows by
> menu visibility — no fixture exists that could make that assertion honest.
> The request-shape assertion (the correct `filter[...]` parameter is sent)
> is the only thing currently provable.

## 4. Opening an already-listed page by slug is built to skip a second request — proving the skip itself needs a page that does not exist yet

The single-page read is built so that opening a slug already present on an
already-loaded collection resolves that SAME row with no further network
request — only a slug that is NOT already loaded issues its own request. Both
halves of this are real code paths. Only one half currently has a live
demonstration:

- **Proven:** a slug absent from an already-loaded (empty) collection still
  issues its own request — the skip does not over-trigger and silently
  starve a genuinely new read.
- **Not demonstrable today:** a slug PRESENT on an already-loaded collection
  actually skipping the request. This requires at least one page to exist on
  the collection to skip in front of, and the environment these fixtures
  were captured against has none.

```ts
import {
  ScopeActorTypes,
  useClientCustomPage,
  useClientCustomPages
} from "@upmind-automation/headless";

declare const slug: string;

const pages = useClientCustomPages().as(ScopeActorTypes.CLIENT);
await pages.useActions().isReady();

// If `slug` already resolves on `pages`, this issues no further request and
// resolves the same row. Whether that skip actually happens on a live
// response cannot be shown until the brand has at least one page.
const page = useClientCustomPage().withId(slug);
```

**Do not report this as either delivered or missing.** The code path exists,
has a real guard condition, and its failure-safe direction (never wrongly
skipping) is demonstrated. Its success direction (correctly skipping) is
unverified for one specific, named reason — not because it was left
unbuilt, and not because a test failed.

## 5. `isLoading` and `isReloading` are two different signals, not one

`isLoading` reports the collection's or page's FIRST load; `isReloading`
reports a background re-read that follows an already-completed first load. A
consumer rendering a spinner keyed only on `isLoading` will show nothing
during a refresh — that omission is the intended distinction, not a missed
case, and mirrors a two-flag split the legacy provider this module replaces
also kept.

```ts
import { ScopeActorTypes, useClientCustomPages } from "@upmind-automation/headless";

const pages = useClientCustomPages().as(ScopeActorTypes.CLIENT);
const { isLoading, isReloading } = pages.useMeta();

// A spinner that only checks isLoading shows nothing while a background
// refresh is in flight — render isReloading too if that state should
// be visible.
```

> **🧪 For Testers:** `isReloading` is `true` only once the first fetch has
> already completed and a further fetch is in flight; it is `false` for the
> entire duration of the first load, when `isLoading` alone is `true`.

## 6. The resource has no page body — the module owes only the identifier

Neither composable returns a page's rendered content. A resolved page carries
its id, name, slug, title, and menu fields only; rendering the page's actual
body is a separate capability this module hands its id to, not one it
performs itself.

```ts
import { useClientCustomPage } from "@upmind-automation/headless";

declare const slug: string;

// Rendering surface reused as-is, keyed by the resolved page's id — this
// module mints no renderer of its own:
// useClientTemplate({ code: CUSTOM_PAGE_SLOT_CODE, objectId: page.id })

const page = useClientCustomPage().withId(slug);
await page.useActions().isReady();
const { data } = page.useContext();
// data.title / data.menuLabel / data.slug / data.showOnMenu — no body field.
```

> **🧪 For Testers:** Asserting a `body` member anywhere on either
> composable's data asserts `undefined`. Reaching for the page's rendered
> content means driving the separate content-rendering surface with the
> resolved id, never expecting this module to carry it.

## 7. There is no mutation surface

Neither composable can create, edit, or remove a page. Both exist purely to
read pages a brand administrator has already configured elsewhere.

```ts
import { ScopeActorTypes, useClientCustomPages } from "@upmind-automation/headless";

// ⚠️ Wrong: there is no create()/update()/remove() anywhere in this module,
// so none of these even type-check:
//   useClientCustomPages().as("client").useActions().create(...);
//   useClientCustomPage().withId(slug).useActions().update(...);

// ✅ Right: this module reads what a brand has already configured
const { data } = useClientCustomPages().as(ScopeActorTypes.CLIENT).useContext();
```

> **🧪 For Testers:** Asserting a mutation-shaped member on either
> composable's actions asserts `undefined`. There is no form schema and no
> underlying orchestration anywhere in this module — only a read-request
> schema governing what the list can filter, sort, and page by.

## 8. Errors are state — nothing here raises feedback on your behalf

No action in this module produces a toast, a notification, or any other
user-visible message, including the not-found case.

| Surface           | Read the failure from                                      |
| ------------------ | ----------------------------------------------------------- |
| Collection list read | `useContext().error`, `useMeta().hasError`                |
| Single-page read    | `useContext().error`, `useMeta().hasError`, `.isNotFound` |

> **🧪 For Testers:** A consumer that shows nothing after an unknown slug has
> not lost the error — it has not rendered `useContext().error` or checked
> `useMeta().isNotFound`.
