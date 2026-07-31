# client-phone-dry Usage & API

API reference for `useClientPhonesDry`. All examples are copy-paste ready.

> **Smoke-test module.** This is a factory validation build, not the module other code in this repo consumes today (`client-phone/` is). See [README.md](./README.md) before wiring this into a component.

## Getting an instance

```typescript
import {
  useClientPhonesDry,
  ScopeActorTypes
} from "@upmind-automation/headless";

const mine = useClientPhonesDry().as(ScopeActorTypes.SELF); // the active session's own client
const asStaff = useClientPhonesDry()
  .as(ScopeActorTypes.STAFF)
  .for("client", targetClientId); // staff acting on a named client
```

Optionally chain `.inBrand(brandId)` to seed a new phone's country from a brand — see [gotchas.md](./gotchas.md) §2 for the one limitation on this.

Each instance returns four sub-composables: `useContext()`, `useMeta()`, `useActions()`, `useInternals()`.

## Context — `useContext()`

| Property              | Type                                                          | What it is                                                    |
| --------------------- | ------------------------------------------------------------- | ------------------------------------------------------------- |
| `data`                | `Phone[]`                                                     | the reactive list (always an array, even before load)         |
| `default`             | `Phone \| undefined`                                          | the client's default phone, if any                            |
| `error`               | list query's current error, if any                            |
| `findOne` / `getOne`  | finders over `data` — by partial match / by id                |
| `lookups`             | `{ country }` — the country used to seed/format the add form  |
| `model`               | `PhoneModel`                                                  | new-phone form seed (country per D3, `type` defaulted)        |
| `pagination`          | reactive pagination descriptor                                |
| `schema` / `uischema` | the add/edit form's JSON Schema / UI Schema (`type` required) |
| `isStaged(phone)`     | `boolean`                                                     | true for a staged-import row                                  |
| `canEdit(phone)`      | `boolean`                                                     | false while `isStaged(phone)` — gates edit/set-default/delete |

```typescript
const { data, default: defaultPhone, isStaged, canEdit } = mine.useContext();

const staged = data.value.filter(isStaged);
const editable = data.value.filter(canEdit);
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

## Actions — `useActions()`

### `add(model)`, `update(id, model)`, `remove(id)`, `setDefault(id)`

```typescript
const { add, update, remove, setDefault } = mine.useActions();

await add({
  type: 1, // required — 1 mobile / 2 home / 3 office / 4 personal
  phone: {
    number: "+15559876543",
    nationalNumber: "5559876543",
    countryCallingCode: "1",
    country: "US"
  }
});

await update(phoneId, {
  type: 2,
  phone: {
    /* ... */
  }
});
await setDefault(phoneId);
await remove(phoneId);
```

`update`/`setDefault`/`remove` silently resolve `undefined` (no request issued) when the target phone is a staged-import row (`canEdit(phone) === false`); `remove` additionally no-ops when `meta.canDelete` is false. Neither case throws — check `canEdit`/`meta.canDelete` before assuming the call did something.

> **Staff scope — these are capability-conditional.** On `.as('staff').for('client', id)`, each of `add`/`update`/`setDefault`/`remove`/`refresh`/`ensure` is present only when the staff session carries the matching capability code. **On the unmodified prod path today, every staff session resolves zero capabilities** (a pending `session-store` field, not this module's logic — see [gotchas.md](./gotchas.md) §1), so **every one of these is `undefined` for staff today**. Always check before calling:
>
> ```typescript
> const staffActions = asStaff.useActions();
> if (staffActions.remove) {
>   await staffActions.remove(phoneId);
> } else {
>   // capability absent (or, today, always — see the gotcha above)
> }
> ```

### `ensure(model)`

Find-or-create: returns the matching existing phone if one is found, otherwise creates it. On the staff scope this is gated identically to `add` (`create_client_phone`) — a granted `ensure()` still lands on the correct target client, because it composes over the same retargeted `loadList`/`add` the staff arm resolved.

```typescript
const phone = await mine.useActions().ensure({
  type: 1,
  phone: {
    number: "+15559876543",
    nationalNumber: "5559876543",
    countryCallingCode: "1",
    country: "US"
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

`refresh` is capability-conditional on the staff scope (`list_client_phones`) — same caveat as above.

### `parse(formContext, data)` / `validate(formContext)`

```typescript
const { parse, validate } = mine.useActions();

const { model, country } = await parse({ schema, country }, rawFormData);
const validated = await validate({ schema, model }); // rejects with field errors on failure
```

### `filters.query(value)`

```typescript
mine.useActions().filters.query("555-1234"); // filters the list query
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

`service` is the raw, **ungated** service object — it bypasses the staff capability gate by design (an advanced-access escape hatch, consistent with every other scoped module in this codebase). See [gotchas.md](./gotchas.md) §4.

## Vue component integration

```vue
<template>
  <div v-if="isLoading">Loading...</div>
  <div v-else-if="isError">{{ error }}</div>
  <ul v-else>
    <li v-for="phone in data" :key="phone.id">
      {{ phone.title }}
      <button :disabled="!canEdit(phone)" @click="remove(phone.id)">
        Remove
      </button>
    </li>
  </ul>
</template>

<script setup>
import {
  useClientPhonesDry,
  ScopeActorTypes
} from "@upmind-automation/headless";

const phones = useClientPhonesDry().as(ScopeActorTypes.SELF);
const { data, error, canEdit } = phones.useContext();
const { isLoading, isError } = phones.useMeta();
const { remove } = phones.useActions();
</script>
```

## Schema-driven form integration

```vue
<script setup>
import { usePhoneSchema, usePhoneUischema } from "@upmind-automation/headless";

const schema = usePhoneSchema({ country });
const uischema = usePhoneUischema();
</script>
```

`usePhoneSchema`/`usePhoneUischema` are exported from the barrel for reuse outside a live collection instance — the same schema the collection's own `useContext().schema` computes.
