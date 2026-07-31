# client-address-dry Usage & API

API reference for `useClientAddressesDry`. All examples are copy-paste ready.

> **Smoke-test module.** This is a factory validation build, not the module other code in this repo consumes today (`client-address/` is). See [README.md](./README.md) before wiring this into a component.

## Getting an instance

```typescript
import {
  useClientAddressesDry,
  ScopeActorTypes
} from "@upmind-automation/headless";

const mine = useClientAddressesDry().as(ScopeActorTypes.SELF); // the active session's own client
const asStaff = useClientAddressesDry()
  .as(ScopeActorTypes.STAFF)
  .for("client", targetClientId); // staff acting on a named client
```

A staff member acting as a client during an impersonation session also uses `.as(ScopeActorTypes.SELF)` — the impersonation session's own token is what makes the request go out as that client; there is no separate call shape for it.

Each instance returns four sub-composables: `useContext()`, `useMeta()`, `useActions()`, `useInternals()`.

## Context — `useContext()`

| Property              | Type                              | What it is                                                                                                   |
| --------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `data`                | `Address[]`                       | the reactive list (always an array, even before load)                                                        |
| `default`             | `Address \| undefined`            | the client's default address, if any                                                                         |
| `error`               | —                                 | the list query's current error, if any                                                                       |
| `findOne` / `getOne`  | —                                 | finders over `data` — by partial match / by id                                                               |
| `lookups`             | `{ countries, regions, country }` | the country/region options used to seed/format the add form                                                  |
| `model`               | `AddressModel`                    | new-address form seed (`type` defaulted)                                                                     |
| `pagination`          | —                                 | reactive pagination descriptor                                                                               |
| `schema` / `uischema` | —                                 | the add/edit form's JSON Schema / UI Schema (`type` required; `regionId` required when the brand demands it) |

```typescript
const { data, default: defaultAddress, findOne, getOne } = mine.useContext();

const found = findOne({ postcode: "FX1 1FX" });
```

## Meta — `useMeta()`

All flags are reactive computeds.

| Flag              | True when                                                     |
| ----------------- | ------------------------------------------------------------- |
| `isLoading`       | the list is loading, or has not completed its first fetch     |
| `isError`         | the list query resolved with an error                         |
| `isEmpty`         | the collection has no items                                   |
| `isAvailable`     | the list has fetched without error, for this scope's identity |
| `isAuthenticated` | alias of `isAvailable`                                        |

### Staff-only permission flags

| Flag        | True when                                                            |
| ----------- | -------------------------------------------------------------------- |
| `canList`   | the staff session may (re)issue the retargeted admin list read       |
| `canCreate` | the staff session may create an address for this client              |
| `canUpdate` | the staff session may edit or set-default an address for this client |
| `canDelete` | the staff session may remove an address for this client              |

On a client scope (including a staff member acting as a client), all four are `undefined` — not `false`, and not omitted from the object. On a staff scope, all four read `false` on an unmodified session today — see [gotchas.md](./gotchas.md) §1.

```typescript
const { canDelete } = asStaff.useMeta();

if (canDelete) {
  // show a delete control
}
```

## Actions — `useActions()`

### `add(model)`, `update(id, model)`, `remove(id)`, `setDefault(id)`

```typescript
const { add, update, remove, setDefault } = mine.useActions();

await add({
  type: 1, // required — 1 Home / 2 Office / 3 Holiday / 4 Company
  address: {
    address1: "1 Fixture Street",
    city: "Fixture City",
    postcode: "FX1 1FX",
    countryId: "country-1",
    regionId: "region-1" // required when the brand's region-required option is on
  }
});

await update(addressId, {
  type: 2,
  address: {
    /* ... */
  }
});
await setDefault(addressId);
await remove(addressId);
```

`remove` silently resolves `undefined` (no request issued) when the target address's own delete-eligibility flag is false. It does not throw — check the address before assuming the call did something.

> **Staff scope — these are permission-conditional.** On `.as('staff').for('client', id)`, each of `add`/`update`/`setDefault`/`remove`/`refresh`/`ensure` is present only when the staff session carries the matching permission code. **On an unmodified session today, every staff session resolves all four permission codes to absent** (a pending session-store field, not this module's own logic — see [gotchas.md](./gotchas.md) §1), so every one of these is `undefined` for staff today. Always check before calling, or read the equivalent flag off `useMeta()` first:
>
> ```typescript
> const staffActions = asStaff.useActions();
> if (staffActions.remove) {
>   await staffActions.remove(addressId);
> } else {
>   // permission absent for this session
> }
> ```

### `ensure(model)`

Find-or-create: returns the matching existing address if one is found (matched by id, when supplied), otherwise creates it. On the staff scope this is gated identically to `add` — a granted `ensure()` still lands on the correct target client, because it composes over the same retargeted list/add the staff arm resolved.

```typescript
const address = await mine.useActions().ensure({
  type: 1,
  address: {
    address1: "1 Fixture Street",
    city: "Fixture City",
    postcode: "FX1 1FX",
    countryId: "country-1"
  }
});
```

### `refresh()`, `nextPage()`, `prevPage()`, `invalidate()`

```typescript
const { refresh, nextPage, prevPage, invalidate } = mine.useActions();

await refresh(); // refetch the list from the server
nextPage();
prevPage();
invalidate(); // drop the cached query for this scope
```

`refresh` is permission-conditional on the staff scope (requires the list permission) — same caveat as above.

### `parse(formContext, data)` / `validate(formContext)`

```typescript
const { parse, validate } = mine.useActions();

const { model } = await parse({ schema, regions, country }, rawFormData);
const validated = await validate({ schema, model }); // rejects with field errors on failure
```

### `filters.query(value)`

```typescript
mine.useActions().filters.query("Fixture City"); // filters the list query
```

### `destroy()`

Removes this scoped instance from the registry. Call on component unmount.

```typescript
onUnmounted(() => mine.useActions().destroy());
```

### `isReady()`

```typescript
const ready = await mine.useActions().isReady(); // true once the list has fetched without error
```

## Internals — `useInternals()`

```typescript
const { actorScope, query, service, queryKey } = mine.useInternals();
```

`service` is the raw, **ungated** service object — it bypasses the staff permission gate by design (an advanced-access escape hatch, consistent with every other scoped module in this codebase). See [gotchas.md](./gotchas.md) §3.

## Vue component integration

```vue
<template>
  <div v-if="isLoading">Loading...</div>
  <div v-else-if="isError">{{ error }}</div>
  <ul v-else>
    <li v-for="address in data" :key="address.id">
      {{ address.title }}
      <button @click="remove(address.id)">Remove</button>
    </li>
  </ul>
</template>

<script setup>
import {
  useClientAddressesDry,
  ScopeActorTypes
} from "@upmind-automation/headless";

const addresses = useClientAddressesDry().as(ScopeActorTypes.SELF);
const { data, error } = addresses.useContext();
const { isLoading, isError } = addresses.useMeta();
const { remove } = addresses.useActions();
</script>
```

## Schema-driven form integration

```vue
<script setup>
import {
  useAddressSchema,
  useAddressUischema
} from "@upmind-automation/headless";

const schema = useAddressSchema({ countries, regions, requireRegion });
const uischema = useAddressUischema();
</script>
```

`useAddressSchema`/`useAddressUischema` are exported from the barrel for reuse outside a live collection instance — the same schema the collection's own `useContext().schema` computes.
