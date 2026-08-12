# client-personal-details — Usage

Full API reference for the module's two composables:

- **`usePersonalDetails`** — the read view. Reads the calling client's own profile, including their custom field values.
- **`usePersonalDetailsManager`** — the editor. Opens the profile in a validated form and saves only what changed.

Both usually act on the calling client's own profile — the target is always an explicit entity id, not validated locally against who is calling. Every capability below carries a 🧪 **For Testers** expected-behaviour statement.

## Getting an instance

```ts
import {
  usePersonalDetails,
  usePersonalDetailsManager,
  ScopeActorTypes,
  ClientPersonalDetailsContextTypes
} from "@upmind-automation/headless";

// The read view — the calling client's own profile
const profile = usePersonalDetails().as(ScopeActorTypes.SELF);

// The editor — callable bare; a client has exactly one profile
const manager = usePersonalDetailsManager().as(ScopeActorTypes.SELF);

// Either composable can instead address a NAMED entity id — see below
const otherProfile = usePersonalDetails()
  .as(ScopeActorTypes.CLIENT)
  .for(ClientPersonalDetailsContextTypes.PROFILE, someClientId);
```

> **🧪 For Testers:** The only actor that resolves on either composable is `client` — `.as(ScopeActorTypes.SELF)` resolves to it too, via the scope builder, before either matrix is even consulted. `staff` and `guest` are compile-time errors, not runtime failures — there is nothing in this module for a staff member or a guest to act at all. That is narrower than "no other profile is ever reachable": naming a different client's id in `.for(...)` compiles and addresses that client's own resource, on the caller's own session bearer, with no local check that the id matches the caller. See [gotchas.md](./gotchas.md).

Both composables return the same four sub-composables:

| Layer     | Access            | Read view contains                                 | Editor contains                                       |
| --------- | ----------------- | -------------------------------------------------- | ----------------------------------------------------- |
| Actions   | `.useActions()`   | readiness, refresh, lifecycle                      | form input, save, revert, clear, narrowing, lifecycle |
| Context   | `.useContext()`   | the display list, raw custom field values, lookups | model, base model, schema, uischema, errors           |
| Meta      | `.useMeta()`      | four state flags                                   | eight state flags                                     |
| Internals | `.useInternals()` | the raw query                                      | the raw machine state and sender                      |

---

## The read view — `usePersonalDetails`

### Read actions — `useActions()`

#### `isReady()` — waiting for the profile

Resolves once the profile is ready to read.

**Returns:** `Promise<boolean>` — `true` once the first fetch has settled without error; `false` if the session settles unaddressable, or the fetch itself errors. Never hangs.

#### `refresh()`

Forces a re-read of the profile from the server.

**Returns:** `Promise<void>`.

**Throws:** `NotAuthenticatedError` when the scope cannot address a client.

#### `destroy()`

Removes this scoped instance from the registry.

**Returns:** `void`.

### Read context — `useContext()`

| Property       | Type                                                                                                                      | Meaning                                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `data`         | `ComputedRef<ProfileField[]>`                                                                                             | Native fields, then custom field values, projected for display — the language row shows the resolved name, never the raw id |
| `customFields` | `ComputedRef<ICustomFieldValue[]>` — `ICustomFieldValue` is from `@upmind-automation/types`, not this module's own barrel | The client's own raw custom field values, each carrying its own embedded definition                                         |
| `error`        | `ComputedRef<ResponseError \| undefined>`                                                                                 | The read's own captured error — read, never raised                                                                          |
| `findOne()`    | `(mapping, data?) => ProfileField \| undefined`                                                                           | Finds one display field by a partial mapping                                                                                |
| `getOne(id)`   | `(id, data?) => ProfileField \| undefined`                                                                                | Finds one display field by id                                                                                               |

> **🧪 For Testers:** `customFields` is the raw client record's own values — use it when you need the value's own embedded definition without going through the display projection. `data`'s language row shows the resolved language NAME; the raw id lives on `customFields`/the editor's model, never here.

### Read meta — `useMeta()`

| Flag          | True when                                                           |
| ------------- | ------------------------------------------------------------------- |
| `hasError`    | The profile read failed                                             |
| `isAvailable` | The session is authenticated **and** the scope resolved a client id |
| `isEmpty`     | The profile read has not yet returned any fields                    |
| `isLoading`   | The read is loading or has not completed its first fetch            |

### Read internals — `useInternals()`

| Property     | Meaning                               |
| ------------ | ------------------------------------- |
| `actorScope` | The resolved actor for this instance  |
| `query`      | The raw query object backing the read |

---

## The editor — `usePersonalDetailsManager`

```ts
const manager = usePersonalDetailsManager().as(ScopeActorTypes.SELF);

await manager.useActions().isReady();
await manager.useActions().update({ firstName: "New" });
```

### Editor actions — `useActions()`

#### `isReady()` — waiting for the form

Resolves when the form is available for input.

**Returns:** `Promise<boolean>` — `true` once available; `false` on error or after a bounded 30-second timeout. **Never `Infinity`** — a failed lookup settles this to `false` rather than hanging the caller forever.

#### `input(model)`

Feeds a model into the form. Debounced — rapid calls collapse into one parse.

| Param   | Type                                      | Required |
| ------- | ----------------------------------------- | -------- |
| `model` | `ProfileModel \| Record<string, unknown>` | Yes      |

**Returns:** `Promise<ProfileModel>` — the parsed model, after validation has run.

> **🧪 For Testers:** An out-of-schema key in the input is silently dropped from the parsed model — this is real parsing, not a pass-through. Setting a field to `""` or leaving a custom field code out entirely are treated differently: an explicit clear survives the parse round trip as `""` (native) or `null` (custom field); a key never mentioned is left untouched.

#### `update(value?)`

Saves the current model — or the one you pass — and resolves the persisted model. Diff-only: only fields that changed since the base model are sent.

| Param   | Type                                      | Required |
| ------- | ----------------------------------------- | -------- |
| `value` | `ProfileModel \| Record<string, unknown>` | No       |

**Returns:** `Promise<ProfileModel>` — the persisted model.

**Rejects:** with a `DetailedError` carrying the underlying failure.

> **🧪 For Testers:** Calling `update()` with nothing dirty resolves successfully with **zero** requests. Clearing a native field produces a body with that key as `""`; clearing a custom field produces a body with that key as `null` — both keys are present, never omitted. A dirty IMAGE custom field is uploaded and resolved to its hash **before** this save's own request is issued — the save never sends a pending file.

#### `revert()`

Restores the model to its persisted base model. Not a machine-level "undo" — it is a form input carrying the base model back through the same validation path a normal edit takes.

**Returns:** `Promise<ProfileModel>`.

> **🧪 For Testers:** After two dirty edits, `revert()` leaves the model deep-equal to the base model and `isDirty` false.

#### `clear()`

Clears the current form context back to its starting state.

**Returns:** `void`.

#### `filterFields(fields)`

Retargets which fields the editor exposes — rebuilds the schema and form definition to only the named fields.

| Param    | Type       | Required |
| -------- | ---------- | -------- |
| `fields` | `string[]` | Yes      |

**Returns:** `void`.

> **🧪 For Testers:** Call this once, right after construction, before `await isReady()` — it re-enters the loading phase to rebuild the schema against the new narrowing.

#### `onDone()`

Resolves once a save has completed.

**Returns:** `Promise<boolean>`.

#### `stop()` — pausing the editor

Stops the underlying machine, leaving the registry entry in place.

**Returns:** `void`.

#### `destroy()` — releasing the editor

Stops the machine **and** removes it from the registry.

**Returns:** `void`.

### Editor context — `useContext()`

| Property           | Type                                        | Meaning                                                                                 |
| ------------------ | ------------------------------------------- | --------------------------------------------------------------------------------------- |
| `context`          | `ComputedRef<ProfileContext \| undefined>`  | The full editor context object                                                          |
| `model`            | `ComputedRef<ProfileModel \| undefined>`    | The current form model                                                                  |
| `baseModel`        | `ComputedRef<ProfileModel \| undefined>`    | The persisted baseline `revert()` restores to                                           |
| `schema`           | `ComputedRef<JsonSchema \| undefined>`      | The form's JSON schema — consumes the sibling module's own custom-field schema contract |
| `uischema`         | `ComputedRef<UISchemaElement \| undefined>` | The form's UI definition, paired with `schema`                                          |
| `fields`           | `ComputedRef<CustomField[]>`                | The custom field definitions this scope's lookups resolved                              |
| `id`               | `ComputedRef<string \| undefined>`          | The id of the profile being managed — the owning client's own id                        |
| `title`            | `ComputedRef<string \| undefined>`          | Display title                                                                           |
| `errors`           | `ComputedRef<string \| undefined>`          | Machine-captured error message — read, never raised                                     |
| `validationErrors` | `ComputedRef<ErrorObject[] \| undefined>`   | Field-level validation errors (AJV shape) — read, never raised                          |

> **🧪 For Testers:** `errors` and `validationErrors` are state, never events. A rejected save lands here and stays readable until the next operation supersedes it.

### Editor meta — `useMeta()`

| Flag           | True when                                                         |
| -------------- | ----------------------------------------------------------------- |
| `hasErrors`    | The editor captured an error                                      |
| `isAvailable`  | The form is available for input                                   |
| `isComplete`   | The profile has been saved                                        |
| `isDirty`      | The model differs from its persisted baseline                     |
| `isLoading`    | The editor is waiting for its client id, or resolving its lookups |
| `isProcessing` | A save is in flight                                               |
| `isValid`      | The current model passes schema validation                        |
| `showErrors`   | A validation error exists **and** the form has been touched       |

> **🧪 For Testers:** `isLoading` includes the phase where the editor is waiting for its client id to resolve — that state is loading, not broken.

### Editor internals — `useInternals()`

| Property     | Meaning                              |
| ------------ | ------------------------------------ |
| `actorScope` | The resolved actor for this instance |
| `send`       | The raw event sender                 |
| `service`    | The raw underlying service           |
| `state`      | The raw reactive state               |

---

## The form definition — paste-ready

The editor serves its form definition at runtime through **`usePersonalDetailsManager().useContext().schema`** and **`.uischema`**. The four native controls are this module's own; the `customFields` sub-schema and its controls are the sibling custom-fields module's contract, consumed rather than re-derived.

The two blocks below are that same pair rendered as plain JSON, built from the two real custom field definitions this environment has (`age`, a NUMBER field; `profile_picture`, an IMAGE field). Paste them into [jsonforms.io](https://jsonforms.io/examples/basic) — schema on the left, UI schema on the right — to see the rendered form.

### Schema

```json
{
  "type": "object",
  "required": [],
  "properties": {
    "firstName": { "type": ["string", "null"] },
    "lastName": { "type": ["string", "null"] },
    "publicName": { "type": ["string", "null"] },
    "language": {
      "type": ["string", "null"],
      "enum": ["<language-id-1>", "<language-id-2>"],
      "options": [
        { "label": "English", "value": "<language-id-1>" },
        { "label": "French", "value": "<language-id-2>" }
      ]
    },
    "customFields": {
      "type": "object",
      "title": "Fields",
      "required": [],
      "properties": {
        "age": { "type": ["number", "null"], "title": "Age" },
        "profile_picture": {
          "type": ["string", "null"],
          "title": "Profile Picture"
        }
      }
    }
  }
}
```

### UI schema

```json
{
  "type": "VerticalLayout",
  "elements": [
    {
      "type": "Control",
      "scope": "#/properties/firstName",
      "i18n": "form.first_name"
    },
    {
      "type": "Control",
      "scope": "#/properties/lastName",
      "i18n": "form.last_name"
    },
    {
      "type": "Control",
      "scope": "#/properties/publicName",
      "i18n": "form.public_name"
    },
    {
      "type": "Control",
      "scope": "#/properties/language",
      "i18n": "form.language"
    },
    {
      "type": "Control",
      "scope": "#/properties/customFields/properties/age",
      "i18n": "fields.age",
      "options": { "label": "Age", "multi": false, "type": "string" }
    },
    {
      "type": "Control",
      "scope": "#/properties/customFields/properties/profile_picture",
      "i18n": "fields.profile_picture",
      "options": {
        "label": "Profile Picture",
        "multi": false,
        "type": "image",
        "field": {
          "field_id": "<profile-picture-field-id>",
          "field_type": "client_custom_field",
          "field_is_default": false
        }
      }
    }
  ]
}
```

### Starting data

The editor's baseline model — what an untouched form holds before a key is pressed:

```json
{
  "firstName": null,
  "lastName": null,
  "publicName": null,
  "language": null,
  "customFields": {}
}
```

Notes for the paste:

- **`age`'s control renders with `options.type: "string"`, not `"number"`.** The shared control-definition generator this contract consumes has a case for the wire label `"image"` but none for `"number"` — a NUMBER field's control falls through to that generator's own generic default. This is a live instance of the sibling module's own discriminator gotcha (see its [gotchas.md](../../client-custom-fields/docs/gotchas.md#5-the-numeric-type-is-the-only-safe-discriminator--the-string-label-can-silently-fall-through)), not a defect introduced here — the field still reads and writes correctly as a number; only the generated control's own `type` hint is affected.
- **The language control's enum/options pair is brand-specific** — the two values shown are illustrative; a real paste uses the target client's own brand's language list.
- **The pair moves together.** A schema field with no matching control renders as a required-but-invisible input, which is why these two blocks are never edited apart.

> **🧪 For Testers:** The barrel exposes no bare `useSchema` / `useUischema`. The only supported way to obtain the form definition is the editor's context — a consumer reaching for a bare export is reaching for something the module does not offer.

---

## Errors are state, never announcements

```ts
// Read view
const { error } = profile.useContext();
const { hasError } = profile.useMeta();

// Editor
const { errors, validationErrors } = manager.useContext();
const { hasErrors } = manager.useMeta();

// Success signal for the editor
await manager.useActions().onDone();
```

## Types

```ts
import {
  usePersonalDetails,
  usePersonalDetailsManager,
  PERSONAL_DETAILS_SCOPE_MATRIX,
  ClientPersonalDetailsContextTypes,
  type UsePersonalDetails,
  type UsePersonalDetailsActions,
  type UsePersonalDetailsContext,
  type UsePersonalDetailsMeta,
  type UsePersonalDetailsInternals,
  type UsePersonalDetailsManager,
  type UsePersonalDetailsManagerActions,
  type UsePersonalDetailsManagerContext,
  type UsePersonalDetailsManagerMeta,
  type UsePersonalDetailsManagerInternals,
  type PersonalDetailsScopeMatrix,
  type ProfileContext,
  type ProfileField,
  type ProfileModel,
  type ProfileRecord
} from "@upmind-automation/headless";
```

That list is the module's whole public surface. The services, mappers, schemas, and the machine-config file are internal and are not exported — see [gotchas.md](./gotchas.md).
