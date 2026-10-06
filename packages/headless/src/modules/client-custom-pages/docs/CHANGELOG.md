# Changelog

All notable changes to the `client-custom-pages` module are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

- **`useClientCustomPages`** — a net-new scoped collection composable
  reading the brand's custom pages. Readable by every actor, including a
  signed-out guest — the list request carries no bearer token.
- **`useClientCustomPage().withId(slug)`** — a net-new scoped single-read
  composable, resolving one page in full by its route slug. `.for()` is a
  compile-time error on this composable for every actor — a route slug is a
  record identifier, never a scope context.
- **`useActions().filters.showOnMenu(value?)` / `.slug(value?)`** on the
  collection — narrows the request by menu visibility or by route slug.
  Both merge into the live filter state; naming one does not clear the
  other.
- **`useActions().sort(property?, direction?)`** on the collection — orders
  by creation order or name; omitting the property returns to the
  platform's own default order.
- **`useActions().nextPage()` / `.prevPage()`** on the collection — walks
  the server-paged window. The collection's default window is the unpaged
  one (`limit=0` / `offset=0` on every request), not a small default page
  size.
- **`useContext().schemas.query`** on the collection — the request schema
  plus a filter-bar presentation and a sort-control presentation, so a
  renderer can derive its controls from the same schema that validates
  every write.
- **`useContext().findOne()` / `.getOne(id)`** on the collection — row
  lookups over the loaded list, with no network request.
- **`useMeta().isReloading`** on both composables — distinguishes a
  background re-read that follows an already-completed first load from the
  first load itself, matching a two-flag distinction the module this
  replaces also kept.
- **`useMeta().isNotFound`** on the single-page read — discriminates a
  genuine unknown-slug response from any other read failure, without
  throwing; `data` stays empty either way.
- **The single-page read resolving from an already-loaded collection.** When
  the requested slug is already present on an already-loaded collection
  under the same actor, the single read resolves that SAME row. See
  "Known limitations" below — this capability's negative boundary is
  demonstrated; its positive boundary is not yet demonstrable against a live
  response.
- **`useActions().destroy()`** on both composables — releases a scoped
  instance so a fresh `.as()` / `.withId()` call mints a new one.
- **`useInternals()`** on both composables — debug access to the raw
  backing request handle.

### Design notes

- **The single-page read carries a bearer token; the list never does.** This
  asymmetry is deliberate: the list is read at a point before a session
  necessarily exists, and the resource itself is not identity-scoped either
  way. Flattening either direction changes observable behaviour.
- **The collection's scope declares a client-scoping context cell that does
  not retarget the request.** The underlying resource is brand-wide, not
  client-owned — there is no client id anywhere in the outbound request or
  on a page record. The cell exists to mirror a shape a related, already-
  landed contract declares; it does not describe a working capability. See
  [gotchas.md](./gotchas.md#1-forclient-otherid-on-the-collection-type-checks--and-retargets-nothing).
- **The page's rendered body is out of this module's scope entirely.** A
  resolved page carries identifying and menu fields only. Its body is
  rendered through a separate, already-shipped surface, keyed by the
  resolved page's id — this module mints no renderer of its own.

### Fixed

- **A truncation regression, caught before release.** An earlier draft of
  the collection's request schema declared a small positive default page
  size instead of the unpaged default. It reached the wire on every request
  and would have silently truncated any brand with more than a handful of
  custom pages, with no error and no empty-result signal to notice locally.
  Caught by review, not by a test — at the time, no test asserted the actual
  value of the page-window parameters. A dedicated guard test now asserts
  the unpaged default's literal value on the first request, specifically to
  keep this class of regression from recurring silently.
- **A filter-state bug where narrowing by one field silently cleared
  another.** An earlier draft of the two named filter actions replaced the
  whole filter branch on every call rather than merging into it, so setting
  the menu-visibility filter after the slug filter (or vice versa) silently
  dropped the one set first. Both filter actions now merge over the current
  filter state.
- **A schema-family publishing gap.** The filter-bar and sort-control
  presentations existed as internal functions with no consumer, because the
  collection's public context did not publish them. Nothing outside the
  module could reach either presentation, which meant a renderer's filter
  bar and sort control had no schema to draw from at all. Both are now
  published on the collection's context.

### Known limitations in what could be demonstrated

The environment these fixtures were captured against currently has **zero**
custom pages configured for the recording brand. Several real code paths are
consequently not demonstrable end-to-end against a live response, and are
disclosed here rather than presented as either delivered or missing:

- **The single-page read's positive short-circuit.** Opening a slug already
  present on an already-loaded collection is built to resolve that row with
  no further request. The negative boundary (a slug NOT already loaded still
  issuing its own request) is demonstrated by a real integration test. The
  positive boundary requires at least one real page to exist on a loaded
  collection to skip in front of, which the recorded environment does not
  currently have.
- **Whether the menu-visibility filter narrows the platform's response.**
  The request carries the filter parameter as declared. Two live probes,
  taken a day apart, both returned the identical empty result the unfiltered
  request also returns — an empty catalogue cannot distinguish "the filter
  was honoured and correctly returned nothing" from "the filter was silently
  ignored". Neither outcome is asserted; only the outbound request shape is
  currently provable.
- **A populated page record, on either the collection or the single read.**
  Every real capture against either endpoint returns either an empty list or
  a not-found error. No live capture of a successful single-page response,
  or of a list response carrying any row, exists. The mapped record shape
  documented in [foundation.md](./foundation.md) is declared from the
  platform's typed model and this module's own mapping, not confirmed
  against a populated live row.
- **A page carrying a real translation.** The translation-fallback behaviour
  (an empty translated value falls back to the untranslated original) is
  proven by a constructed unit-test input, never by a live captured row,
  because every real capture is empty.

None of these are gaps in what the code does — each is a gap in what the
currently recorded environment can demonstrate. Configuring at least one
custom page on the recording brand and re-capturing would close every one of
them. Hand-authoring a fixture to simulate that instead is deliberately
avoided: a fabricated fixture presented as recorded would certify a contract
no real system has actually exhibited.

### Recorded fixtures

Three request/response pairs captured against a live environment back the
documented behaviour:

| Fixture                                                                          | Covers                                                                 |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `get-custom-pages.json`                                                         | the default (unfiltered, unpaged) list read against a brand with zero configured pages |
| `get-custom-pages-case-menu-filter-probe-filter-show-on-menu-1.json`             | the menu-visibility filter probe — identical empty result to the unfiltered read |
| `get-custom-pages-no-such-page-xyz.json`                                        | the single-page read's real typed not-found response                  |

### Notes

- Both composables act on the same brand-wide set of pages. The collection
  needs no session; the single read carries a bearer token whenever one is
  active, though the resource is not identity-scoped either way.
- `.for('client', otherId)` is type-reachable on the collection but does not
  retarget the outbound request — see
  [gotchas.md](./gotchas.md#1-forclient-otherid-on-the-collection-type-checks--and-retargets-nothing).
  This is a deliberately accepted, documented divergence, not a defect
  awaiting a fix.
- A related area of this platform (an administrator-facing read of the same
  underlying pages) exists but is out of this module's scope entirely — this
  module addresses the brand's own client-facing area only.
