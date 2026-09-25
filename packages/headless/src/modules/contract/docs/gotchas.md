# contract Gotchas

Edge cases, known issues, and things to watch out for.

> **🧪 For Testers:** Focus on the payment-method no-op refusal and the deliberately narrow `products` relation below.

---

## Submitting the SAME payment method (or none) sends nothing — and that is correct 🧪

`update()` (and `setPaymentMethod()`, which wraps it) compares the form's `paymentDetailsId` against the loaded contract's own `paymentDetailsId` BEFORE sending anything. An empty selection, or the method the contract already uses, resolves `false` with no `PATCH` sent at all — this mirrors the legacy screen it ports, which refuses to submit when nothing actually changed.

```typescript
// ❌ Wrong — assumes a resolved `false` never happens on a "successful" call
const result = await contract.useActions().setPaymentMethod({ paymentDetailsId: currentId });
render(result.paymentDetailsId); // `result` is `false`, this throws

// ✅ Correct — check for the no-op signal before reading the result as a Contract
const result = await contract.useActions().setPaymentMethod({ paymentDetailsId: currentId });
if (result === false) {
  // nothing changed; no request was sent
} else {
  render(result.paymentDetailsId);
}
```

**Test scenario:** load a contract, call `setPaymentMethod({ paymentDetailsId: contract.paymentDetailsId })`, and assert the resolved value is `false` and no `PATCH .../payment_details` request was sent.

---

## The payment-method form is offered on `unavailable`, unlike everything else

Every other capability this module or its sibling `contract-product` module exposes is refused once a record leaves the live set. The payment-method form is the one exception: it is offered on `unavailable.cancelled` and `unavailable.lapsed` too (refused only on `unavailable.fraud`) — a client may still want a valid card on file even after cancellation. Do not assume `isAvailable === false` means the payment-method control should be hidden; check `isFraud` specifically instead.

---

## A contract's own read deliberately omits every product's cancellation facts

`GET contracts/{id}` requests each product's status, catalogue product, tags and brand currency — the fields the contract's own page reads — but NOT `products.contract_request*` or `products.future_cancellation_request`. A contract product embedded on `contract.products` therefore never reports a hard-cancellation-request status or a booked future date, even if one genuinely exists on that product. A caller that needs those facts for one product must load that product directly through `useContractProduct`, not read them off the contract's embedded list.

```typescript
// ❌ Wrong — the embedded product never carries this
const embedded = contract.value.products.find(p => p.id === productId);
if (embedded.hasScheduledFutureCancellation) { /* always false here */ }

// ✅ Correct — load the one product directly for its cancellation facts
const product = useContractProduct().as("client").withId(productId);
await product.useActions().isReady();
const { hasScheduledFutureCancellation } = product.useMeta();
```

---

## The contracts list has no filter or sort — by design, not omission

`useContracts().useContext().query` and `.schemas.query.schema` cover pagination only. There is no `filterBy`/`sortBy` action, and no `oneOf`/enum for a sort column, because nothing in the product this module ports ever gave the client a filtered or sorted view of their contract ENVELOPES — every client screen filters and sorts the sibling per-product collection instead. Do not treat the absence of these as a gap to fill; a filter or sort control belongs on `useContractProducts`.

---

## Common Mistakes

### Reading `contract.raw` for a field the view model already maps

The view model on `useContract().useContext().contract` already maps every field this module reads. Reach for `.raw` only when a consumer genuinely needs an unmapped wire field, not as a shortcut around the mapper.

### Assuming the collection and the manager share a cache entry per contract

They don't. The collection's list query and one manager instance's machine context are independent reads with independent cache keys under the same `["contracts"]` root — the same root the sibling `contract-product` module also writes through. A write through either module's manager invalidates the whole root (so both list queries will refetch), but a manager's own context is only updated by its own re-read.

---

## Edge Cases

| Scenario | Expected Behavior | Notes |
|----------|-------------------|-------|
| Payment-method model names no method | `update`/`setPaymentMethod` resolves `false`, sends nothing | The no-op check treats an empty id the same as an unchanged one |
| Contract is flagged fraudulent | The payment-method form's open event is refused | The one `unavailable` node the form does not reach |
| A contract's status code is outside the seven published codes | The contract settles on the machine's top-level `error` node; `isReady()` resolves `false` once it lands there | The `isUnrecognised` guard captures a status error before the transition; a `REFRESH` leaves `error` and re-runs the load |
| The reused stored-payment-methods lookup fails or is slow | The payment-method form still opens, with an empty options list | The lookup degrades rather than blocking or failing the contract's own load |

---

## Lifecycle Considerations

### Destroy the Instance When Done

```typescript
onUnmounted(() => {
  contracts.useActions().destroy();
  contract.useActions().destroy();
});
```

### Wait for Ready State

```typescript
await contracts.useActions().isReady();
await contract.useActions().isReady();
```
