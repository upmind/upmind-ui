# basket-billing Gotchas

Edge cases, known issues, and things to watch out for.

> **🧪 For Testers:** focus on the test scenarios marked with 🧪 below — they're proven by the module's own integration suite against a real basket.

---

## Billing never comes up on an unclaimed basket 🧪

The billing child is only started once the basket it hangs off has an owning client (`client_id`). A guest / unclaimed basket loads and reaches a normal, shopping-ready state — but billing itself is never made available on it, and stays that way indefinitely.

```typescript
import { useBasket, useBasketBilling } from "@upmind-automation/headless";

// ❌ Wrong — assumes billing will eventually resolve, on any basket
await useBasketBilling().isReady();

// ✅ Correct — check the basket is owned before waiting on billing
const { context: basketContext } = useBasket();
if (basketContext.value?.basket?.client_id) {
  await useBasketBilling().isReady();
}
```

**Test scenario:** load an unclaimed (guest) basket. Confirm the basket itself reaches a shopping-ready state. Confirm `useBasketBilling().isReady()` never resolves, and the billing form is never rendered.

---

## `isReady()` polls for an actor that may not exist yet 🧪

`isReady()` polls (every 100ms, no timeout) for the billing child to exist before waiting on its state. If the child is never started — see above — the poll runs forever. There is no built-in escape hatch; the caller must avoid calling `isReady()` in that situation rather than expecting it to reject.

**Test scenario:** same as above — confirm the promise from `isReady()` is still pending after a reasonable timeout when the target basket is unclaimed.

---

## A basket load that is denied looks the same as "no billing" 🧪

If a client tries to load a basket that belongs to someone else, the load itself is denied (a real `403`). Billing never becomes available — but `basket-billing` raises no error of its own; the failure is entirely the basket load's.

```typescript
import { useBasket, useBasketBilling } from "@upmind-automation/headless";

declare function showBillingError(): void;
declare function showBasketLoadError(): void;

// ❌ Wrong — checking only basket-billing's own error state
const { errors } = useBasketBilling();
if (errors.value) showBillingError();

// ✅ Correct — the ownership denial surfaces on the basket, not on billing
const { errors: basketErrors } = useBasket();
if (basketErrors.value) showBasketLoadError();
```

**Test scenario:** attempt to load a basket that belongs to a different client. Confirm the load is denied and billing never becomes available, with no billing-specific error surfaced.

---

## Sending `null` on commit does not clear the address

`address_id: null` on the commit body does not mean "no address" — the server substitutes the client's default address. There is no wire value that means "explicitly no address."

```typescript
import { useBasketBilling } from "@upmind-automation/headless";

// This does NOT clear the address — it applies the client's default instead.
await useBasketBilling().update({
  addressId: null,
  companyId: null,
  phoneId: null
});
```

---

## Adding a phone to a business detail double-writes it if done manually

The `client-company` create already carries the phone inline. Issuing a separate phone create for a business detail's phone creates a duplicate phone record.

```typescript
import {
  ScopeActorTypes,
  UnifiedType,
  useBasketBilling,
  useClientCompanies,
  useClientPhones
} from "@upmind-automation/headless";
import type { CompanyModel, PhoneModel } from "@upmind-automation/headless";

declare const phoneModel: PhoneModel;
declare const companyModel: CompanyModel;
declare const model: { company: CompanyModel; phone: PhoneModel };

// ❌ Wrong — a separate phone create for a business detail
await useClientPhones()
  .as(ScopeActorTypes.SELF)
  .useActions()
  .ensure(phoneModel);
await useClientCompanies()
  .as(ScopeActorTypes.CLIENT)
  .useActions()
  .ensure(companyModel);

// ✅ Correct — let the unified `update()` fold the phone into the company create
await useBasketBilling()
  .useUnifiedBillingDetail(UnifiedType.BUSINESS)
  .update(model);
```

**Test scenario:** create a business billing detail with a phone via `useUnifiedBillingDetail`. Confirm exactly one phone create fires (carried inline on the company create), not two.

---

## Common Mistakes

### Reading the selection immediately after mount

The billing surface is populated by the basket it hangs off. Reading `model` before the basket (and therefore billing) has finished loading returns an empty or stale selection, not the committed one.

### Assuming address/company/phone are all required

Only an address is ever required by this module's own model. Company, phone, and region are each independently gated by their own brand flag — a detail valid for one brand can be incomplete for another.

---

## Edge Cases

| Scenario                                | Expected Behavior                                                                 | Notes                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Guest (unclaimed) basket loads          | Basket reaches shopping-ready; billing never becomes available                    | No `client_id` on the basket — the spawn condition never fires.                        |
| Basket belongs to a different client    | Load is denied (real `403`); billing never becomes available                      | The denial is on the basket load, not on billing.                                      |
| Commit with no address set              | No request is sent; the caller sees an "address not available" failure            | The commit is blocked client-side before the wire.                                     |
| Commit succeeds                         | Full order object returned, tax recomputed                                        | Diff pre/post state if you need "what changed" — the platform gives no change pointer. |
| Commit fails with `5xx`                 | Error surfaced on the billing context; the basket keeps its prior selection       | Proven against a forced `5xx` on the same commit endpoint.                             |
| Brand-config bootstrap fails with `5xx` | The billing surface fails closed — never reaches available, never offers a schema | Rather than hanging, it settles into a handled failure state.                          |

---

## Lifecycle Considerations

### Wait for Ready State — but only on a claimed basket

Before performing operations, confirm the basket is claimed, then wait for billing to be ready:

```typescript
import { useBasket, useBasketBilling } from "@upmind-automation/headless";

if (useBasket().context.value?.basket?.client_id) {
  await useBasketBilling().isReady();
}
```

### Stop the unified "new billing detail" service when done

`useUnifiedBillingDetail()` starts its own machine instance; call `stop()` when the new-detail form is dismissed:

```typescript
import { UnifiedType, useBasketBilling } from "@upmind-automation/headless";
import { onUnmounted } from "vue";

const detail = useBasketBilling().useUnifiedBillingDetail(UnifiedType.PERSONAL);
onUnmounted(() => detail.stop());
```
