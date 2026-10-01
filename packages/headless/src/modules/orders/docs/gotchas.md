# client-orders Gotchas

Edge cases, known issues, and the differences from the legacy application that this module keeps on purpose.

> **🧪 For Testers:** The four accepted divergences below each carry a proof spec that asserts the module's own behaviour on the wire. Treat any of the four "legacy" behaviours reappearing as a regression, not a fix.

---

## Accepted divergence 1 — Equal spelling

The legacy application sends an equal-comparison filter as a bare column key, e.g. `filter[number]=QA-INV-25144`. This module always sends the explicit equal-comparison suffix instead: `filter[number|eq]=QA-INV-25144`. Both mean the same comparison on the wire; only the spelling differs.

```ts
// ❌ The legacy wire shape — do not expect this from client-orders
// filter[number]=QA-INV-25144

// ✅ What client-orders actually sends
// filter[number|eq]=QA-INV-25144
```

**Test scenario:** Write an equal filter on any declared column and assert the wire key carries the `|eq` suffix explicitly — never a bare column key.

---

## Accepted divergence 2 — One search leaf

The legacy application holds the quick search and the number filter as two independent values: whichever the customer touched last wins on screen, and the filter bar keeps its own value even after the search box is cleared — clearing the search box restores the filter bar's value underneath it. This module holds exactly one search leaf. Only the last write — whichever of the two the customer used most recently — is live; clearing the search removes the leaf outright rather than falling back to a filter-bar value underneath it.

```ts
// ❌ Do not expect two independent leaves that fall back to one another
// (legacy shape: filter-bar value survives under a cleared search box)

// ✅ client-orders holds ONE `number.eq` leaf. The last write — search or
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
// ❌ There is no `pay()` action on useClientOrder().useActions()
// order.useActions().pay() // does not exist

// ✅ Call the payment delegate from inside the payment component's own
// setup, only while the order is payable — pass the chosen paymentDetail
const { pay } = order.useActions().usePayment(paymentDetail);
```

**Test scenario:** Inspect the manager's action surface — assert it carries no `pay` member and does carry `usePayment`.

---

## Known gap — the playground filter-bar status control sends no request

On the labs-nuxt playground page, clicking a status choice in the filter-bar control sends no request at all. The gap is in the shared design-system form renderer (`design-system/packages/ui/src/form/renderers/utils.ts`), not in this module: a filter column name that carries a dot, such as `status.code`, is a control whose JSON Forms scope segments are `["status", "code"]`. The renderer's write path dispatches the update against those segments cast to a single string instead of writing through them one at a time, so the value lands one level too deep in the form's own data tree and the control's change never reaches this module's criteria write at all.

This module's own data layer is not implicated. The dotted-operators integration coverage drives `useInternals().query.setCriteria` directly — bypassing the form renderer — and proves that a `filter[status.code|eq]` and a `filter[status.code|neq]` write each reach the wire correctly once they reach this module's criteria writer. The gap is entirely upstream of this module, in the control that is supposed to hand it the write.

The browser-driven proof for this control is marked as a known failure until the design-system defect is fixed.

```ts
// ❌ Clicking a status choice on the labs-nuxt playground page — no request
// is sent; the write lands one level too deep in the form's own data tree.

// ✅ Writing the same filter directly through the module's own criteria
// writer reaches the wire correctly — proven by the dotted-operators
// integration coverage, independent of the form renderer.
orders.useActions().filters.status(["invoice_paid"]);
```

**Test scenario:** N/A for this module's own suite — the defect is in the shared form renderer, not in this module's criteria writer or wire translation.

---

## findOne on the history context

`findOne` on the history's context matches rows by a **strict** comparison against the partial object you pass it — it does not match a nested field inside a partial the way you might expect a "loose" partial match to. A lookup keyed on a nested field (for example, matching on a value inside `status` rather than on the row's own top-level fields) can silently miss a row that is genuinely on the page.

```ts
// ❌ A nested-partial match can silently miss a row that is on the page
const row = data.value.find(o => o.status?.code === "invoice_paid");

// ✅ Prefer getOne by id, or match on the row's own top-level fields
const row = getOne(orderId);
```

**Test scenario:** N/A for this module's own suite — this is a known limitation of the shared list-matching helper every collection built on it inherits, not a defect specific to this module.

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
import { ScopeActorTypes, useClientOrders } from "@upmind-automation/headless";

const orders = useClientOrders().as(ScopeActorTypes.SELF);
await orders.useActions().isReady();
```

### Destroy the instance when done

```ts
import { onUnmounted } from "vue";
import { ScopeActorTypes, useClientOrder } from "@upmind-automation/headless";

declare const orderId: string;
const order = useClientOrder().as(ScopeActorTypes.SELF).withId(orderId);
onUnmounted(() => order.useActions().destroy());
```

### Re-read the order on every view enter

A scoped single-order instance can outlive the page that opened it. Call `refresh()` every time the customer (re-)enters the order view, rather than relying on the instance's own cache alone.
