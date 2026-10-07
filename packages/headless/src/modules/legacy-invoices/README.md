# legacy-invoices

## What Is This?

`legacy-invoices` gives a signed-in client read access to the invoices carried
over from a predecessor billing system when their account moved onto this
platform. Each one is a frozen, historical bill — the platform preserves the
original document exactly as the old system produced it, and re-derives a
small set of top-level fields (number, total, dates) so the archive can be
listed, filtered, sorted and paged like any other collection.

A client can browse the archive, open one record in full, and download its
PDF. Nothing here can be paid, cancelled, refunded, edited, or shared — it is
a read-only historical record. A staff-side view of the same archive is a
separate, unbuilt surface.

## Public Surface

```typescript
import { useLegacyInvoices } from "@upmind-automation/headless";
```

## Quick Start

```typescript
const module = useLegacyInvoices().as("self");
const { data, findOne, getOne } = module.useContext();
const { isReady, refresh } = module.useActions();

await isReady();
const items = data.value;
```

## Actor Usage

| Call | Meaning |
| --- | --- |
| `useLegacyInvoices().as('self')` | The active session's own collection |
| `useLegacyInvoice().withId(id)` | One record, read in full — self by default |

This module ships the **client × self cell only**. Both composables declare an
all-`never` scope matrix, so `.for(entity, id)` is a COMPILE ERROR on each of
the four actors, from application code — there is no staff call to write, and
the legacy oracle offers the client no entity to act on behalf of (ruling OD1).
A staff-side archive is separate, unbuilt work.

A record id is **not** a scope context: it rides on `.withId(id)`, and the single
read declares no context enum and no scope matrix. See
`.claude/skills/factory/composable/templates/SINGLE-READ.md` — including the
branch where the run **stops and asks** rather than minting a context type.

## Actor Arms

This module ships armless (clause 2, `code-composables.companion.md` "Variance
law"). All five layers — services, actions, context, meta, schemas — have an
opt-in arm template (`legacy-invoices.services.<actor>.ts` /
`useLegacyInvoices.actions.<actor>.ts` / `useLegacyInvoices.context.<actor>.ts` /
`useLegacyInvoices.meta.<actor>.ts` / `legacy-invoices.schemas.<actor>.ts`), cross-cited from the
machine variant's `auth/` (services/actions) or the doctrine PROSE directly
(context/meta/schemas) — no TanStack-backed module has earned an arm at any
layer yet. Copy + concretise one per layer, per actor that actually earns a
member exclusive to it or overriding the shared factory. See `.claude/skills/factory/composable/templates/ARMS.md` for
the full when/how/checker-gate decision tree; do not scaffold an arm un-earned.

## File Layout

```text
legacy-invoices/
├── legacy-invoices.types.ts
├── legacy-invoices.services.ts
├── legacy-invoices.services.<actor>.ts     # opt-in — see .claude/skills/factory/composable/templates/ARMS.md
├── legacy-invoices.mappers.ts
├── legacy-invoices.schemas.ts
├── legacy-invoices.schemas.<actor>.ts      # opt-in — see .claude/skills/factory/composable/templates/ARMS.md
├── useLegacyInvoices.ts
├── useLegacyInvoices.actions.ts
├── useLegacyInvoices.actions.<actor>.ts    # opt-in — see .claude/skills/factory/composable/templates/ARMS.md
├── useLegacyInvoices.context.ts
├── useLegacyInvoices.context.<actor>.ts    # opt-in — see .claude/skills/factory/composable/templates/ARMS.md
├── useLegacyInvoices.meta.ts
├── useLegacyInvoices.meta.<actor>.ts       # opt-in — see .claude/skills/factory/composable/templates/ARMS.md
├── useLegacyInvoices.internals.ts
├── useLegacyInvoice.ts                     # opt-in — single-record read, see .claude/skills/factory/composable/templates/SINGLE-READ.md
├── useLegacyInvoice.actions.ts
├── useLegacyInvoice.context.ts
├── useLegacyInvoice.meta.ts
├── useLegacyInvoice.internals.ts
├── index.ts
├── README.md               # this file
├── docs/                   # foundation.md, README.md, usage.md, architecture.md, gotchas.md, CHANGELOG.md
└── __tests__/              # unit + integration tests, fixtures/, the .feature file, the must-fail mutant corpus
```

(`.claude/skills/factory/composable/templates/ARMS.md` /
`.claude/skills/factory/composable/templates/SINGLE-READ.md` /
`.claude/skills/factory/composable/templates/NOT-APPLICABLE.md` are this template set's own factory-authoring
guidance — they are not copied into a built module.)

No `legacy-invoices.machine.ts` — query-backed, no machine (see `.claude/skills/factory/composable/templates/NOT-APPLICABLE.md`).

## Dependencies

- `scope` — `createScopedComposable`, the registry, and scope-key generation. Both composables register under the same module name (`"legacy-invoices"`).
- `session-store` (`useActiveSession`) — resolves the addressable client, is the source of `activeUser.value?.has_legacy_invoices` behind `useLegacyInvoices().as(ScopeActorTypes.SELF).useMeta().hasLegacyInvoices`.
- `query` (`useQuery`, `useUrl`, `download`, `translateQuery`, `invalidateQueryByKey`, `resetQueryByKey`) — `downloadPdf` calls `download()`, which attaches the access token and the `lang` parameter; both `loadList` and `loadOne` are TanStack list/item queries minted through this module; `setCriteria`/`sortBy`/`filterBy` write into the same query's live criteria.
- `invoices` (`invoices.utils.ts` `downloadBlob`) — the **only** import from the sibling `invoices` module (ruling B5). The `download_pdf` request is this module's own (a different endpoint from the invoices PDF); both call `useQuery().download()`.
- `@upmind-automation/types` — `ILegacyInvoice` (the wire shape) and `InvoiceStatus` (the paid/overdue comparison).

## Gotchas

- **Both composables are compile-time client-only, from application code.** `LEGACY_INVOICES_SCOPE_MATRIX` and `LEGACY_INVOICE_SCOPE_MATRIX` are all-`never`, so `.for(entity, id)` is a compile error on every actor for both `useLegacyInvoices` and `useLegacyInvoice`. There is no `.for()` retarget to reach for here — only `.as(actor)` and, on the single read, `.withId(id)`.

- **`content` is a loosely-typed passthrough — nothing guards a wrong path.** `LegacyInvoice.content` is `Record<string, unknown>`; four of the five derived conditions in `useLegacyInvoice.meta.ts` each read one specific path off it (`content.status.code` for `isPaid`/`isOverdue`, `content.partial_amount_credited_converted` for `isCredited`, `content.proforma` for `isProforma`). The fifth, `isStaged`, reads the record's own **top-level** `staged_import` field, never a path inside `content`. A wrong path compiles, returns `undefined`, and silently reads as the condition's default — verify any new path against a real captured fixture, never against the type.

- **A filter or sort write — including a `setCriteria` write that carries no `pagination` branch — resets `pagination.offset` to 0, unlike the legacy application, which keeps the reader's page (ruling OD7 — accepted, not a bug).** The oracle's own filtering mixin recomputes the request from `this.config.page` rather than zeroing it (`tableWithFilteringAndSortingStore.ts:186-199` builds the merged config the request reads, `:242` turns `this.config.page` into the emitted `offset`); this module's collection sits on the shared query layer, whose criteria write re-zeroes the cursor whenever the write does not itself carry a `pagination` branch (`query/useQueryCriteria.ts`, `pagination.offset: 0` on write) — off limits to work around here. Proven in `legacy-invoices.divergences.int.test.ts`.

- **Requesting a page past the end lands on the LAST page, not page one, unlike the legacy application, which recovers to page one (accepted divergence, signed off by op:dom@upmind.com, 2026-09-24).** The oracle's own store recovers to page one on an empty result (`tableWithFilteringAndSortingStore.ts:274-276`, `this.getData({ page: 1 })` when the page came back empty); this module's collection sits on the shared query layer, which instead issues a corrective follow-up request at a computed safe offset (`query/useQuery.ts`, the `safeOffset` arithmetic against the server's `total`) — wait for that second request (`observeLegacyInvoiceRequests` / `waitForRequestCount`) rather than asserting after the first. Proven in `legacy-invoices.divergences.int.test.ts`.

- **`number`'s `like` operator is CONTAINS only (ruling OD5 — accepted, not a bug).** No anchored prefix/suffix match is declared for this column, because the shared query layer's wire translation wraps every `like` value on both sides regardless of column (`query/query.utils.ts`'s `toWireFilterValue`) — off limits to override here. Proven in `legacy-invoices.filter-operators.int.test.ts` and `legacy-invoices.schemas.test.ts`.

- **The exact-date filters (`create_datetime.eq`/`.gt`/`.lt`) send a bare date on the wire, not a datetime (ruling F2-R — accepted, not a bug).** The oracle's own filter-value formatter stamps every non-relative DATE-type value with `YYYY-MM-DD HH:mm:ss` (`vue-app/src/helpers/table.ts:169-176`, `vue-app/src/data/date.ts:2`); this module's exact-date leaves declare `format: "date"` (`legacy-invoices.schemas.ts:86`, `:87`, `:89`), so a DateRenderer pick reaches the wire as a bare `YYYY-MM-DD` — the API accepts both shapes, confirmed on staging. `gte`/`lte` keep `format: "date-time"` (`:88`, `:90`) and are unaffected. Proven in `legacy-invoices.filter-operators.int.test.ts:104`, `:122`.

- **`hasLegacyInvoices` — CLOSED by ruling E3-R.** The `/self` read now requests the `legacy_invoices` relation (`session-store.services.ts:49-50`) the legacy application uses to compute the equivalent flag, so `has_legacy_invoices` computes for every client. One residue remains: the one test proving the `true` branch still runs over a derived capture, not a real recording of a client who owns an imported invoice — no recorded client in the committed credentials has that login. Treat the `true` branch as proven in shape only, until a real recording replaces it.

- **`isProforma`'s `true` branch is proven only in shape (ruling B8).** `isProforma` maps from `content.proforma` (optional, defaulting to `false`), but no captured recording carries that key at all — every raw recording captured to date has it absent. The one fixture that proves the `true` branch is a real recording with that single field hand-edited to `true`, not an unmodified document; its own provenance discloses the edit. Treat the `true` branch as proven in shape, not as observed on a raw document.

- **The multi-page proof replays one static list body for every page (accepted limit, ruling B3).** The test that proves the page window and the server's total (`legacy-invoices.collection.int.test.ts`) serves the *same* recorded list body regardless of the requested offset. That proves the emitted request window (`offset`/`limit`) and the server's own `total` — it does not prove that page two's *content* differs from page one's. The recorded client owns exactly one legacy invoice, so no fixture with a distinct second page is available to capture; this is accepted, not deferred.

- **`downloadPdf()` throws a typed error on a 404.** `LegacyInvoiceDocumentNotReadyError` (`instanceof`-checkable) signals "still being prepared"; any other failure throws the ordinary `DetailedError`. Do not distinguish the two by message string.

- **The manager ships no `reset()`.** Only the collection (`useLegacyInvoices`) exposes `reset` — `useLegacyInvoice` does not (matches the `invoices` exemplar).

### Lifecycle

```typescript
onUnmounted(() => {
  useLegacyInvoices().as("self").useActions().destroy();
});
```

Await readiness before reading `useMeta()`/`useContext()` off a fresh scope:

```typescript
const legacyInvoices = useLegacyInvoices().as("self");
await legacyInvoices.useActions().isReady();
const { hasLegacyInvoices } = legacyInvoices.useMeta();
```
