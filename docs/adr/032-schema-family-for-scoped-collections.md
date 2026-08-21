# ADR 032: The Schema Family for Scoped Collection Composables — Query, Actions, Row

**Date:** 2026-08-06
**Status:** Accepted 2026-08-06. **Decision only — nothing recorded here is built.** Ratified by operator sign-off in the walkthrough of the design-council record below; that walkthrough supersedes the council wherever the two conflict, and the supersessions are recorded in *Alternatives considered*.
**Amended 2026-08-06** (same day, operator walkthrough of the legacy filter inventory): decision **13** collapses the separate filter and sort schemas into one schema over the request state, and *Gap resolutions from the legacy filter inventory* adds nine rulings. The amendment certifies no capability either — the status above is unchanged.
**Authors:** Dominic da Costa

**Related:**

- Design-council record: `~/.claude/councils/2026-08-06-schema-family/log.md` (7 seats, 3 rounds, no BLOCK standing; executed findings with source receipts)
- Operator brief and binding rulings: `docs/sdd/FE-2977 ✅/evidence/brief-schema-family.md`, `docs/sdd/FE-2977 ✅/review-notes.md`
- Linear: [FE-2977](https://linear.app/upmind-automation/issue/FE-2977), which absorbed [FE-1335](https://linear.app/upmind-automation/issue/FE-1335) (filters) and FE-2979 (list economics)
- [ADR 027: Flow Factory](027-flow-factory-playground-generation.md) — decision 7 declares this family exists; this ADR gives it its shape. Two ADR-027 clauses are stale; see *Amendments owed to ADR-027*.
- [ADR 001: Scope-Based Composable Architecture](001-scope-based-composables.md) — the composable shape the family hangs off.
- [ADR 016: Schema-Based Validation for Product Config](016-schema-based-validation.md) — the in-tree precedent for "the schema is the gate".

---

## Context

A scoped collection composable must **declare** what can be filtered, sorted and acted on, so that a generic renderer draws its UI from that declaration and adding a filter is a declaration edit rather than UI work. ADR-027 decision 7 named the family — action-input · filter · sort · form — and left its shape unspecified. That gap is why a first design increment was binned for inventing a bespoke descriptor: the shape was never ruled on, so each attempt re-derived it.

### What the tree does today

Filter parameters are hand-written literal text at each call site. The live example is the product catalogue's permanent exclusion of domain names:

```ts
// packages/headless/src/modules/product-catalogue/product-catalogue.services.ts:34-35
"filter[provision_blueprint.category.code|neq]":
  ProvisionCategoryCodes.DOMAIN_NAMES,
```

That literal sits inside the `useUrl(...)` call the service already builds (`:32-45`), and again at `:69` for the infinite variant. There is no generic translator anywhere in the tree.

The list renderer derives its columns by key-sniffing the first row and marks every sniffed key filterable:

```ts
// playgrounds/labs-nuxt/app/components/factory/surfaces/ListSurface.vue:211-217
function deriveColumns(data: ListRow[]): ColumnDef<ListRow>[] {
  const columnKeys = uniq(flatMap(data, row => keys(row)));
  return map(columnKeys, key => ({
    id: key,
    header: startCase(key),
    accessorFn: (row: ListRow) => row[key],
    enableColumnFilter: true
```

And the client-email collection's free-text filter writes a key the API does not honour, into a mutated `ref`:

```ts
// packages/headless/src/modules/client-email/useClientEmails.actions.ts:127-132
const filters = ref<RequestFilters & { query?: string }>({});
function filterQuery(value?: string): void {
  set(filters.value, "query", value);
  query.filter(filters.value);
```

### The server contract

Probed against the QA API under the sanctioned read-only capture ruling, and cross-checked against the legacy operator enum (`vue-app/src/data/table.ts:4-17`), which is member-for-member the accepted set:

- Wire form is `filter[column|operator]=value`. Accepted operators: `eq · neq · like · nlike · gt · gte · lt · lte · before · after · all`, plus bare (equality). Anything else is HTTP **422**.
- An **unknown filter column is HTTP 500**, not a degrade. A stale or hand-edited filter key must never reach the wire.
- The wire key is the **raw column name**; mapper-renamed keys 500.
- `|like` requires explicit `%` wildcards. A comma-joined value means IN; `|all` is conjunctive, not IN.
- An **empty filter value means "match empty"** and returns zero rows. Inactive filters must be omitted entirely.
- Sort is server-side: `order=field`, `order=-field`, comma-separated for multi-key.

### The installed stack

The repo compiles schemas through one ajv instance — `createAjv({ useDefaults: true, verbose: false })` (`packages/ui/src/utils/useValidation.ts:11`) over `ajv@^8.17.1` (`packages/ui/package.json:50`, `packages/headless/package.json:50`). That instance carries **draft-07 meta only** with `strict:false`, which means a keyword from a later draft compiles and silently always passes. Any construct in this family therefore has to be settled by compiling it, not by citing the specification.

The query layer already accepts multi-key sort — `sort?: [direction, property] | [direction, property][]` (`packages/headless/src/modules/query/query.types.ts:118-120`) — so nothing needs adding to accept an ordered sort model.

---

## Decision

**The family is three declarations — query, actions, row — expressed as plain JSON Schema draft-07 plus JSONForms uischema, published by the composable, translated to wire parameters in the module's own service. The core declares only the module's own shape; a consumer's registry declares how two scoped composables pair up.**

### 1. The filter shape is nested: column → operator → value

> **Decision 13 supersedes this section's framing.** There is no standalone filter schema: this nesting rule describes the **`filters` branch** of the one query schema. The rule itself is unchanged, and every consequence below holds branch-local.

`properties` keys are **wire column names**. Each column's own `properties` keys are the **operators that column allows**. `additionalProperties: false` at **both** levels.

```json
{
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "email": {
      "type": "object",
      "additionalProperties": false,
      "properties": { "like": { "type": "string", "minLength": 1 } }
    },
    "created_at": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "gte": { "type": "string", "format": "date" },
        "lte": { "type": "string", "format": "date" }
      }
    }
  }
}
```

Consequences that make this the shape rather than a shape:

- A disallowed operator is **unspellable**, not merely rejected — the inner gate is structural, and the validation error names the column that owns it.
- **Two predicates on one column** (a `created_at` from/to range) are expressible. A flat `col|op` key cannot hold them.
- A **dotted relation column** stays real nesting, which is what the live idiom already uses (`product-catalogue.services.ts:34`).
- Error paths remain mappable to a control, so a validation failure can be shown on the field that caused it.

The compile-time half of the operator gate needs one `as const` source plus `satisfies JsonSchema7`. Every schema factory in the tree today annotates `: JsonSchema7`, which erases the literal types, so this is a deliberate deviation from the established idiom and owes an adjacent `@decision` block.

### 2. schema / uischema / model stay three separate artefacts

Rules, presentation and values vary independently, which is the whole reason each one is data and every consumer is a generic renderer over data. This holds for the query schema and the row schema alike.

The **uischema may be partial**: one consumer draws three of the declared filters, another draws all of them, and a per-control override lets the same schema field render as a select in a filter bar and something else in a drawer. A filter carrying `const`/`default` applies whether or not any uischema draws it, because injection is the validator's job; a filter with no default that no uischema draws is genuinely unavailable. Both halves of that are honest and the distinction is load-bearing.

### 3. Actions are schema + uischema with **no model**

Action availability is a **validation result over the row**, not a user-edited instance. There is nothing for a model to hold, so the family is asymmetric by construction. Stating that is more honest than fabricating a third column to make the table look uniform: a synthesised action model would be a second source of truth for a fact the row already carries, and would drift the moment the row changed.

| Rules (schema) | Presentation (uischema) |
| --- | --- |
| existence · availability predicate against the row · named **disabling causes**, each with its own predicate and optional reason · grouping identity · destructive-ness | inline vs ellipsis · order · separators · icon · variant · label i18n key |

- The schema is a **record keyed by action id**, not an array — the id already joins the composable's action key, the renderer's prop, and the coverage gate's covered-action set. Order is presentation, so the uischema holds the ordered array.
- Named disabling **causes** rather than a single `{ disabled, disabledReason }` pair, because the flat pair loses *which* cause fired.
- Pending is a declared meta-flag name read off the composable's meta layer, never renderer state.
- **An actor is not a schema condition.** An actor does not appear in the row model, so actor-varying availability belongs to the scope matrix (ADR-001), not to a predicate. Two mechanisms for one fact loses the variance law.

### 4. Translation happens in each module's **service**, at query instantiation. `modules/query/**` is not touched

The service already builds the URL and already owns its filter and sort parameters. The hand-written literal at `product-catalogue.services.ts:34-35` becomes translator output — **one** `translateQuery(schema, model)` per decision 13, returning the `QueryProps` the query layer already accepts (`query.types.ts:113-129`).

The translator emits **one key per declared filter, always** — active as a non-empty string, inactive as `""`. Every branch of the existing serialiser then does the right thing untouched:

```ts
// packages/headless/src/modules/query/useQuery.ts:134-148 (existing)
if (!isEmpty(filters) && isObject(filters)) {
  forEach(filters, (value: any, key: string) => {
    if (!isEmpty(value)) {
      ...
      url.searchParams.set(key, value);
    } else {
      url.searchParams.delete(key);
```

The `isEmpty("") → searchParams.delete` branch at `:147-148` **is the clearing mechanism**, and it is load-bearing: the URL is minted once per list load and mutated in place, so a filter merely *absent* from the model leaves its stale parameter on the wire indefinitely — and a stale filter key is an HTTP 500, not a degrade. Two further constraints follow from that same serialiser: every emitted value must be a **non-empty string** (the lodash emptiness test is true for `0`, `false` and `""` alike, which is why two shipped lists elsewhere in the tree are silently unfiltered in production today), and the filter object must be a **fresh object per call** so the equality guard upstream is a genuine value comparison.

### 5. A forced filter is a `const` with no control in the uischema

The precedent is the same line as the seam. Nobody can switch "exclude domain names" off in the product catalogue — it is applied, invisible, and unalterable — which is exactly `const` in the schema and no element in the uischema. It needs no new mechanism and no hide rule: a hide-ruled element still emits a wrapper, leaving an empty grid cell, so hiding is only for a control that will be shown again.

Two construction rules protect the forced filter from being silently lost:

- **The filter model is derived, never a mutated `ref`.** The live counter-example is `useClientEmails.actions.ts:127`, where the filter bag is a mutated ref shared by reference with the query layer.
- **The composable's intent-apply never writes `model = intent` verbatim** — it re-asserts the schema's `const` fields. The table library's non-multi sort click path wholesale-replaces the sort array, which destroys a `const`-forced leading entry. Enforcement is **composable-side, never in the click handler**: a merge in the handler is business logic in the renderer and breaks ADR-027 decision 1.

The whole-family invariant that both rules serve: **every declared `const` survives into the outgoing request, and nothing reaches the wire that is not a visible control or a declared `const`.**

### 6. The core is agnostic of UI, routes, hrefs and paths

**No `links`, no `href`, no `targetComposable` anywhere in `packages/headless`.** A row-to-editor relation is consumer knowledge, not module knowledge: other apps and other customers will pair things their own way, over their own routing and their own surfaces. Core publishes only the module's own shape — what its rows contain, what is filterable, what is sortable, what actions exist and when.

### 7. The **registry** is the scenario contract

A consumer's registry is where a scenario's `useList` / `useMutate` pairing, its scope, and anything else scenario-specific is declared — **once, by the consumer, in its own file**. It is the only artefact that holds both scenario keys, so it is the only place the correlation can live. The generated playground declares its own (`playgrounds/labs-nuxt/app/composables/factory/registry.ts`); the portal and any customer application write their own.

This extends the already-locked position that the package holds no scenario keys and receives the registry at startup, giving that registry a job beyond key resolution. Live function references are legal only inside the consumer, which is what forces the pairing to live there: a function does not survive `JSON.stringify`, so a pairing declared in the core would cross the renderer port with its target `undefined`.

### 8. The row schema is a consolidation, not a new layer

With the relation removed from the core (decision 6), the row schema keeps three concrete jobs, each replacing something worse:

1. **Declared columns**, retiring the key-sniffer at `ListSurface.vue:211-217` — which today marks keys the API 500s on, and object-valued keys, as filterable.
2. **The instance an action's availability predicate validates against** (decision 3).
3. **The mapper contract**, pinned transitively because the proof runs recorded API JSON through the module's mapper and then through this schema.

Two rules make (3) real rather than decorative:

- **Every mapped field the row schema declares must also be `required`.** `additionalProperties: false` guards only the extra-field direction, so it *feels* like a complete gate while a mapper that stops emitting a field yields a present-but-`undefined` key the validator treats as absent. `required`, not `type`, is what fails on that mutation.
- **`column.id` is the wire column name; `accessorFn` is the mapped row path.** The wire and the mapped row speak different vocabularies — several client-email wire columns arrive under mapped meta-flag names, and one filterable wire column is absent from the mapped row entirely (design-council record §3). The column definition is the one artefact that legitimately holds both, and that is why declaring columns is not the same job as declaring filters.

### 9. The nested schema meets the table's flat filter model through a **deep uischema scope**

The renderer port freezes the table's filter model as a flat record, while the filter model is nested — so a column-header filter arrives as `{ email: "nathan" }` and must be lifted to `{ email: { like: "%nathan%" } }`. This needs no new port member: the column's uischema element carries a **scope naming the exact predicate** (`#/properties/email/properties/like`), so **the scope *is* the operator selection**. One schema can therefore be header-filterable on one operator and drawer-filterable on another.

### 10. Sort validates the frozen model; it does not propose a new one

> **Amended 2026-08-18 — narrowed below.** *Sort needs no uischema element of its own* no longer holds: a bespoke sort control's option labels need a uischema `i18n` channel. See the amendment appended after *Gap resolutions*.

The **`sort` branch** (decision 13; formerly a standalone sort schema) constrains the already-frozen `{ field, dir: "asc" | "desc" }[]` model: `enum` on `field`, `enum` on `dir`, `uniqueItems`, and draft-07 tuple `items` for a forced primary entry. **Sort needs no uischema element of its own** — its UI is the table's own headers, so the one query uischema may omit it entirely. Multi-key sort needs nothing added to the query layer (`query.types.ts:118-120`).

### 11. A machine governs the cell stack, and never imports the routing engine

The stack — list live underneath, editor pushed on top, resolve pops it and the list refetches — is a machine concern. It is built on the routing engine's actions/guards/services discipline and **never imports `useRoutingEngine`**, which is a router-bound module singleton (ADR-027 decision 11). This brings that machine's charter forward for this use rather than bolting a switch member onto the renderer-port world object: a stack has depth, an order and a resolution, and a single imperative member cannot express any of the three.

### 12. The construct set is settled by execution, not by citation

Compiled against the repo's own ajv instance (`useValidation.ts:11`) during the design council, which holds the executed evidence:

| Verdict | Constructs |
| --- | --- |
| **Proven live** | root `if`/`then`/`else` · draft-07 `dependencies` · `allOf` (root only) · `const` · `default` · `enum` · `oneOf` + `title` · `format` · `minLength` · `uniqueItems` · draft-07 tuple `items`/`additionalItems` |
| **Struck — compiles and silently always passes** | `dependentSchemas` · `dependentRequired` (draft 2019-09 keywords; `strict:false` swallows them, so any conditional-filter test built on them is a tautology) |
| **Struck — wrong draft / throws** | `prefixItems` (2020-12) · `$data` refs (throws at compile) |
| **Banned — breaks generation** | `allOf` beside `properties` (collapses uischema generation to a single root control) |
| **Banned — not a gate** | `patternProperties` (executed: it *admitted* an undeclared operator key). `additionalProperties: false` over explicit `properties` is the only gate |
| **Unsatisfiable** | `if`/`then` **introducing** a key — root `additionalProperties: false` does not see `then.properties`, so providing the key fails the additional-properties gate and omitting it fails `required`. `if`/`then` may only add `required` or tighten an already-declared property |
| **Trap** | `required` on a user-supplied filter — a partial uischema that omits it makes the model permanently invalid. Legal only on a filter that carries `const` plus a parent `default` |

A construct that only type-checks, or that is asserted only from documentation, is unproven. A construct that fails is struck and its working fallback named in the same breath.

### 13. One schema over the request state: `query · filters · sort · pagination`

Filters and sort are **not** two independent schemas. There is **one schema whose instance is the request state**, and it supersedes the separate filter and sort schemas wherever the two framings conflict.

**`QueryProps` is already this shape.** The query layer's own request-state type is `{ sort, filters, pagination }`:

```ts
// packages/headless/src/modules/query/query.types.ts:113-129
export type QueryProps = {
  sort?:
    | [direction: RequestSortDirection, property: string]
    | [direction: RequestSortDirection, property: string][];
  filters?: RequestFilters;
  pagination?: RequestPagination;
};
```

So this is not a new grouping. The declaration is a schema **over the shape the query layer already accepts**, plus `query` — which makes the translator a near-identity map rather than a transformation, and is why `query` finally has an honest home instead of being smuggled in as a fake filter (`useClientEmails.actions.ts:127-132`, where `query` is `set` into the filter bag).

| Property | Instance | Wire |
| --- | --- | --- |
| `query` | the free-text search term | `q=` (or the endpoint's own search parameter) |
| `filters` | the nested column → operator → value shape of decision 1 | `filter[col\|op]=` |
| `sort` | the frozen `{ field, dir }[]` of decision 10 | `order=` |
| `pagination` | `{ limit, offset }` | `limit=` / `offset=` |

One schema, **one model**, one uischema. A search box and two filter controls are therefore a **single JSONForms form** over one model rather than three forms over three models, and the persisted (URL) state is one object rather than three.

**The two translators collapse into one.** `translateFilters` / `translateSort` become `translateQuery(schema, model)`, returning `QueryProps` — which is what makes "near-identity" literal rather than rhetorical. Everything decision 4 established is kept: one key per **declared** filter (inactive as `""`, so `useQuery`'s `isEmpty → searchParams.delete` clears the stale parameter), every value a non-empty string, a **fresh object** every call, and the pipeline order prune → validate → translate. It is still called in the module's **service** at query instantiation, and `modules/query/**` is still not touched (decision 4 stands whole).

One narrowing of decision 4's seam follows from the return type, and it is load-bearing rather than cosmetic: the translated `filter[…]` bag rides **`QueryProps.filters`**, not the `useUrl(...)` parameter bag. `useUrl` `set`s every key it is given, empty string included (`packages/headless/src/utils/useUrl.ts:30-34`), and an empty filter value means *"match empty"* and returns zero rows — so an inactive-as-`""` key spread into `useUrl` would empty the list on first load, while the same key handed to `QueryProps.filters` reaches the `isEmpty → delete` branch on **every** fetch including the first (`useQuery.ts:372-374` seeds the internal ref from `options.filters`; `:399-406` passes it to `request` each time). `sort` and `pagination` must ride their own `QueryProps` members for the mirror-image reason: `useQuery` **unconditionally deletes** `order` and `offset` when its own members are empty (`useQuery.ts:117`, `:131`), so an `order=` written directly into `useUrl` is wiped at fetch time. The service's own non-`filter[]` sidecars stay in the `useUrl` bag where they already are (gap resolution S-D11).

**`query` is honest here specifically because it is not honoured on client-emails.** `query=` / `q=` / `search=` all return the unfiltered collection on `GET /clients/{id}/emails` (probed under A-D5; `docs/sdd/FE-2977 ✅/evidence/brief-schema-family.md:188`). So the canary's search box maps to `filters.email.like`, and `query` is declared **only** where the endpoint actually supports it. A `query` property on a schema whose endpoint ignores it would reproduce the exact live defect this story fixes — a search box that does nothing.

**`pagination` joining the schema is what gives `TableIntent.paginate` a sink**, which the council recorded it as lacking. Stated without overclaiming: what changes is that the *model* now has somewhere to hold `{ limit, offset }` and to seed the query from. `ListQuery` still exposes no page or page-size setter — only `fetchNextPage` / `fetchPreviousPage` (`query.types.ts:286-289`) — and `limit` is captured `const` at construction (`useQuery.ts:367-368`), so a later model change to `limit` cannot reach the wire without a new query instance.

**What stays out of the query schema.** The **row schema** (it describes a record, not a request) and the **actions schema** (rules only, no model — decision 3). The family is therefore: one query schema · one actions schema · one row schema · the module's existing form schema.

### Gap resolutions from the legacy filter inventory

Nine rulings from an operator walkthrough of the legacy listing layer (`vue-app/src/composables/listing/**`, `vue-app/src/components/app/global/tickets/ticketsProvider.ts`, `vue-app/src/components/app/global/orders/ordersFilters.ts`). Each closes a shape the inventory raised; they are decisions, not context.

- **S-D10 — remote options are uischema, and user-generated content is never validated for membership.** A filter whose values are user-generated (category ids, tags, template ids) declares only its *shape* in the schema — a typed string, its column, its allowed operators — while the option source is a uischema control. An unknown id is a legitimate **empty result, not a validation error**. The line: system-defined sets (statuses, fraud states, booleans) are `enum` in the schema; user-generated sets are a plain typed string plus a lookup in the uischema. Legacy already resolves those sources asynchronously and separately from the column list (`vue-app/src/composables/orders/useOrderFilters.ts:66-73`).
- **S-D11 — sidecar parameters belong to the service.** Non-`filter[]` parameters (`with`, `include_spam`, `with_hidden`, `with_staged_imports`) are the service's own concern, fixed per query, and never known to the query schema — the service already writes `with: [...]` beside the filters (`product-catalogue.services.ts:36-44`; legacy's equivalent is `useListing.ts:200-207`). The one legacy case where a sidecar depended on a filter *choice* — tickets' `include_spam`, declared as `requires` on the filter definition (`vue-app/src/composables/listing/types.ts:65-69`) and computed at `ticketsProvider.ts:612-624` — is a single screen's quirk, not a pattern to design for.
- **S-D12 — two values under one operator is an array leaf.** `{ name: { like: ["%A%", "%B%"] } }` validates and the translator comma-joins it; whether a column allows multiples is expressed by that leaf being an array type or not, exactly as legacy expressed it per definition (`allowMultiple`, `vue-app/src/composables/listing/types.ts:42-45`). Honest caveat: what the **server** does with comma-joined values differs per operator — a comma under equality is IN (probed; legacy maps `any → eq` and `none → neq` before joining, `vue-app/src/composables/listing/helpers.ts:259-272`), and the reading under `like` is OR-of-patterns but is **unprobed**. That is a server semantic to document per operator, and to probe before an array leaf is declared on one — not a schema concern.
- **S-D13 — a remote column family is a computed schema.** Custom fields mean the filterable columns are `custom_fields.<code>` (`vue-app/src/composables/listing/useCustomFields.ts:161-163`), unknowable until the server answers, and merged in at call time behind a `computed` (`useOrderFilters.ts:46-85`). So the schema factory is a **function** that merges them when called — which is the repo's existing idiom, since `useSchema()` / `useUischema()` are already functions. A custom ajv keyword stays in reserve for a case that genuinely needs runtime knowledge *inside* validation; the repo already registers keywords (`packages/headless/src/utils/useValidationKeywords.ts`, installed at `useValidation.ts:616`), so that is a known move rather than a new mechanism.
- **S-D14 — a control that spans columns is uischema.** Legacy's tickets "Show" dropdown writes three different `(column, operator)` predicates from one affordance — `users.id` equality, `lead_user.id` equality and `lead_user.id|neq` (`ticketsProvider.ts:435-478`). Every one of those columns and operators is declared in the schema and available; the uischema chooses to present them as one control, and a custom renderer writes to whichever leaf the selected option names. Pure two-axes separation — no new schema construct.
- **S-D15 — an enum member meaning two wire values is a legacy artefact; do not design for it.** Legacy's `invoice_unpaid&&invoice_adjusted` (`vue-app/src/components/app/global/orders/ordersFilters.ts:92-102`) is two values on the *same* column — plain IN — and it needed a second separator only because legacy's own codec could not round-trip a comma: `&&` is replaced by `,` on the way to the wire (`FRONTEND_FILTER_ARRAY_VALUES_SEPARATOR`, `vue-app/src/data/table.ts:69-70`; `parseFrontEndFilterGroup`, `vue-app/src/helpers/table.ts:56-67`). If ever needed, the enum member is simply the comma-joined string carrying a `title`.
- **S-D16 — forced-but-overridable is `default` without `const`.** `default` alone means pre-applied and the user may change it; `const` plus a materialising `default` means locked. Two keywords, two intents, no new mechanism. Legacy's overridable-forced behaviour was a **merge-order accident**, not an intent: scoping parameters (`where` + `constFilters`) are assigned into the parameter object first and the user's active filters are assigned second, over the top (`vue-app/src/composables/listing/useListing.ts:222-259`). Shipping true `const` where a tab means "locked" is therefore a deliberate, stateable behaviour change.
- **S-D17 — relative-date values need nothing new.** `-1_months` / `-24_hours` are strings on a string leaf, resolved server-side (legacy ships them as plain option values under an `AFTER_RELATIVE` operator, `ticketsProvider.ts:482-506`). Constrain them by `pattern` for the general grammar, an `enum` where a screen offers a fixed set, or a registered `format` if it is worth naming once and reusing. A column may legitimately accept either an ISO date or a relative token.
- **S-D18 — actor-conditional options are a schemas ARM.** Different enum *members* per actor — not different columns — resolve through the existing actor-arm factory: a `.schemas.{actor}.ts` overriding only what that scope changes, exactly as services and actions already do (`auth.services.ts:152-162`'s `scopedServices` switch). Legacy's receipt is the same "Show" dropdown, whose option list is `$userCan("list_tickets") ? […4] : […2]` (`ticketsProvider.ts:442-476`). Per variance-law clause 3 the arm exists **only** where a scope genuinely overrides something, and per clause 4 the module factory receives an already-resolved concrete actor (`scope.builder.ts:272-277` → `resolveSelfActor`, `scope.utils.ts:54`), so there is never an `if (actor === STAFF)` branch inside a schema file.

## Amendment — the sort branch gains a uischema of its own (2026-08-18)

Decision 10's sentence *"Sort needs no uischema element of its own — its UI is the table's own headers, so the one query uischema may omit it entirely"* is superseded: a bespoke sort control is offered in both views, its option labels need a translation channel, and the engine's own channel for that is a uischema `i18n` key, so each module's schema family now exposes `useSortUischema()` — one `Control` over `#/properties/sort` carrying `i18n`, published on the list context beside the query schema and its filter uischema (`schemas.query.sortUischema`); the `i18n` key doubles as the option-key prefix (`<i18n>.<field>`, the same prefix mechanism decision 13's filter controls use via `@jsonforms/core`'s `enumToEnumOptionMapper`) — everything else in decision 10 stands verbatim: the `sort` branch still validates the already-frozen `{ field, dir }[]` model with `enum` on `field` and `dir` and adds nothing to the query layer, the schema itself carries no `i18n` key and no title for a sort member (the bare `enum` stays deliberate and wire-pure), and decision 2 (schema / uischema / model as three separate artefacts) is what makes a second uischema over the one query schema lawful rather than a duplicate.

---

## Alternatives considered and rejected

### Separate filter and sort schemas

This ADR's own first framing, superseded by decision 13. Rejected because the grouping it avoided **already exists in the tree**: `QueryProps` is `{ sort, filters, pagination }` (`query.types.ts:113-129`), so two independent schemas declare two halves of one shape the query layer accepts whole — and neither of them has anywhere to put the free-text search term, which is why the live code smuggles `query` in as a fake filter (`useClientEmails.actions.ts:127-132`). The costs were concrete rather than aesthetic: two models to persist and rehydrate instead of one; a search box and two filter controls rendering as two or three JSONForms forms; two translators to keep in step; and `pagination` with no declared home at all, which is what left `TableIntent.paginate` sinkless. Nothing of the separate framing is lost — the nesting rule (decision 1) and the frozen sort model (decision 10) survive verbatim as the `filters` and `sort` branches.

### A second value separator for "one option, two wire values"

Legacy's `&&` (`vue-app/src/data/table.ts:69-70`), considered as a construct to carry forward and rejected as an artefact of legacy's own codec — it exists only because that codec could not round-trip a comma, and it is replaced by a comma before the value reaches the wire (`vue-app/src/helpers/table.ts:56-67`). The thing it expressed is two values on one column, which is plain IN and needs no second separator: the enum member is the comma-joined string with a `title` (S-D15).

### Flat `col|op` property keys

Rejected on two executed grounds. It **cannot hold two predicates on one column**, which a date range requires. And a dotted relation column breaks: `filter[recipient.email|like]` binds to `model.recipient["email|like"]` under path-based property access, and the live idiom already ships one such dotted column (`product-catalogue.services.ts:34`). The objection that the wire filter record is *already* flat dissolves — that flatness is the **translator's output**, which the nested shape produces anyway (decision 4).

### An array of filter objects (`{ field, operator, value }[]`)

Rejected as unrenderable and undiagnosable with the installed set. No array-of-objects renderer is installed; every item in an array shares one schema node, so a per-control override is inexpressible in a uischema; and validation errors land at index paths that cannot be mapped back to a control.

### JSON Hyper-Schema `links[]` on a row schema inside `packages/headless`

This was the design council's answer to the action-handoff question — a draft-07 `links[]` entry per row schema carrying `rel: "edit-form"`, an `href` template, `templatePointers`, a submission schema, and an invented `targetComposable` member, with each consumer mapping `rel` to its own surface. It is **superseded in full** by decisions 6 and 7.

The operator's reason: **core is agnostic of UI, routes, hrefs and paths.** A row-to-editor relation is scenario and consumer knowledge, and other applications and other customers will pair things their own way; putting an `href` template in a headless module fixes one consumer's URL space into every consumer's contract. The registry is the correct home because it is already the only artefact holding both scenario keys.

What survives of that analysis, and is why the alternative was serious rather than careless: a live `{ type: "Manager", scope, i18nKey, options: { manage: { useList, useMutate } } }` uischema element **already ships** at `packages/headless/src/modules/client-company/client-company.schemas.ts:135-142`, claimed by a registered renderer whose tester matches `uiTypeIs("Manager")` at rank 4 (`packages/client-vue/src/components/form/renderers/ManageRenderer.vue:41-43`) — and the exact client-email pairing sits **commented out** at `client-company.schemas.ts:196-202`. The pairing was declared once in this tree and switched off. Decision 7 relocates it rather than reviving it in the core.

Also considered and rejected within that alternative: **`Manager`-on-a-collection.** Its `scope` is a foreign key on a parent form model (`client-company.schemas.ts:136`, `scope: "#/properties/addressId"`); a bare collection has no parent property, so the scope would be vestigial. Adopting a shape and dropping its load-bearing member is the failure this whole exercise exists to avoid.

### A generic translator in `modules/query/**`

The council ruled for a new barrel-exported translator file inside the query module. Rejected in favour of decision 4: the service **already** builds the URL and **already** owns its filter and sort parameters, so the seam exists and needs no new host. This also removes the escalation the council raised — there is no protected-core write, because `modules/query/**` is not touched at all.

### The existing sortable-properties enums as the sort declaration

Two modules already declare sortable fields as enums with a `DEFAULT` member. Considered as the pattern to build on and superseded: the `DEFAULT` members disagree with each other, and one member name collides with the sort parameter itself. A schema supersedes them because it validates the model rather than merely listing names.

### `confirm?: boolean` on an action

Killed. A confirmation is the **same handoff with a third surface** — the legacy oracle registers modal, window-modal, slide-modal and confirm-modal through one door — so a boolean flag would be a second mechanism for a fact the handoff already carries.

### An imperative switch member on the renderer-port world object

Rejected in favour of decision 11. The stack is a machine concern; a member bolted onto the world object cannot express depth, order or resolution.

### Collapsing the handoff into the coverage gate's per-action input schemas

Killed and kept distinct. Those schemas are per-action *input* schemas populated test-time, used only to decide whether an action is input-taking. Declaring a no-input action's handoff there makes that action fail the gate as untagged-input-taking, and it buys nothing: the gate already reds an unproven action as uncovered, independent of tags.

### Inline row actions as a legacy restoration

Rejected as framing, accepted as product. The legacy row shipped **zero** inline buttons — everything sat behind the ellipsis. Inline-plus-ellipsis is therefore a **new-UI intent**, not a restoration, and it reverses a shipped decision: `playgrounds/labs-nuxt/app/components/factory/ActionSlots.types.ts:20-21` documents *"Every action, shown in all three placements — context-menu never gates reachability."* A placement declaration reverses that and owes an adjacent `@decision` block. If it ships, it follows the existing button-group discriminant rather than an invented enum.

---

## Open question

**`const` alone, or `const` plus a parent `default`, for injection into an empty model.** The design council executed that a leaf `const` injects nothing into an empty model and that `default` must sit on the parent object — which would make this the family's most dangerous silent failure, a forced filter that never materialises. The operator's position is that a leaf `const` alone already works in this codebase.

**This is to be settled inside the headless ajv proof, not by argument, with the operator's position as the expected result.** It is recorded as open here because a construct asserted from documentation is unproven either way — which is decision 12's own rule applied to decision 12's own exception.

---

## Consequences

### Positive

- The declaration is simultaneously the validation and the documentation of what is filterable, sortable and actionable. An undeclared filter column cannot be spelled, so the HTTP 500 an unknown column causes becomes structurally unreachable rather than caught late.
- The core carries no UI, route or path knowledge, so a second consumer pairs composables its own way without a core change.
- One shape serves every list module. The shape generalises because the module visibility law binds the **barrel**, not the return shape — a flat module can publish the same pairs off its existing return, without waiting on a four-layer conversion.
- Multi-key sort and the wire serialiser both work untouched (`query.types.ts:118-120`, `useQuery.ts:134-148`).

### Costs accepted

- **The column catalogue must be probed per module.** The *shape* generalises; the set of real filterable columns does not. An undeclared-but-guessed column is an HTTP 500, so each module's catalogue is a probe, not an inference.
- **One new renderer.** A tri-state boolean control at a rank above the installed maximum, serving three of the four client-email filters. No array-of-objects renderer and no range renderer are needed — a date range is two properties and therefore two existing date controls.
- **The installed lookup control cannot be adopted verbatim for S-D10.** `LookupRenderer` exists and is registered at rank 3, but its tester matches on a **schema** member and it reads its search function off `control.schema.lookup` (`packages/ui/src/ui/form/renderers/controls/LookupRenderer.vue:35-38`, `:41-49`) — a live function in the schema, which the family's schemas cannot carry: they are published as plain JSON across the renderer port. So the first module to declare a user-generated filter takes the option source from the **uischema** `options`, as S-D10 states, and `LookupRenderer` is the precedent that such a control exists rather than the control to reuse. No client-email filter is user-generated, so this is a cost the canary does not pay.
- **Two one-line repo defects block any custom renderer today**, and neither is optional:
  - `packages/client-vue/src/components/form/Form.vue:7` — `:additional-renderers="formRenderers"` is bound *after* `v-bind="forwarded"` at `:4`, so a consumer's renderers are accepted and silently dropped. No consumer can register a renderer at all.
  - `packages/ui/src/ui/form/renderers/controls/index.ts:37` — `import ConstRenderer, { tester as ConstTest } from "./StringRenderer.vue";` is a dead self-import, so the real const/hidden control is never registered and a typed `const` filter draws an **editable text box**. A user can edit a scope-enforced constraint.
- **A deliberate idiom deviation** in decision 1 (`as const` + `satisfies` instead of the established `: JsonSchema7` annotation), owing a `@decision` block — as do the placement declaration (decision 3) and any other deviation the variance law catches.
- **A docblock scope expansion.** `packages/headless/src/modules/client-email/client-email.schemas.ts:5-6` states a singular purpose — *"Schema / uischema for the per-email form"* — and that file carries the internal marker at `:1`. Adding collection-level pairs widens it; the file is renamed and its docblock rewritten explicitly, never silently widened.

### Amendments owed to ADR-027

Recorded here as needing amendment; amending ADR-027 is not part of this record.

1. **`ADR-027:72` is stale.** The controlled-table channel bullet asserts that manual sorting and filtering have *"zero instances in the tree today"*. That is no longer true.
2. **ADR-027 Amendment 4 needs narrowing, not amending.** Its "sort schema" wording should read that sort — the `sort` branch of the one query schema (decision 13) — **validates the already-frozen `{ field, dir }[]` model** rather than proposing a schema-shaped sort declaration of its own (decision 10).

### Out of scope

- Building the flow machine's route projection, and the second real canary.
- Per-action input schemas as a new concept — an action's input form is the module's existing form schema.
- The free-text filter no-op in the sibling collection modules. It dies in client-email as a consequence of decisions 1 and 13 — `query` is a legal top-level property only where the endpoint honours it, this endpoint does not, and a wire-keyed `filters` branch with `additionalProperties: false` gives an unhonoured `query=` key nowhere else to hide; the remaining modules are separate work.
- Visual polish of any of it.

### Implementation status

**Not built.** This record fixes the shape so it can be built once; it certifies no delivered capability. The receipts above are all of existing code — the seam, the serialiser, the shipped precedents and the two blocking defects. The schema shapes, the translators and the registry contract are decided and unwritten.

**Exception: decision 10's sort uischema is built.** The 2026-08-18 amendment's `useSortUischema()` mechanism ships on `client-email` (`client-email.schemas.ts`) and `client-email-history` (`client-email-history.schemas.ts`), published on each module's own list context (`sortUischema`) beside the query schema. The rest of this record's "not built" status is otherwise unchanged.
