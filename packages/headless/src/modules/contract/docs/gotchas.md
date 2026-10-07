# contract Gotchas

Edge cases, known issues, and things to watch out for.

> **🧪 For Testers:** Focus on the payment-method no-op refusal and the `products` relation below.

---

## Submitting the SAME payment method (or none) sends nothing — and that is correct 🧪

`update()` (and `setPaymentMethod()`, which wraps it) compares the form's `paymentDetailsId` against the loaded contract's own `paymentDetailsId` BEFORE sending anything. An empty selection, or the method the contract already uses, resolves `false` with no `PATCH` sent at all — this mirrors the legacy screen it ports, which refuses to submit when nothing actually changed.

```typescript
import { ScopeActorTypes, useContract } from "@upmind-automation/headless";
import type { Contract } from "@upmind-automation/headless";

declare const contractId: string;
declare const currentId: string;
declare function render(paymentDetailsId: Contract["paymentDetailsId"]): void;

const contract = useContract().as(ScopeActorTypes.CLIENT).withId(contractId);

// ❌ Wrong — assumes a resolved `false` never happens on a "successful" call
const unchecked = await contract.useActions().setPaymentMethod({ paymentDetailsId: currentId });
render((unchecked as Contract).paymentDetailsId); // `unchecked` is `false`, this reads undefined

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

Every other capability this module or its sibling `contract-product` module exposes is refused once a record leaves the live set. The payment-method form is the one exception: it is offered on `unavailable.cancelled` and `unavailable.lapsed` too (refused on `unavailable.fraud`) — a client may still want a valid card on file even after cancellation. Do not assume `isAvailable === false` means the payment-method control should be hidden; check `isFraud` specifically instead.

## The payment-method form is offered only for a subscription the client owns 🧪

Whatever the status, the form's open event is refused for a one-off contract (`billingCycleMonths` of `0`) and for a contract with any product delegated to the client (`products[].isDelegatedObject`). A refused open leaves `isPaymentMethodOpen` `false`, and `setPaymentMethod` resolves `false` with nothing sent.

**Test scenario:** load a one-off contract, call `openPaymentMethod()`, and assert `isPaymentMethodOpen` stays `false`. Repeat with a subscription contract that holds a delegated product.

---

## An embedded product row is a product view model without some members

`contract.products` is `ContractProductEmbedded[]`: `ContractProduct` without `allowedMigrations`, `clientInvoiceConsolidationEnabled`, `contractBillingCycleLabel`, `contractCurrencyId`, `contractStatus` and `contractTaxType`. The sibling module's product mapper fills the rest — status, tags, brand currency, cancellation-request status, booked future-cancellation facts, any successor product and the delegated clients. The contract read requests no allowed migrations and no owning-contract relation, so those members are absent from the type, and a read of one is a compile error. A contract list row carries no products at all (`products: []`). A caller that needs those members for one product must load that product directly through `useContractProduct`.

```typescript
import { ScopeActorTypes, useContract, useContractProduct } from "@upmind-automation/headless";

declare const contractId: string;
declare const productId: string;

const { contract } = useContract().as(ScopeActorTypes.CLIENT).withId(contractId).useContext();

// ❌ Wrong — the embedded row has no allowedMigrations; this does not compile
const embedded = contract.value?.products.find(p => p.id === productId);
// const canChangePlan = (embedded?.allowedMigrations.length ?? 0) > 0;

// ✅ Correct — load the one product directly for its migration facts
const product = useContractProduct().as(ScopeActorTypes.CLIENT).withId(productId);
await product.useActions().isReady();
const { canMigrate } = product.useMeta();
```

---

## The contracts list's sort column is an `enum`, not `oneOf` — but its i18n labels are not shipped yet 🧪

`useContracts().useContext().schemas.query.sortUischema` binds a `Control` over the schema's `sort` branch, whose `field` leaf is a plain `enum` (created_at, next_due_date, total_amount, status). There is no `oneOf`/titled-option shape here — the control is wired to read its labels from i18n (`form.contract_sort`), the same pattern the sibling `useContractProducts` collection's sort control uses (`form.contract_product_sort`) and the `useInvoices` collection uses (`form.invoice_sort`). Unlike those two, `form.contract_sort` is not yet registered in `packages/i18n/src/core/form-en.json`. The four filter-bar controls (`form.contract_search_filter`, `form.contract_status_filter`, `form.contract_created_filter`, `form.contract_next_due_filter`) have the same gap. Until those five keys are added, the sort control and the four filter controls render their raw i18n key instead of a label.

**Test scenario:** render `useContracts().useContext().schemas.query.uischema` and `sortUischema` through the form engine and assert every control shows a real label, not a bare `form.contract_*` key.

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
| Contract is one-off, or holds a product delegated to the client | The payment-method form's open event is refused, on every status | The form is for a subscription the client owns |
| A contract's status code is outside the seven published codes | The contract settles on the machine's top-level `error` node; `isReady()` resolves `false` once it lands there | The load's ordered list of status guards matches nothing, so its last entry records a status error and lands on `error`; a `REFRESH` leaves `error` and re-runs the load |
| The reused stored-payment-methods lookup fails or is slow | The payment-method form still opens, with an empty options list | The lookup degrades rather than blocking or failing the contract's own load |

---

## Lifecycle Considerations

### Destroy the Instance When Done

```typescript
import { onUnmounted } from "vue";
import { ScopeActorTypes, useContract, useContracts } from "@upmind-automation/headless";

declare const contractId: string;

const contracts = useContracts().as(ScopeActorTypes.CLIENT);
const contract = useContract().as(ScopeActorTypes.CLIENT).withId(contractId);

onUnmounted(() => {
  contracts.useActions().destroy();
  contract.useActions().destroy();
});
```

### Wait for Ready State

```typescript
import { ScopeActorTypes, useContract, useContracts } from "@upmind-automation/headless";

declare const contractId: string;

const contracts = useContracts().as(ScopeActorTypes.CLIENT);
const contract = useContract().as(ScopeActorTypes.CLIENT).withId(contractId);

await contracts.useActions().isReady();
await contract.useActions().isReady();
```
