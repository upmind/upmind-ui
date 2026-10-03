# Legacy Invoices Module

Scoped read of a client's archived, pre-migration invoices — a filterable,
sortable, paginated collection (`useLegacyInvoices`) and one record in full
(`useLegacyInvoice`) — plus a PDF download.

## What Is This? (ELI5)

Some clients moved onto this platform with invoices already on their books,
raised by whatever billing system they used before. This module lets a
client browse that carried-over archive, open one of those old invoices in
full, and download its PDF. Nothing in the archive can be paid, cancelled,
refunded, edited, or shared — it is a historical record, not a live bill.

- **List** = read a filtered, sorted, paginated page of the archive, with the server's total.
- **Read one** = fetch one archived record in full, including its preserved original document.
- **Derive** = paid / overdue / credited / staged / proforma, computed off the loaded record.
- **Download** = fetch the record's PDF and save it locally.
- **Refresh / invalidate / reset** = re-read after a wait, or drop the cache.

> **🧪 For Testers:** derived flags are valid only AFTER `isReady()` resolves — before load, the collection's `data` is `[]` and the single read's `data` is empty. See [gotchas](./gotchas.md).

> **👩‍💻 For Developers:** both composables are SCOPED (`.as(actor)`), following [ADR-001](../../../../../../docs/adr/001-scope-based-composables.md). Both declare an all-`never` scope matrix, so `.for(entity, id)` never compiles for either — this archive hangs off no parent entity, and there is no staff cell. `useLegacyInvoices()` is the collection; `useLegacyInvoice()` is the single read — one shared services factory, two composables.

## Quick Start

```ts
import {
  ScopeActorTypes,
  useLegacyInvoice,
  useLegacyInvoices
} from "@upmind-automation/headless";

// The signed-in client's own archive
const legacyInvoices = useLegacyInvoices().as(ScopeActorTypes.SELF);
await legacyInvoices.useActions().isReady();
const { data, total } = legacyInvoices.useContext();

// One archived record by id
const legacyInvoice = useLegacyInvoice().withId(data.value[0]?.id ?? "");
await legacyInvoice.useActions().isReady();
const { data: record } = legacyInvoice.useContext();
const { isPaid, isOverdue, isCredited, isStaged, isProforma } =
  legacyInvoice.useMeta();

// Download the record's PDF
await legacyInvoice.useActions().downloadPdf();
```

See [Usage](./usage.md) for the full API.

## Features

| Feature | Status | Notes |
| --- | --- | --- |
| Read a filtered/sorted/paginated archive | ✅ | `GET /import_invoice_data`, declared filters/sort/pagination only |
| Read one archived record | ✅ | `GET /import_invoice_data/{id}`, preserved document kept whole |
| Download the record's PDF | ✅ | `GET /import_invoice_data/{id}/download_pdf`, typed error on a not-ready 404 |
| Derived record conditions | ✅ | paid / overdue / credited / staged / proforma |
| Readiness / refresh / invalidate | ✅ | lifecycle helpers on both composables |
| Drop cached pages | ✅ | collection only (`reset`) — no equivalent on the manager |
| Reading another client's archive | ❌ | archive hangs off no parent entity — no context to retarget on |
| Staff acting for a client | ❌ | separate, unbuilt admin surface — out of scope for this module |
| Payment / cancel / refund / share / edit | ❌ | the archive is a read-only historical record |

## Key Concepts

### Two composables, one services factory

`useLegacyInvoices` (the collection) and `useLegacyInvoice` (the single read) share one services factory so both address the same client through the same identity seam. See [architecture](./architecture.md).

### Client-only, no retarget

Both scope matrices are all-`never`: `.for(entity, id)` is a compile error on every actor for both composables, from application code. There is no staff cell and no entity for a record to hang off.

### The preserved document is kept whole

`data.value.content` is the original bill exactly as the predecessor system produced it — never flattened into named members. A handful of specific paths are read for the derived conditions; everything else on it survives untouched but is not individually typed.

### Three accepted divergences from the source application

A filter/sort write always resets the page to the first one; an over-shot page recovers onto the **last** valid page rather than the first; and the `number` column's `like` filter matches anywhere in the string (CONTAINS only — no anchored "starts with"/"ends with" form). All three come from the shared query layer this module is built on, and none is worked around here. See [gotchas](./gotchas.md).

## Documentation

| Doc | Audience | Content |
| --- | --- | --- |
| **This README** | Everyone | Overview, concepts, quick start |
| [Usage](./usage.md) | All devs | API reference, examples |
| [Architecture](./architecture.md) | Contributors | Data flow, sub-units, dependencies |
| [Gotchas](./gotchas.md) | All | Edge cases, known issues |
| [Changelog](./CHANGELOG.md) | All | Version history |
| [Foundation](./foundation.md) | Rebuild / external | Framework-neutral spec |
