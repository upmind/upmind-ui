# client-custom-fields — Usage

Full API reference for the module's two composables:

- **`useClientCustomFields`** — the definitions collection. Read a brand's client custom field definitions and act on them (filter, resolve, aggregate image-flush).
- **`useClientCustomFieldImage`** — the per-field IMAGE value editor. Upload, clear, and preview the stored image for one field.

Both usually act on the calling client's own brand / field — the target is always an explicit entity id, not validated locally against who is calling. Every capability below carries a 🧪 **For Testers** expected-behaviour statement.

## Getting an instance

```ts
import {
  useClientCustomFields,
  useClientCustomFieldImage,
  ScopeActorTypes,
  ClientCustomFieldsContextTypes,
  ClientCustomFieldContextTypes
} from "@upmind-automation/headless";

// The collection — the calling client's own brand's definitions
const fields = useClientCustomFields()
  .as(ScopeActorTypes.CLIENT)
  .for(ClientCustomFieldsContextTypes.VALUES, clientId);

// The image editor — one field, by id
const image = useClientCustomFieldImage()
  .as(ScopeActorTypes.CLIENT)
  .for(ClientCustomFieldContextTypes.FIELD, fieldId);
```

> **🧪 For Testers:** The only actor that resolves on either composable is `client`. `staff` and `guest` are compile-time errors, not runtime failures — there is nothing in this module for a staff member or a guest to act at all. `.as(ScopeActorTypes.SELF)` alone works and resolves to the calling client, but chaining `.for()` off it does not typecheck on either composable — name `.as(ScopeActorTypes.CLIENT)` to reach `.for()`. Both `.as()` and `.for()` take enum members only — a bare string is a type error, not a shortcut. See [gotchas.md](./gotchas.md#2-as-and-for-take-enum-members-never-string-literals) and [gotchas.md](./gotchas.md#3-asscopeactortypesself-compiles-and-works-but-the-result-carries-no-forfresh).

Both composables return the same four sub-composables:

| Layer     | Access            | Collection contains                                         | Image editor contains                                  |
| --------- | ----------------- | ----------------------------------------------------------- | ------------------------------------------------------ |
| Actions   | `.useActions()`   | readiness, refresh, filtering, the image-flush pass-through | upload, remove, flush, lifecycle                       |
| Context   | `.useContext()`   | the reactive definitions list + lookups                     | the current value, hash, download URL, preview, errors |
| Meta      | `.useMeta()`      | five state flags                                            | five state flags                                       |
| Internals | `.useInternals()` | the raw list query                                          | the raw upload handle                                  |

---

## The definitions collection — `useClientCustomFields`

### Collection actions — `useActions()`

#### `filters.by(mapping)`

Applies (or clears, with no argument) a client-side partial-match filter over the already-loaded definitions.

| Param     | Type                   | Required |
| --------- | ---------------------- | -------- |
| `mapping` | `Partial<CustomField>` | No       |

**Returns:** `void`.

> **🧪 For Testers:** `filters.by({ typeId: 7 })` narrows `useContext().data` to matching definitions with **no** new network request — it never touches the query's own key.

#### `flushImages(model)`

Resolves every dirty (pending-upload) IMAGE value in a value set to its uploaded hash. This is the profile module's own pre-save step, exposed here because the upload capability belongs to this module.

| Param   | Type               | Required |
| ------- | ------------------ | -------- |
| `model` | `CustomFieldModel` | No       |

**Returns:** `Promise<CustomFieldModel>` — the same set, with every pending image replaced.

> **🧪 For Testers:** Given a model with one field carrying a raw `File` and another carrying an already-uploaded hash string, `flushImages()` uploads only the `File`-valued one and leaves the hash-valued one untouched — exactly one `POST` for two fields, one of which was already settled.

#### `invalidate()`

Marks this module's cached definitions stale so the next read re-fetches them.

**Returns:** `Promise<T | undefined>` — resolves with whatever it was passed, so it can be chained onto another promise.

#### `isReady()` — waiting for the definitions

Resolves once the definitions collection is ready to read.

**Returns:** `Promise<boolean>` — `true` once the first fetch has settled without error; `false` if the session settles without an addressable client, **or** if the brand read behind it fails.

> **🧪 For Testers:** `isReady()` never hangs. A definitions request that rejects, and a brand resolution that fails, both resolve `isReady()` to `false` rather than leaving it pending forever — this is the fix for a prior uncapped poll that only ever resolved on success.

#### `nextPage()` / `prevPage()`

Moves the collection to the next or previous page.

**Returns:** `void`.

> **🧪 For Testers:** The collection is unpaged by default (`limit: 0`) — the whole brand's definitions arrive in one response, and both calls are no-ops with no other page to move to.

#### `refresh()`

Forces a re-read of the definitions from the server.

**Returns:** `Promise<void>`.

**Throws:** `NotAuthenticatedError` when the scope cannot address a client.

#### `destroy()`

Removes this scoped instance from the registry.

**Returns:** `void`.

### Collection context — `useContext()`

| Property                     | Type                                           | Meaning                                                                 |
| ---------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------- |
| `data`                       | `ComputedRef<CustomField[]>`                   | The brand's definitions, filtered and ordered                           |
| `error`                      | `ComputedRef<ResponseError \| undefined>`      | The last failed mutation, else the definitions read's own error         |
| `findOne()`                  | `(mapping, data?) => CustomField \| undefined` | Finds one definition by a partial mapping                               |
| `getOne(id)`                 | `(id, data?) => CustomField \| undefined`      | Finds one definition by id                                              |
| `pagination`                 | `ComputedRef<PaginationInfo>`                  | `{ limit, total, page, pages, from, to }`                               |
| `resolveFieldByValue(value)` | `(value) => CustomField \| undefined`          | Resolves a value's definition, preferring the value's own embedded copy |

> **🧪 For Testers:** `resolveFieldByValue()` never requires this collection to have loaded when the value it is given already carries its own embedded definition — assert the definitions request count stays `0` in that case.

### Collection meta — `useMeta()`

| Flag          | True when                                                                              |
| ------------- | -------------------------------------------------------------------------------------- |
| `count`       | Always — the number of definitions this scope's brand has                              |
| `hasError`    | A mutation or the definitions read failed                                              |
| `isAvailable` | The session is authenticated **and** the scope resolved a client id **and** a brand id |
| `isEmpty`     | This scope's brand has no definitions                                                  |
| `isLoading`   | The definitions read is in flight or has not completed its first fetch                 |

`isAvailable` gates every request this module's collection issues — the flag you render and the guard the wire enforces are the same predicate.

### Collection internals — `useInternals()`

| Property     | Meaning                                           |
| ------------ | ------------------------------------------------- |
| `actorScope` | The resolved actor for this instance              |
| `query`      | The raw list-query object backing the definitions |

---

## The per-field image editor — `useClientCustomFieldImage`

```ts
const image = useClientCustomFieldImage()
  .as(ScopeActorTypes.CLIENT)
  .for(ClientCustomFieldContextTypes.FIELD, fieldId);

await image.useActions().isReady();
await image.useActions().upload(file);
```

### Image actions — `useActions()`

#### `upload(file)`

Uploads a new file for this field.

| Param  | Type   | Required |
| ------ | ------ | -------- |
| `file` | `File` | Yes      |

**Returns:** `Promise<string | undefined>` — the resulting stored hash.

> **🧪 For Testers:** `upload()` POSTs to this field's own image endpoint. On a rejection, the failure lands on `useContext().errors`, rewritten onto this field's own code — never the wire's bare `image` key.

#### `flush(value)`

Settles a value for this field: uploads it if it's a pending file, loads it for preview/download if it's already a stored hash, and resolves with the settled value either way. This is the per-field counterpart to the collection's aggregate `flushImages()`.

**Returns:** `Promise<unknown>`.

#### `remove()`

Clears this field's stored value.

**Returns:** `void`.

#### `isReady()`

Resolves once this field's identity can be addressed.

**Returns:** `Promise<boolean>` — `false` on an unaddressable scope; never hangs.

#### `destroy()`

Removes this scoped instance from the registry **and** stops the underlying upload interpreter.

**Returns:** `void`.

### Image context — `useContext()`

| Property      | Type                               | Meaning                                                                        |
| ------------- | ---------------------------------- | ------------------------------------------------------------------------------ |
| `downloadUrl` | `ComputedRef<string \| undefined>` | The resolved download URL for this field's stored image                        |
| `hash`        | `ComputedRef<string \| undefined>` | The resolved hash for this field's stored image                                |
| `preview`     | `ComputedRef<string \| undefined>` | The preview source for this field's stored image (same value as `downloadUrl`) |
| `value`       | `ComputedRef<string \| undefined>` | Alias of `hash`, for API parity with a plain value field                       |
| `errors`      | `ComputedRef<unknown>`             | The captured error's data, code-keyed — read, never raised                     |

> **🧪 For Testers:** `errors` is state, never an event. A rejected upload lands here and stays readable until the next operation supersedes it.

### Image meta — `useMeta()`

| Flag          | True when                                                                                                                                                        |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hasError`    | The upload, or a prior mutation, failed                                                                                                                          |
| `isAvailable` | This scope can address a client with a resolved field                                                                                                            |
| `isComplete`  | The current upload/load has settled successfully                                                                                                                 |
| `isUploading` | This field's upload/load is in flight                                                                                                                            |
| `progress`    | `100` once `isComplete`, else `0` — **a binary signal, not incremental**. See [gotchas.md](./gotchas.md#1-image-upload-progress-is-binary-0100-not-incremental). |

### Image internals — `useInternals()`

| Property     | Meaning                                  |
| ------------ | ---------------------------------------- |
| `actorScope` | The resolved actor for this instance     |
| `uploader`   | The raw upload handle backing this field |

---

## Value semantics — the module's pure functions

These are exported directly from the barrel; they take their inputs as plain arguments and touch no network:

```ts
import {
  mapCustomField,
  mapCustomFieldValue,
  mapCustomFieldValues,
  mapCustomFieldValuesToRequest,
  resolveFieldByValue,
  mapCustomFieldDisplay
} from "@upmind-automation/headless";
```

| Function                                          | What it does                                                                                                                 |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `mapCustomField(raw)`                             | Maps one wire definition into the view-model, at full fidelity                                                               |
| `mapCustomFieldValue(value, field)`               | Coerces a raw value to its typed form, by the field's `typeId`                                                               |
| `mapCustomFieldValues(values, fields)`            | Maps a client record's raw values into a code-keyed value record                                                             |
| `mapCustomFieldValuesToRequest(model, baseModel)` | Computes the dirty-only, code-keyed diff for a save — `""` becomes `null`; `undefined` signals an empty diff                 |
| `resolveFieldByValue(value, fields)`              | Resolves a value's definition, preferring the value's own embedded copy                                                      |
| `mapCustomFieldDisplay(value, field)`             | Read-only display projection — a SELECT's option label, a checkbox's yes/no string, or an IMAGE's `{ downloadUrl, preview }` |

> **🧪 For Testers:** `mapCustomFieldValuesToRequest(model, baseModel)` returns `undefined` — not `{}` — when nothing differs, so a caller can short-circuit and issue zero requests. It never omits a code that changed; a value cleared to an empty string is present in the output as JSON `null`.

## Errors are state, never announcements

Nothing in this module raises a toast, a notification, or any other message on your behalf. Every failure is captured where the consumer can read and render it:

```ts
// Collection
const { error } = fields.useContext();
const { hasError } = fields.useMeta();

// Image editor
const { errors } = image.useContext();
const { hasError } = image.useMeta();
```

## Types

```ts
import {
  useClientCustomFields,
  useClientCustomFieldImage,
  CLIENT_CUSTOM_FIELDS_SCOPE_MATRIX,
  ClientCustomFieldsContextTypes,
  CLIENT_CUSTOM_FIELD_IMAGE_SCOPE_MATRIX,
  ClientCustomFieldContextTypes,
  useCustomFieldsSchema,
  useCustomFieldsUischema,
  useCustomFieldsModel,
  mapCustomField,
  mapCustomFieldValue,
  mapCustomFieldValues,
  mapCustomFieldValuesToRequest,
  resolveFieldByValue,
  mapCustomFieldDisplay,
  type UseClientCustomFields,
  type UseClientCustomFieldsActions,
  type UseClientCustomFieldsContext,
  type UseClientCustomFieldsMeta,
  type UseClientCustomFieldsInternals,
  type UseClientCustomFieldImage,
  type UseClientCustomFieldImageActions,
  type UseClientCustomFieldImageContext,
  type UseClientCustomFieldImageMeta,
  type UseClientCustomFieldImageInternals,
  type ClientCustomFieldsScopeMatrix,
  type ClientCustomFieldImageScopeMatrix,
  type CustomField,
  type CustomFieldModel,
  type CustomFieldDisplay,
  type CustomFieldImageContext
} from "@upmind-automation/headless";
```

That list is the module's whole public surface. The services, mappers, and schema re-export file are internal and are not exported — see [gotchas.md](./gotchas.md).
