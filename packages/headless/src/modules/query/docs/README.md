# query — the criteria seam

> A collection's whole request state — what it is filtered by, how it is sorted, and which page it is on — as one schema-governed model, so every layer that reads it reads the same thing and the one function that writes it can never be wired wrong.

## What Is This?

Every list-backed composable in this codebase already builds on `useQuery`'s `list()` / `query()` / `listInfinite()`. Historically, a module that wanted filtering or sorting had to build its own copy of that state beside the query — its own ref, its own derived model, its own translation into wire parameters — because the query itself only offered write-only setters (`sort()`, `filter()`) with no way to read back what had been set.

**`useQueryCriteria`** closes that gap. A module hands its **declared query schema** to `list()` (or `query()` / `listInfinite()`) as `criteria`, and the query constructs the whole pipeline itself — intent → parse → validate → translate — and publishes it back on the handle. There is no second object to keep in sync, because there is no second object.

```ts
import { useQuery } from "@upmind-automation/headless";

const { list } = useQuery();

const query = list({
  url: "/some/collection",
  queryKey: ["some-collection"],
  criteria: { schema: mySchema } // ← the one new input
});

query.data; // as always
query.criteria; // ComputedRef<Model> — the semantic request state
query.schema; // the declared schema — what is filterable / sortable at all
query.isFiltered; // derived from criteria, no string parsing
query.criteriaError; // ajv's verdict on the last REJECTED write — never swallowed
query.setCriteria(next); // the ONE write verb
```

> **👩‍💻 For Developers:** `criteria` and the raw `filters` / `sort` / `pagination` params are **mutually exclusive by type** — passing both is a compile error, not a runtime surprise. Every existing raw caller is untouched; nothing about this is a breaking change to `useQuery` itself.

## Quick Start

```ts
import { useQuery } from "@upmind-automation/headless";

const { list } = useQuery();

const schema = {
  type: "object",
  properties: {
    filters: {
      type: "object",
      properties: {
        title: {
          type: "object",
          properties: { like: { type: ["string", "null"] } }
        }
      }
    },
    sort: { type: "array", default: [{ field: "created_at", dir: "desc" }] },
    pagination: {
      type: "object",
      properties: { limit: { type: "integer", default: 10 } }
    }
  }
};

const query = list({
  url: "/items",
  queryKey: ["items"],
  criteria: { schema }
});

// Read the live state
console.log(query.criteria.value); // { filters: {}, sort: [...], pagination: { limit: 10 } }

// Write an intent — MERGED onto what is already there
query.setCriteria({ filters: { title: { like: "widget" } } });
// → re-queries the server; `sort` and `pagination` are untouched
```

## Key Concepts

### One input, one output — no construction ceremony

A module never mints a `useQueryCriteria` instance itself and hands it to `list()` — it declares a schema and passes it, and `list()` builds the pipeline. There is no "construct A, wire it into B" step, and so no way to wire it wrong.

> **👩‍💻 For Developers:** `useQueryCriteria` is reachable directly from `@upmind-automation/headless` for the rare case of exercising the pipeline with **no HTTP at all** — every step (parse, validate, translate) runs against the schema alone. In production code, reach it through `list({ criteria })`, not by constructing it yourself.

### `set` merges, it never replaces

`setCriteria({ filters })` leaves `sort` and `pagination` exactly as they were. The merge is at the **branch** level — writing a new `filters` branch replaces that whole branch (which is what "apply this filter set" means), but never touches the branches you did not name.

> **🧪 For Testers:** Setting a filter after a sort has already been applied never clears the sort. Setting a filter after a page has already been turned resets you to page 1 — a write that changes the result set without naming its own `pagination` returns the cursor to the first page, because page 4 of the old filter set is not page 4 of the new one. A write that **does** carry `pagination` (paging itself, a page-size change, a url rehydration) is honoured exactly as given.

### A rejected write changes nothing — and says why

Every candidate write is validated **before** it is committed. An invalid one — an unknown value, a value of the wrong type, an out-of-range page size — is discarded whole: the live model keeps its last valid state, **no new request is fired**, and the rejection surfaces on `criteriaError` alone.

> **🧪 For Testers:** Setting an out-of-range page size (e.g. a negative `limit`) leaves the current page exactly where it was, fires zero requests, and `criteriaError` carries ajv's verdict (a `422`-shaped error naming the failing keyword and the path inside the model that failed). There is no partial application — a write is committed whole or not at all, because half a request state is a list that lies about what it is showing.

### The model and the wire never disagree

`criteria` (what a consumer reads and renders) and `props` (what the query actually requests) are derived from the **same** committed model — there is no path where the rendered state and the outbound request can drift apart, including on a rejected write: because the rejected candidate is never committed, the wire is never asked to request something the model does not also show.

### `isFiltered` is one boolean; per-column is a lookup, not a second flag

There is no per-column "is this one filtered" member — the published model already carries the answer (a filter column's value is either present or it is not), so a consumer checks a specific column by reading `criteria.value.filters.<column>` directly. `isFiltered` itself answers only "is anything active at all".

### `isSorted` does not exist, deliberately

A query schema in this family always declares a `sort` default, so "is the collection sorted" is unconditionally `true` and would be a helper that never returns a useful answer. If a module ever needs "sorted **other than** the declared default", that is a different, nameable question — built when a real consumer needs it, with that definition.

## Where it fits

```text
declare a schema  →  list({ criteria: { schema } })  →  query.criteria / .schema / .isFiltered / .criteriaError / .setCriteria()
                                                            ↑
                                              every layer above reads THIS — never a shadow copy
```

`list()`, `query()` and `listInfinite()` all accept `criteria` — pagination is the one branch `query()` has no concept of, so it is narrowed out there, but filters and sort are available on all three. Whichever entry point a module already uses, adopting the criteria seam is the same one change: stop threading `filters`/`sort`/`pagination` by hand, declare a schema, and read everything else off the handle.

## Types

```ts
import {
  useQueryCriteria,
  translateQuery,
  type QueryCriteria,
  type QueryCriteriaOptions,
  type QueryCriteriaHandle,
  type CriteriaInput,
  type RawCriteria,
  type SchemaCriteria,
  type WithCriteria
} from "@upmind-automation/headless";
```

`translateQuery(schema, model)` is the one function that turns a model into the wire's `filter[column|operator]=` / `order=` / `limit=`&`offset=` parameters. It is exported for diagnostics — a consumer that wants to show "what would this model send" without firing a request — not as a second way to build request params; `list()` is its only production consumer.

## See it driven live

The `client-email` module's collection is the first adopter — its full request state, filtered and sorted through this seam, is rendered end to end in the `labs-nuxt` playground. See [../../client-email/docs/README.md](../../client-email/docs/README.md#playground) for the exact command and url.
