# basket-billing Usage & API

## Composable Structure

`useBasketBilling()` is a flat composable — it does not split into `useMeta()` / `useContext()` / `useActions()` sub-composables. Every value and method is returned directly:

```typescript
import { useBasketBilling } from "@upmind-automation/headless";

const billing = useBasketBilling();

const { model, schema, uischema, config, errors, meta } = billing;
const { set, update, clear, wait, isReady, captureInitialBilling } = billing;
```

A second, independent composable — `useUnified()`, aliased on the return value as `useUnifiedBillingDetail` — manages the separate "create a new billing detail" form:

```typescript
const { useUnifiedBillingDetail } = useBasketBilling();
const detail = useUnifiedBillingDetail("business", { clientId });
```

## Lifecycle

```typescript
const billing = useBasketBilling();

// Wait until the actor has finished loading (resolves `false` on error).
const ready = await billing.isReady();
```

`isReady()` only resolves once the billing surface has actually come into existence. It never resolves for a basket with no owning client — see [gotchas.md](./gotchas.md).

## Actions

### Set vs. commit

```typescript
const { set, update } = useBasketBilling();

// Stores the model on the form. No request is made.
set({ addressId: "addr-1", companyId: null, phoneId: null });

// Commits the current (or a passed) model. Resolves once the order settles,
// rejects with the update error on failure.
await update({ addressId: "addr-1", companyId: null, phoneId: null });
```

### Clear and pause/resume

```typescript
const { clear, wait } = useBasketBilling();

// Discards the stored model.
clear();

// Pauses validation (e.g. while a new address is being created elsewhere),
// then resumes and re-checks. Resolves `true` if the resumed state is an error.
await wait(true);
await wait(false);
```

### Snapshot the last-saved selection

```typescript
const { captureInitialBilling } = useBasketBilling();

// Reads the last committed selection as a stable snapshot. Call once,
// after `isReady()` resolves, and hold the result locally — the billing
// surface is shared, so re-reading it later can return a different value.
const initial = captureInitialBilling();
```

## Meta (State Flags)

`meta` is a Vue `ComputedRef`:

```typescript
const { meta } = useBasketBilling();

meta.value.isLoading;    // still loading
meta.value.isAvailable;  // loaded and usable
meta.value.hasErrors;    // last operation failed
meta.value.isProcessing; // a commit is in flight
meta.value.isValid;      // current model passes validation
meta.value.isComplete;   // the last commit finished
meta.value.isDirty;      // model differs from the last saved selection
meta.value.needsAddress; // brand requires an address
meta.value.needsCompany; // brand requires a company
meta.value.needsPhone;   // brand requires a phone
```

| Flag | Description |
|------|-------------|
| `isLoading` | Requirement flags and schema are still loading. |
| `isAvailable` | The billing surface has loaded and is usable. |
| `hasErrors` | The last operation (load or commit) failed. |
| `isProcessing` | A commit is in flight. |
| `isValid` | The current model passes the brand's requirement rules. |
| `isComplete` | The last commit has finished settling. |
| `isDirty` | The current model differs from the last committed selection. |
| `needsAddress` / `needsCompany` / `needsPhone` | Which fields the brand requires. |

## Context (Computed Values)

```typescript
const { context, model, schema, uischema, errors, config } = useBasketBilling();

context.value; // the full billing context
model.value;   // { addressId?, companyId?, phoneId? }
schema.value;  // JSON Schema for the billing form
uischema.value;// UI layout schema for the billing form
config.value;  // { requiresPhone, requiresCompany, requiresAddress }
errors.value;  // the last billing error, if any
```

| Value | Type | Description |
|-------|------|-------------|
| `model` | `BillingModel` | `{ addressId?, companyId?, phoneId? }` |
| `schema` | `JsonSchema` | JSON Schema for the billing form, shaped by the brand's requirement flags. |
| `uischema` | `UISchemaElement` | UI layout schema, in step with the same requirement flags. |
| `config` | `{ requiresPhone, requiresCompany, requiresAddress }` | The resolved requirement flags. |
| `errors` | `ResponseError \| undefined` | The last error from a load or a commit. |

## Vue Component Integration

```vue
<template>
  <div v-if="meta.isLoading">Loading…</div>
  <div v-else-if="meta.hasErrors">{{ errors?.message }}</div>
  <div v-else>
    <SchemaForm :schema="schema" :layout="uischema" :data="model" @change="onChange" />
    <button :disabled="!meta.isValid || meta.isProcessing" @click="submit">
      Save billing details
    </button>
  </div>
</template>

<script setup>
import { useBasketBilling } from "@upmind-automation/headless";

const { model, schema, uischema, meta, errors, set, update } = useBasketBilling();

function onChange({ data }) {
  set(data);
}

async function submit() {
  await update(model.value);
}
</script>
```

## Creating a New Billing Detail

```typescript
const { useUnifiedBillingDetail } = useBasketBilling();

const detail = useUnifiedBillingDetail("personal");

await detail.isReady();

const model = await detail.input({
  address: { address1: "1 High Street", city: "London", countryId: "gb" }
});

const saved = await detail.update(model);
```

`useUnifiedBillingDetail("business", { clientId })` prepares a business detail instead — a company record that carries its own address and phone inline. See [foundation.md](./foundation.md) for the full request/response shapes.
