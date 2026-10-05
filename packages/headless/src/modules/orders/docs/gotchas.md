# orders Gotchas

Edge cases, known issues, and the differences from the legacy application that this module keeps on purpose.

> **🧪 For Testers:** The four accepted divergences below each carry a proof spec that asserts the module's own behaviour on the wire. Treat any of the four "legacy" behaviours reappearing as a regression, not a fix.

---

## Accepted divergence 1 — Equal spelling

The legacy application sends an equal-comparison filter as a bare column key, e.g. `filter[number]=QA-INV-25144`. This module always sends the explicit equal-comparison suffix instead: `filter[number|eq]=QA-INV-25144`. Both mean the same comparison on the wire; only the spelling differs.

```ts
// ❌ The legacy wire shape — do not expect this from orders
// filter[number]=QA-INV-25144

// ✅ What orders actually sends
// filter[number|eq]=QA-INV-25144
```

**Test scenario:** Write an equal filter on any declared column and assert the wire key carries the `|eq` suffix explicitly — never a bare column key.

---

## Accepted divergence 2 — One search leaf

The legacy application holds the quick search and the number filter as two independent values: whichever the customer touched last wins on screen, and the filter bar keeps its own value even after the search box is cleared — clearing the search box restores the filter bar's value underneath it. This module holds exactly one search leaf. Only the last write — whichever of the two the customer used most recently — is live; clearing the search removes the leaf outright rather than falling back to a filter-bar value underneath it.

```ts
// ❌ Do not expect two independent leaves that fall back to one another
// (legacy shape: filter-bar value survives under a cleared search box)

// ✅ orders holds ONE `number.eq` leaf. The last write — search or
// filter-bar — is the live value; clearing it removes the leaf.
```

**Test scenario:** Write a search, then a raw filter write on the same column, then clear the search — assert the wire carries no `number` filter at all after the clear, not a filter-bar value underneath it.

---

## Accepted divergence 3 — Past the last page

The legacy application, when a page request lands past the true end of the history, returns the customer to page one. This module lands on the **last page** instead. The underlying request layer this module is built on already re-requests the last page on its own before this module ever sees the empty page, and this module does not intervene in that recovery. This difference from the legacy application was reviewed and accepted by the product operator on 2026-09-28: the accepted behaviour is that reading past the last page lands on the last page, not page one.

```ts
// ❌ Do not expect a return to page one when reading past the true last page
// (this IS still true for a genuinely empty history — see below)

// ✅ Reading past the true last page of a non-empty history lands on the
// LAST page. Reading a genuinely empty history still lands on page one —
// the two "zero rows" cases are not the same case.
```

**Test scenario:** Read a page window past the true end of a history that has orders in it — assert the module lands on the true last page, and that no request goes out at offset zero. Separately, read a genuinely empty history at its first page — assert it stays on page one.

---

## Accepted divergence 4 — Pay surface

The legacy application exposes a single `pay` control that opens a payment dialog. This module has no `pay` member on its own action surface at all — paying an order means mounting the payment component inside the caller's own page and calling the payment delegate from inside that component's own setup, because the underlying payment engine binds its own lifecycle to whichever component is mounted when it starts.

```ts
// ❌ There is no `pay()` action on useOrder().useActions()
// order.useActions().pay() // does not exist

// ✅ Call the payment delegate from inside the payment component's own
// setup, only while the order is payable — pass the chosen paymentDetail
import {
  ScopeActorTypes,
  useOrder,
  type PaymentDetailData
} from "@upmind-automation/headless";

declare const orderId: string;
declare const paymentDetail: PaymentDetailData;

const order = useOrder().as(ScopeActorTypes.SELF).withId(orderId);
const { pay } = order.useActions().usePayment(paymentDetail);
```

**Test scenario:** Inspect the manager's action surface — assert it carries no `pay` member and does carry `usePayment`.

---

## The delegated marker is on the order, not in the list

The history list has no Delegated column. The raw order row carries a single `delegate_related` boolean, and no table cell shape can read it off the row root: scoping a cell at the row root yields an empty data path, which gives the column an empty id and crashes the table's header model — the list renders zero rows. The manager publishes the marker instead, as `meta.isDelegated`, mapped through the invoices capability's attribution logic.

```ts
import { ScopeActorTypes, useOrder, useOrders } from "@upmind-automation/headless";

declare const orderId: string;

// ❌ Looking for a delegated flag on the history context
const orders = useOrders().as(ScopeActorTypes.SELF);
const delegatedRows = orders
  .useContext()
  .data.value.filter(o => "delegate_related" in o && o.delegate_related);

// ✅ Read the marker from the single-order manager
const order = useOrder().as(ScopeActorTypes.SELF).withId(orderId);
const isDelegated = order.useMeta().isDelegated;
```

**Test scenario:** Load a delegated order through the manager — assert `meta.isDelegated` is true; load an own order — assert it is false.

---

## findOne on the history context

`findOne` on the history's context matches rows by a **strict** comparison against the partial object you pass it — it does not match a nested field inside a partial the way you might expect a "loose" partial match to. A lookup keyed on a nested field (for example, matching on a value inside `status` rather than on the row's own top-level fields) can silently miss a row that is genuinely on the page.

```ts
import { ScopeActorTypes, useOrders } from "@upmind-automation/headless";

declare const orderId: string;

const orders = useOrders().as(ScopeActorTypes.SELF);
const { data, getOne } = orders.useContext();

// ❌ A nested-partial match can silently miss a row that is on the page
const nestedMatch = data.value.find(o => o.status?.code === "invoice_paid");

// ✅ Prefer getOne by id, or match on the row's own top-level fields
const row = getOne(orderId);
```

**Test scenario:** N/A for this module's own suite — this is a known limitation of the shared list-matching helper every collection built on it inherits, not a defect specific to this module.

---

## No automated browser proof of the playground pages

The `/useOrders` and `/useOrder/:id` playground pages exist, but no automated browser test drives them. This is a named gap, not a passing check: no browser lane ships with this module. The status-filter request (`filter[status.code|eq]=...`) is proven only by the headless integration test for dotted filter operators, so a regression confined to the playground page's filter-bar wiring would not be caught automatically. Verify the pages by hand after changing the history's filter surface.

---

## Common Mistakes

### Reading an item's image by its line id

An order item's catalogue image is addressed by the item's **linked catalogue product id**, never by the item's own line id. The two ids look interchangeable but resolve to different records — using the line id returns no image, or the wrong product's image, on any order where the line id happens to also exist as a catalogue product id.

### Assuming the billing-cycle name is always resolved on first render

An item's billing-cycle name depends on a reference list a sibling capability loads lazily, on its own schedule. An order's items can render before that list has resolved — the billing-cycle name fills in once it does, but a snapshot taken immediately on first render can show it unresolved even for a genuine subscription item.

### Writing only `offset` on a page move

A page write replaces the whole pagination window, not just the offset. Writing `{ pagination: { offset } }` alone silently resets the page size back to its default on the next request — always write both `limit` and `offset` together on a page move.

---

## Edge Cases

| Scenario | Expected behaviour | Notes |
| --- | --- | --- |
| No client signed in | No request goes out from this module at all. | Applies to both the history and the single-order read. |
| An order id that does not resolve | The single-order read publishes no record and a failure condition. | The reload control re-issues the same request. |
| A thin single-order read (a narrower relation set than usual) | Every detail/item field individually falls back rather than throwing. | A field that depends on an un-requested relation reads as absent, not as an error. |
| An item with an empty options/attributes set | No sub-items, and the main item is not promoted into the sub-item list. | Only a genuinely non-empty options/attributes set produces sub-items. |
| An order with no `brand_id` | No online-gateway read is issued; the online-gateway condition reads false. | |
| A snapshot that was captured but is empty | No items, and no live fallback. | Distinct from no snapshot ever having been captured — see the Lessons in [foundation.md](./foundation.md). |

---

## Lifecycle Considerations

### Always await readiness before branching on the first read

Both composables' readiness signal always settles — even against a stalled connection — rather than hanging a caller's `await` open indefinitely. Branch on it rather than on the raw loading flag when a caller genuinely needs to wait for the first read.

```ts
import { ScopeActorTypes, useOrders } from "@upmind-automation/headless";

const orders = useOrders().as(ScopeActorTypes.SELF);
await orders.useActions().isReady();
```

### Destroy the instance when done

```ts
import { onUnmounted } from "vue";
import { ScopeActorTypes, useOrder } from "@upmind-automation/headless";

declare const orderId: string;
const order = useOrder().as(ScopeActorTypes.SELF).withId(orderId);
onUnmounted(() => order.useActions().destroy());
```

### Re-read the order on every view enter

A scoped single-order instance can outlive the page that opened it. Call `refresh()` every time the customer (re-)enters the order view, rather than relying on the instance's own cache alone.
