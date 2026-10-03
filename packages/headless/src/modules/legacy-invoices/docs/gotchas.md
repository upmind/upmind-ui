# Legacy Invoices Gotchas

Edge cases, accepted divergences from the legacy application, and things to
watch out for.

> **🧪 For Testers:** focus on the 🧪 items.

---

## A filter or sort write always returns the list to the first page 🧪

Calling `filterBy` or `sortBy` — or `setCriteria` with a write that does not
itself carry a `pagination` branch — zeroes `pagination.offset` back to `0`,
even if the caller was viewing a later page. A `setCriteria` write that does
carry a `pagination` branch is honoured exactly as given (see the next
gotcha's over-shot-page example).
This is a **known, accepted divergence** from the legacy application, which
keeps the reader's page across a narrowing or ordering write (ruling OD7).
The behaviour comes from the shared query layer this module is built on, and
this module does not — and will not — work around it internally.

**Receipt.** Oracle: the legacy application's own filtering/sorting mixin
recomputes its request from `this.config.page` rather than zeroing it —
`tableWithFilteringAndSortingStore.ts:186-199` builds the merged config the
request reads, and `:242` turns `this.config.page` into the emitted `offset`.
Headless: the shared query layer zeroes the cursor on a criteria write that
does not itself carry a `pagination` branch (`query/useQueryCriteria.ts`,
`pagination.offset: 0`) — off limits to change here (ruling OD5, the query
core is off limits). Proof:
`legacy-invoices.divergences.int.test.ts`.

```typescript
import { ScopeActorTypes, useLegacyInvoices } from "@upmind-automation/headless";

const archive = useLegacyInvoices().as(ScopeActorTypes.SELF);
await archive.useActions().isReady();
archive.useActions().nextPage(); // now on page 2

archive.useActions().setCriteria({ filters: { number: { eq: "C-INV-00014" } } });
// ❌ Assuming the read stays on page 2
// ✅ The next request carries offset=0 — plan the UI to reset any "page N" display
```

**Test scenario:** move to page 2, apply a filter, assert the emitted request carries `offset=0`.

---

## An over-shot page recovers onto the LAST page, not the first 🧪

Asking for a page beyond the archive's end (`setCriteria({ pagination: { offset: 100 } })` against a smaller archive) triggers the query layer's own corrective follow-up request. That follow-up lands on the **last valid page**, never page one — the opposite of the legacy application, which recovers to page one. This is a **second, accepted divergence** — signed off by op:dom@upmind.com, 2026-09-24 — and it is a second request, not a rejected one: wait for both requests to land before asserting.

**Receipt.** Oracle: the legacy application's own store recovers to page one
on an empty result — `tableWithFilteringAndSortingStore.ts:274-276`,
`this.getData({ page: 1 })` fires when the page just fetched came back
empty. Headless: the shared query layer instead computes a safe offset
against the server's own `total` and re-requests it (`query/useQuery.ts`,
the `safeOffset` arithmetic) — off limits to change here. Proof:
`legacy-invoices.divergences.int.test.ts`.

```typescript
import type { UseLegacyInvoices } from "@upmind-automation/headless";

declare const archive: ReturnType<UseLegacyInvoices["as"]>;

archive.useActions().setCriteria({ pagination: { limit: 10, offset: 100 } });
// Two requests go out: the over-shot one, then the corrective one onto the
// last valid page.
```

**Test scenario:** with a multi-page archive, request an offset past the end; assert the final emitted offset is the last valid page's offset, never `0`.

---

## The `number` column's `like` filter is CONTAINS only 🧪

`filter[number|like]` matches anywhere in the string. There is no anchored
"starts with" or "ends with" form on this column — this is an **accepted
divergence** (ruling OD5): the shared query layer's wire translation always
wraps every `like` value on both sides regardless of column
(`query/query.utils.ts`'s `toWireFilterValue`), and this module does not —
and will not — override that (the query core is off limits).

**Test scenario:** filter by a substring of a known invoice number; assert
the record still matches. Proof: `legacy-invoices.filter-operators.int.test.ts`
and `legacy-invoices.schemas.test.ts`.

---

## The exact-date filters (`create_datetime.eq`/`.gt`/`.lt`) send a bare date, not a datetime 🧪

Picking a date in `create_datetime.eq`, `.gt`, or `.lt` sends `YYYY-MM-DD` on
the wire — a bare date, not a datetime. This is an **accepted divergence**
(ruling F2-R) on the value's *shape* only: the API accepts both shapes,
confirmed on staging by op:dom@upmind.com, 2026-09-28. `gte`/`lte` are
unaffected — they still send the full ISO datetime; `before`/`after` stay
relative expressions, never a date-time format.

**Receipt.** Oracle: the legacy application's own filter-value formatter
stamps every non-relative DATE-type filter value with a datetime format —
`filterValueToApiValue` (`vue-app/src/helpers/table.ts:169-176`) — using
`BACKEND_DATETIME_FORMAT = "YYYY-MM-DD HH:mm:ss"`
(`vue-app/src/data/date.ts:2`). Headless: the exact-date leaves declare
`format: "date"` (`legacy-invoices.schemas.ts:86` `eq`, `:87` `gt`, `:89`
`lt`), so a DateRenderer pick — which writes `YYYY-MM-DD` — passes the
criteria gate and reaches the wire as a bare date; the range leaves
(`gte`/`lte`) keep `format: "date-time"` (`:88`, `:90`) and are unaffected.
Proof: `legacy-invoices.filter-operators.int.test.ts:104` (the bare date
reaches the wire), and `:122` (a hand-typed datetime value on `eq` is refused
by the criteria gate — no request goes out).

```typescript
import type { UseLegacyInvoices } from "@upmind-automation/headless";

declare const archive: ReturnType<UseLegacyInvoices["as"]>;

archive.useActions().setCriteria({
  filters: { create_datetime: { eq: "2026-01-15" } }
});
// ✅ Wire: filter[create_datetime|eq]=2026-01-15
// ❌ Not:  filter[create_datetime|eq]=2026-01-15 00:00:00
```

**Test scenario:** pick a date in the `eq`/`gt`/`lt` control; assert the
emitted filter value is the bare date, never a stamped datetime.

---

## The multi-page proof replays one static list body across every page 🧪

The test proving the page window and the server's own total (in
`legacy-invoices.collection.int.test.ts`) serves the *same* recorded list
body no matter what offset the request carries. That proves what the
composable emits (the `offset`/`limit` window on the wire) and what the
server reports as `total` — it does not prove that a second page's *content*
actually differs from the first.

**Accepted limit (ruling B3), not deferred work.** The recorded client owns
exactly one legacy invoice, so no fixture with a genuinely distinct second
page is available to capture. There is no follow-up to close here.

**Test scenario:** none — a distinct second page cannot be recorded against
this archive.

---

## `hasLegacyInvoices` — CLOSED by ruling E3-R

`useLegacyInvoices().as(ScopeActorTypes.SELF).useMeta().hasLegacyInvoices` is
read straight off the signed-in session's own record
(`activeUser.value?.has_legacy_invoices`). The identity read that record is
built from — `/self` — now requests the `legacy_invoices` relation
(`session-store.services.ts:49-50`) the legacy application uses to compute
the equivalent flag, so the API can compute `has_legacy_invoices` for every
client, not only the derived fixture case.

**One residue remains.** The one test that proves the `true` branch still
runs over a **derived** capture (`get-self-case-has-legacy-invoices.json`),
not a real recording of a client who owns an imported invoice — no recorded
client in the committed credentials has a login that owns one. Treat the
`true` branch as proven in shape only, not as observed on a real client,
until a real recording replaces the derived capture.

---

## `content` is a whole, loosely-typed passthrough

`data.value.content` on a single-read record is the preserved original
document, kept intact rather than reshaped — never flattened into named
members. Nothing at the type level (`Record<string, unknown>`) guards a
wrong path into it. Every derived flag in `useLegacyInvoice.meta.ts` reads one
specific path; a page building its own display projection off `content` must
verify each path against a real captured record, not against the type.

```typescript
import type { LegacyInvoice } from "@upmind-automation/headless";

declare const record: LegacyInvoice;

// ❌ Wrong — the compiler will not catch a typo here
const wrongTotal = record.content.total_amout_formatted;

// ✅ Correct — verify the path against a captured fixture first
const total = record.content.total_amount_formatted;
```

---

## `downloadPdf()` throws a typed error on a 404 🧪

A 404 from the document endpoint means "still being generated", not
"missing" — distinguish it by type, never by message text.

```typescript
import { LegacyInvoiceDocumentNotReadyError } from "@upmind-automation/headless";
import type { UseLegacyInvoice } from "@upmind-automation/headless";

declare const legacyInvoice: ReturnType<UseLegacyInvoice["withId"]>;

try {
  await legacyInvoice.useActions().downloadPdf();
} catch (e) {
  if (e instanceof LegacyInvoiceDocumentNotReadyError) {
    // show a retry-later state, not an error page
  } else {
    throw e;
  }
}
```

**Test scenario:** mock a 404 on `download_pdf`; assert the thrown error is `instanceof LegacyInvoiceDocumentNotReadyError`, never matched by message string.

---

## Common Mistakes

### Reaching for `.for(entity, id)`

Both scope matrices are all-`never`. `.for()` is a compile error on every
actor for both composables, **from application code** — there is no staff
path and no entity to act on behalf of. Only `.as(actor)` and, on the single
read, `.withId(id)` are reachable.

### Reading the manager's `reset`

The collection ships `reset()`; the manager (`useLegacyInvoice`) does not.
Reaching for `useLegacyInvoice().useActions().reset` is a type error, not a
runtime no-op.

### Reading `isProforma`'s true branch as observed on a raw document

`isProforma` is mapped defensively from `content.proforma` (optional,
defaults to `false`) — ruling B8: no oracle producer of this flag exists, so
it is mapped from the wire and defaults to `false`. Every raw recording
captured to date carries it absent; the one capture that proves the true
branch is a real recording with that single field hand-edited to `true` (a
derived capture, not an unmodified document, and its own provenance
discloses the edit). Treat the true branch as proven in shape only.

---

## Edge Cases

| Scenario | Expected behaviour | Notes |
| --- | --- | --- |
| Empty archive | `data` is `[]`, `total` is `0` | 200, not an error |
| Record id not found | The single read's query resolves to the platform's standard not-found failure | No soft-failure 200 path |
| `content.client_company` | Absent on every captured record | The company-name/tax-id/reg-number paths resolve to nothing, not to null |
| `content.client_address` | `null` on every captured record | A present key with a null value, not a missing key |
| PDF requested while still generating | 404, typed `LegacyInvoiceDocumentNotReadyError` | Retryable, not a missing-record error |

---

## Lifecycle Considerations

### Destroy the instance when done

```typescript
import { onUnmounted } from "vue";
import type { UseLegacyInvoices } from "@upmind-automation/headless";

declare const legacyInvoices: ReturnType<UseLegacyInvoices["as"]>;

onUnmounted(() => legacyInvoices.useActions().destroy());
```

### Wait for ready state

```typescript
import type { UseLegacyInvoices } from "@upmind-automation/headless";

declare const legacyInvoices: ReturnType<UseLegacyInvoices["as"]>;

await legacyInvoices.useActions().isReady(); // always settles
```
