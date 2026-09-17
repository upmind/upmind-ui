# Invoices Architecture

## Overview

Invoices is a scoped, query-backed module with two separately-exported composables sharing one services factory: `useInvoices` (the collection) and `useInvoice` (one invoice by id). There is no state machine — the query handle is the state. One services file resolves the identity seam for both composables, so a collection scope and a single-read scope addressing the same client can never disagree about who that client is.

`ScopeActorTypes.STAFF` resolves to `never` on both scope matrices (deprecated for this resource) — the only live actor is `client`. The collection's matrix carries four context members off the `client` cell: `client` (an entitled other client's own invoices, via `.for('client', id)`), and three relationships — `contract`, `contracts_product`, `invoice` — each narrowing to that relationship's invoices or credit notes. Every context is resolved and kept durable through the same seam (`resolveFilterSlots` / `seedFilterSlots` / `withDurableFilterSlots` in `invoices.utils.ts` and `invoices.services.ts`), so a collection scope and a single-read scope addressing the same target can never disagree, and no published criteria write can silently drop a scoped column. The single read's matrix stays all-`never` — `.for(type, id)` is unspellable on `useInvoice`.

## Data flow

```mermaid
flowchart TD
    A([useInvoices as-actor / .for context]) --> B["resolve filter slots — client_id always,<br/>plus one relationship column when .for(type, id)<br/>names contract / contracts_product / invoice"]
    B --> C["GET /invoices — declared filters/sort/pagination,<br/>each resolved slot seeded and kept durable<br/>across every published criteria write"]
    C --> D["select: map rows → attribute each<br/>(own / sub-account / delegated)"]
    D --> E["data / total / pagination — published on useContext()"]
    A --> F["GET /invoices — unpaid-existence count<br/>(own criteria, own query key)"]
    A --> G["GET /invoices — consolidatable count<br/>(own criteria, own query key)"]
    F --> H["useMeta().hasUnpaid"]
    G --> I["useMeta().consolidatableCount"]

    J([useInvoice withId id]) --> K["GET /invoices/id — the wide relation set"]
    K --> L["select: map one row"]
    L --> M["data — published on useContext()"]
    J --> N["GET /invoices/unpaid_amount/id<br/>— re-keyed on currency change"]
    N --> O["useContext().unpaidAmount"]

    E --> P["useActions().setCriteria / sortBy /<br/>filterConsolidatable / filterCreditNotes<br/>— every resolved slot's column survives every write"]
    M --> Q["useActions().assignPaymentMethod —<br/>PATCH .../payment_details, invalidates the shared key"]
```

## Sub-units

| File                       | Purpose                                                                                                                                                                                                                                                                     |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `invoices.types.ts`        | Scope matrices (collection + single-read), the `InvoicesContextTypes` context enum and its wire-key map, the query model, `Invoice`/`Payment` view types, service contract types.                                                                                           |
| `invoices.services.ts`     | The ONE services factory both composables consume — list/single/unpaid-amount/count reads, the payment-method write, target-client resolution, and `withDurableFilterSlots` (keeps every resolved slot's column present on every published criteria write).                 |
| `invoices.utils.ts`        | `resolveFilterSlots` (which filter columns a scope seeds — `client_id` always, one relationship column when `.for()` names one) and `seedFilterSlots` (writes each slot's column onto the query handle and keeps it tracking its source); the PDF-download browser trigger. |
| `invoices.schemas.ts`      | The collection's query schema (filters/sort/pagination as one declared model) and its criteria presets.                                                                                                                                                                     |
| `invoices.mappers.ts`      | Wire → view-model mapping: the invoice itself, payments, co-mingled attribution, bundle/large-flag derivation.                                                                                                                                                              |
| `useInvoices.ts`           | Collection composable: mints the list query, the unpaid-existence count query, and the consolidatable-count query once per scope.                                                                                                                                           |
| `useInvoices.actions.ts`   | Collection actions — criteria writes, sort, presets, the payment-method write, lifecycle.                                                                                                                                                                                   |
| `useInvoices.context.ts`   | Collection context — the reactive list, its total, pagination, published criteria, schemas.                                                                                                                                                                                 |
| `useInvoices.meta.ts`      | Collection state flags — including the two dedicated count reads.                                                                                                                                                                                                           |
| `useInvoices.internals.ts` | Debugging: the raw query object, the resolved target client, the wire the live criteria builds.                                                                                                                                                                             |
| `useInvoice.ts`            | Single-read composable: mints the item query and the unpaid-amount query once per scope.                                                                                                                                                                                    |
| `useInvoice.actions.ts`    | Single-read actions — lifecycle, the unpaid-amount re-read.                                                                                                                                                                                                                 |
| `useInvoice.context.ts`    | Single-read context — the mapped invoice and the live unpaid amount.                                                                                                                                                                                                        |
| `useInvoice.meta.ts`       | Single-read state flags, including the discriminated payment state.                                                                                                                                                                                                         |
| `useInvoice.internals.ts`  | Debugging: the raw query object.                                                                                                                                                                                                                                            |
| `index.ts`                 | Public barrel: `useInvoices`, `useInvoice`, the collection's scope matrix/context enum, public model types, curated `mapInvoice`/`mapInvoices` re-exports.                                                                                                                  |

No `.{actor}.ts` arm exists on any of the five layers (services, actions, context, meta, schemas) — the `client`/`client` context difference is resolved inside the shared factory, and the staff actor resolves to `never`.

## Dependencies

### Invoices depends on

| Module                                   | Usage                                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------------- |
| `query`                                  | list/single-item queries, criteria validation and translation, `invalidateQueryByKey` |
| `scope`                                  | the scoped-composable factory, scope-key generation, registry removal                 |
| `session-store`                          | `useActiveSession` — auth guard and the reading client's own id fall-through          |
| `client` / `client-address` / `currency` | snapshot mappers                                                                      |
| `basket` / `basket-product`              | shared line-item and tax parse                                                        |

### Modules that depend on invoices

| Module             | Usage                                                                                                                                                                                     |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `orders`           | imports the curated `mapInvoice` re-export and the `Invoice` type from the barrel to attach a completed order's resulting invoice; does not read the collection, the counts, or the write |
| Presentation layer | renders list / detail / receipt / dunning off the invoice shape, including co-mingled attribution                                                                                         |

## Integration points

| System         | Integration                                                                                                                                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HTTP transport | bearer attach, request validation, filter/sort/pagination translation to the wire, error normalisation                                                                                                          |
| Session        | both composables' fetches gate on an authenticated session with a resolved target client id                                                                                                                     |
| Scope registry | one scoped instance per `(actor, context, id?)` key; the collection and the single read share the module name but never collide, because the single read always carries an id segment the collection never does |
