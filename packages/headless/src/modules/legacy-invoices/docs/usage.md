# Legacy Invoices Usage & API

`useLegacyInvoices` (the collection) and `useLegacyInvoice` (one record) are
both SCOPED composables (`.as(actor)`), sharing one services factory. This
module ships the **client × self cell only**: both composables declare an
all-`never` scope matrix, so `.for(entity, id)` is a **compile-time error** on
every actor for both of them. There is no staff path and no retarget context —
an imported invoice hangs off no parent entity. The single read is marked with
`.withId(id)`, never a context.

## Reading the archive — the collection

```ts
import { ScopeActorTypes, useLegacyInvoices } from "@upmind-automation/headless";

const legacyInvoices = useLegacyInvoices().as(ScopeActorTypes.SELF);

const { data, error, findOne, getOne, pagination, query, schemas, total } =
  legacyInvoices.useContext();
const { hasError, hasLegacyInvoices, isAvailable, isEmpty, isFiltered, isLoading } =
  legacyInvoices.useMeta();
const {
  isReady,
  refresh,
  invalidate,
  reset,
  destroy,
  setCriteria,
  filterBy,
  sortBy,
  nextPage,
  prevPage
} = legacyInvoices.useActions();
```

### Readiness (read this first)

`data` defaults to `[]` until the first fetch settles. Await `isReady()`
before branching on it:

```ts
import { ScopeActorTypes, useLegacyInvoices } from "@upmind-automation/headless";

const legacyInvoices = useLegacyInvoices().as(ScopeActorTypes.SELF);
await legacyInvoices.useActions().isReady(); // always settles
const rows = legacyInvoices.useContext().data.value;
```

### Filtering

```ts
import type { UseLegacyInvoices } from "@upmind-automation/headless";

declare const legacyInvoices: ReturnType<UseLegacyInvoices["as"]>;

legacyInvoices.useActions().filterBy({
  number: { like: "INV" },
  total_amount: { gte: 100 }
});
```

Declared columns and operators only — the schema governs what is spellable:

| Column | Operators |
| --- | --- |
| `number` | `eq`, `neq`, `like` (**contains only** — no anchored prefix/suffix) |
| `total_amount` | `eq`, `neq`, `gt`, `gte`, `lt`, `lte` |
| `create_datetime` | `eq`, `gt`, `gte`, `lt`, `lte`, `before`, `after` |

### Sorting

```ts
import { SortDirection } from "@upmind-automation/headless";
import type { UseLegacyInvoices } from "@upmind-automation/headless";

declare const legacyInvoices: ReturnType<UseLegacyInvoices["as"]>;

legacyInvoices.useActions().sortBy([
  { field: "create_datetime", dir: SortDirection.DESC }
]);
```

Boots sorted by `create_datetime`, newest first. `create_datetime` and
`total_amount` are the only sortable fields.

### Paginating

```ts
import type { UseLegacyInvoices } from "@upmind-automation/headless";

declare const legacyInvoices: ReturnType<UseLegacyInvoices["as"]>;

legacyInvoices.useActions().nextPage();
legacyInvoices.useActions().prevPage();
const { page, total } = legacyInvoices.useContext().pagination.value;
```

A filter or sort write always resets `pagination.offset` to `0` — see the
module's gotchas. An over-shot `setCriteria({ pagination: { offset: 100 } })`
recovers onto the **last** valid page, not the first.

### Dropping cached pages

```ts
import type { UseLegacyInvoices } from "@upmind-automation/headless";

declare const legacyInvoices: ReturnType<UseLegacyInvoices["as"]>;

legacyInvoices.useActions().reset(); // collection only — no equivalent on the manager
```

## Reading one record — the manager

```ts
import { useLegacyInvoice } from "@upmind-automation/headless";

declare const recordId: string;

const legacyInvoice = useLegacyInvoice().withId(recordId);

const { data, error } = legacyInvoice.useContext();
const {
  hasError,
  isAvailable,
  isComplete,
  isCredited,
  isDownloading,
  isEmpty,
  isLoading,
  isOverdue,
  isPaid,
  isProforma,
  isStaged
} = legacyInvoice.useMeta();
const { isReady, refresh, invalidate, destroy, downloadPdf } =
  legacyInvoice.useActions();

await legacyInvoice.useActions().isReady();
const record = legacyInvoice.useContext().data.value;
```

`data.value.content` is the preserved original document, kept **whole** — no
flattened projection. Read a specific field off it directly (`content.status`,
`content.products`, …); a page composing a display projection owns that
shaping itself.

### The five derived conditions

```ts
import type { UseLegacyInvoice } from "@upmind-automation/headless";

declare const legacyInvoice: ReturnType<UseLegacyInvoice["withId"]>;

const { isPaid, isOverdue, isCredited, isStaged, isProforma } =
  legacyInvoice.useMeta();
```

| Flag | Reads |
| --- | --- |
| `isPaid` | `content.status.code` against the shared "paid" status |
| `isOverdue` | `content.status.code` against the shared "overdue" status |
| `isCredited` | truthiness of `content.partial_amount_credited_converted` |
| `isStaged` | the record's own top-level `staged_import`, never a path on `content` |
| `isProforma` | `content.proforma`, optional, defaults to `false` |

### Downloading the PDF

```ts
import type { UseLegacyInvoice } from "@upmind-automation/headless";

declare const legacyInvoice: ReturnType<UseLegacyInvoice["withId"]>;

await legacyInvoice.useActions().downloadPdf(); // saves `${record.number}.pdf` locally
```

```ts
import { LegacyInvoiceDocumentNotReadyError } from "@upmind-automation/headless";
import type { UseLegacyInvoice } from "@upmind-automation/headless";

declare const legacyInvoice: ReturnType<UseLegacyInvoice["withId"]>;

try {
  await legacyInvoice.useActions().downloadPdf();
} catch (e) {
  if (e instanceof LegacyInvoiceDocumentNotReadyError) {
    // "This document is still being prepared." — retry later, don't treat as missing
  } else {
    throw e;
  }
}
```

## Vue component integration

```vue
<template>
  <div v-if="isLoading">Loading…</div>
  <div v-else-if="hasError">{{ error?.message }}</div>
  <div v-else>
    <p>{{ record?.number }} — {{ record?.total_amount_formatted }}</p>
    <button :disabled="isDownloading" @click="downloadPdf">Download PDF</button>
  </div>
</template>

<script setup lang="ts">
import { useLegacyInvoice } from "@upmind-automation/headless";

const props = defineProps<{ id: string }>();
const legacyInvoice = useLegacyInvoice().withId(props.id);

const { data: record, error } = legacyInvoice.useContext();
const { isLoading, hasError, isDownloading } = legacyInvoice.useMeta();
const { downloadPdf } = legacyInvoice.useActions();

await legacyInvoice.useActions().isReady();
</script>
```

## Schema-driven filter bar

```ts
import type { UseLegacyInvoices } from "@upmind-automation/headless";

declare const legacyInvoices: ReturnType<UseLegacyInvoices["as"]>;

const { schemas } = legacyInvoices.useContext();
// schemas.query.schema      — JSON schema for the criteria model
// schemas.query.uischema    — filter-bar layout
// schemas.query.sortUischema — sort control layout
```
