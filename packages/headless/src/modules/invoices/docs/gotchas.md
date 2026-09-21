# Invoices Gotchas

Edge cases and things to watch out for.

> **🧪 For Testers:** focus on the 🧪 items.

---

## A list's `total` reads through `.pagination`, never the bare `total` field 🧪

`useContext().total`, `useMeta().hasUnpaid`, and `useMeta().consolidatableCount` all derive from the server's reported row count. That count only refreshes as a side effect of reading `.pagination`/`.meta` on the underlying query handle — reading the query's own top-level `total` field directly returns a value pinned at `0`, forever, regardless of what the server answered. This module always reads through `.pagination.value.total`; a new derivation added to this module (or copied from it into another) must do the same.

```typescript
// ❌ Wrong — reads a value that never updates
const total = someOtherModulesQuery.total.value;

// ✅ Correct — this module's own members already do this
const { total } = invoices.useContext(); // reads .pagination.value.total internally
```

**Test scenario:** load a list whose recorded total exceeds the page size; assert the published total is the server's non-zero figure, not `0`.

---

## Every scoped column survives every published criteria write — by design, not by accident 🧪

Reading an entitled client's invoices (`.for('client', id)`) applies that client's id as a declared filter column; reading one contract's, one contract product's, or one parent invoice's credit notes (`.for('contract'|'contracts_product'|'invoice', id)`) does the same for its own column (`contracts.id` / `products.contracts_product_id` / `credit_invoice_id`). A published criteria write (`setCriteria`, `sortBy`, the consolidatable/credit-notes presets) merges its own branch wholesale — a filters-branch write that doesn't itself carry the scoped column would otherwise silently drop it and re-widen the list, while row attribution still labelled the returned rows against the original target. This module closes that door: every published write re-asserts each resolved slot's column unless the caller explicitly declares that same key — an explicit caller-declared key always wins.

**Test scenario:** retarget the collection with `.for('contract', id)`, then call `filterCreditNotes()` (whose preset carries no relationship id) and a bare `setCriteria({ filters: {...} })`; assert the next request still carries `contracts.id`.

---

## `isDelegated` does not need the reader's id; `isChildOfClient` does 🧪

A row's delegated classification is a fact about the invoice's own client (does it have _any_ parent account at all), independent of who is reading. A row's sub-account classification needs to compare that parent against the reader's own id. Calling the mapper with only one argument — as `orders/order.machine.ts` does — still yields a correct delegated signal, but a conservative "not mine" sub-account signal. This is intentional, not a bug to fix in `orders`.

```typescript
// A single-argument call still resolves isDelegated correctly:
mapInvoice(raw); // isDelegated: correct; isChildOfClient: conservative false
```

**Test scenario:** map the same third-party-parent row with and without a reader id; assert `isDelegated` agrees both times and `isChildOfClient`/`isOwn` differ.

---

## A dotted filter column needed a validation fix to reach the wire

Filter columns like `status.code` and `category.slug` carry a literal dot in their name — they are not nested paths. The shared request-validation layer originally treated any dotted key as a path separator, which silently mishandled these columns. A small, targeted fix (outside this module, in the shared validation utility) makes a dotted column name reach the wire intact. Any future module declaring a dotted filter column depends on this fix already being in place.

---

## The declared `"count"` page-size sentinel does not reach the wire

The query schema declares a non-numeric `"count"` value as a legal `pagination.limit`, mirroring a shape the platform itself accepts for a rows-free total-only read. The shared request-validation layer only recognises the numeric branch of that declaration and silently substitutes the default page size before the request is sent — so `"count"` is spellable in the schema but never actually reaches the platform through this module's declared criteria channel. The existence and consolidatable counts instead use the smallest real page window (one row) and read the server's reported total, discarding the row — which produces the same answer.

**Practical effect:** do not expect setting `pagination: { limit: "count" }` through `setCriteria` to do anything different from a normal one-row page; it is validated away before the request goes out.

---

## Read meta only after isReady() 🧪

Before the fetch settles, `data` is `[]` (collection) or empty (single read), and `meta` derives from loaded data. Reading `meta` on a non-loaded scope observes the pre-load default, not the invoice.

```ts
import { useInvoice } from "@upmind-automation/headless";

declare const id: string;
declare function settle(): void;

// ❌ Wrong — reads before the invoice has loaded
const { isPaid } = useInvoice().withId(id).useMeta();
if (isPaid.value) settle();

// ✅ Correct — wait for readiness first
const invoice = useInvoice().withId(id);
await invoice.useActions().isReady();
if (invoice.useMeta().isPaid.value) settle();
```

**Test scenario:** mount a component, assert it awaits `isReady()` before branching on `meta`.

---

## Payments include failures and pending rows

`data.payments` is append-only from the read side and includes declined, abandoned, and pending attempts. Treat only captured, non-refunded rows as authoritative.

---

## A payment can carry no saved card

Wallet and one-off / guest-card captures return `cardType` and `cardLast4` as `null`. Check presence before rendering "card ending 1234".

---

## The embedded client / address is frozen at conversion

The snapshot does not follow the live client record. Renames and address edits after conversion do not appear on an existing invoice — correct for a legal document, but wrong for a consumer that assumes it tracks the live record.

---

## Money fields come in three flavours

`unpaidAmount` (number), `unpaidAmountFormatted` (locale string), and `unpaidAmountConverted` (display currency) are not interchangeable. Do arithmetic on the number, render the formatted string, and never place a converted value beside a non-converted total.

---

## Edge Cases

| Scenario                                             | Expected behaviour                                         | Notes                                                    |
| ---------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------- |
| No addressable client (self or `.for()` target)      | zero requests fired; the scope reports unavailable         | guard rejects before the wire                            |
| Unknown invoice id                                   | `404`; `error` populated                                   | `meta.hasError` after load                               |
| An undeclared filter column                          | refused — a validation error                               | never a silent pass-through                              |
| No payments, balance owed                            | `paymentState === "pending"`                               | fresh unpaid invoice                                     |
| Payments, nothing owed                               | `paymentState === "complete"`                              | settled                                                  |
| Pending (uncaptured) attempt                         | contributes nothing to `paidAmount`                        | do not re-prompt while in flight                         |
| A third-party sub-account's row on a co-mingled list | neither own, sub-account, nor delegated — stays settleable | the delegate gate is "any parent", not "reader's parent" |

---

## Lifecycle

Both composables' `destroy()` removes the scoped instance from the registry so the next `.as()` / `.withId()` mints a fresh one. `isReady()` always settles — even a fetch that never completes resolves `false` on a bound timeout, rather than leaving a caller's `await` hanging forever.

```ts
import { useInvoice, useInvoices } from "@upmind-automation/headless";

declare const id: string;

await useInvoices().as("self").useActions().isReady();
await useInvoice().withId(id).useActions().isReady();
```
