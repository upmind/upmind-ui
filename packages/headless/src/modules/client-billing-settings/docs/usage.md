# client-billing-settings — Usage

Full API reference for the module's two composables:

- **`useBillingSettings`** — the read view. Reads the calling client's own invoice-consolidation preference.
- **`useBillingSettingsManager`** — the editor. Opens the preference in a validated form and saves only what changed.

Both act on the calling client's own preference. Every capability below carries a 🧪 **For Testers** expected-behaviour statement.

## Getting an instance

```ts
import {
  useBillingSettings,
  useBillingSettingsManager,
  ScopeActorTypes,
  ClientBillingSettingsContextTypes
} from "@upmind-automation/headless";

const someClientId = "825d96e7-63ed-0913-46c4-174825283406";

// The read view
const settings = useBillingSettings().as(ScopeActorTypes.CLIENT);

// The editor — callable bare; a client has exactly one preference
const manager = useBillingSettingsManager().as(ScopeActorTypes.CLIENT);

// Either composable can instead retarget to a NAMED client via a matrix-gated
// .for() context — only the `client` actor may spell it
const otherSettings = useBillingSettings()
  .as(ScopeActorTypes.CLIENT)
  .for(ClientBillingSettingsContextTypes.CLIENT, someClientId);
```

> **🧪 For Testers:** Only `client` addresses a real client's preference on either composable — a bare `.as(ScopeActorTypes.STAFF)`/`.as(ScopeActorTypes.GUEST)` type-checks but falls back to the active session's own id and is refused by this module's own addressability check at runtime. `.for(ClientBillingSettingsContextTypes.CLIENT, id)` retargets to a named client and is spellable only for the `client` actor — the matrix pins `self`, `staff` and `guest` to `null as never`. See [gotchas.md](./gotchas.md#10-the-trap-was-the-contexts-name-not-for-itself--a-resource-named-member-carrying-the-clients-own-id).

Both composables return the same four sub-composables:

| Layer | Access | Read view contains | Editor contains |
| --- | --- | --- | --- |
| Actions | `.useActions()` | readiness, refresh, lifecycle | form input, save, revert, clear, external lock, lifecycle |
| Context | `.useContext()` | the preference, staged flag, captured error | model, base model, schema, errors, visibility |
| Meta | `.useMeta()` | four state flags | eleven state flags |
| Internals | `.useInternals()` | the raw query | the raw machine state and sender |

---

## The read view — `useBillingSettings`

### Read actions — `useActions()`

#### `isReady()` — waiting for the preference

Resolves once the preference is ready to read, and once the visibility gate's own fetch has settled.

**Returns:** `Promise<boolean>` — `true` once the first fetch has settled without error; `false` if the session settles unaddressable, or the fetch itself errors. Never hangs.

#### `refresh()`

Forces a re-read of the preference AND a re-check of the brand's visibility gate.

**Returns:** `Promise<void>`.

**Throws:** `NotAuthenticatedError` when the scope cannot address a client.

#### `destroy()`

Removes this scoped instance from the registry.

**Returns:** `void`.

### Read context — `useContext()`

| Property | Type | Meaning |
| --- | --- | --- |
| `data` | `ComputedRef<BillingSettingsRecord>` | The five persisted consolidation fields |
| `isStaged` | `ComputedRef<boolean>` | `true` while the addressed client record is a staged, unprocessed import |
| `error` | `ComputedRef<ResponseError \| undefined>` | The read's own captured error — read, never raised |

### Read meta — `useMeta()`

| Flag | True when |
| --- | --- |
| `hasErrors` | The preference read failed |
| `hasVisibilityError` | The brand's visibility-gate fetch failed and has not yet recovered |
| `isAvailable` | The session is authenticated **and** the scope resolved a client id |
| `isLoading` | The read is loading or has not completed its first fetch |
| `isVisible` | The brand has explicitly opted clients into this surface — defaults `false` |

> **🧪 For Testers:** `isVisible` and `hasVisibilityError` are two different flags for a reason — a failed fetch reports `hasVisibilityError: true` and `isVisible: false`, which reads identically to an explicit brand opt-out unless you check both. Recovers on the next successful `refresh()`.

### Read internals — `useInternals()`

| Property | Meaning |
| --- | --- |
| `actorScope` | The resolved actor for this instance |
| `query` | The raw query object backing the read |

---

## The editor — `useBillingSettingsManager`

```ts
import {
  ScopeActorTypes,
  useBillingSettingsManager
} from "@upmind-automation/headless";

const manager = useBillingSettingsManager().as(ScopeActorTypes.CLIENT);

await manager.useActions().isReady();
await manager.useActions().update({ enabled: 0 });
```

### Editor actions — `useActions()`

#### `isReady()` — waiting for the form

Resolves when the form is available for input.

**Returns:** `Promise<boolean>` — `true` once available; `false` on error or after a bounded 30-second timeout. **Never `Infinity`** — a failed lookup settles this to `false` rather than hanging the caller forever.

#### `input(model)`

Feeds a model into the form. Debounced — rapid calls collapse into one parse.

| Param | Type | Required |
| --- | --- | --- |
| `model` | `BillingSettingsModel \| Record<string, unknown>` | Yes |

**Returns:** `Promise<BillingSettingsModel>` — the parsed model, after validation has run.

> **🧪 For Testers:** While the editor is externally locked (`setDisabled(true)`), `input()` resolves the model UNCHANGED and sends nothing to the machine — it is a genuine no-op, not a delayed apply.

#### `update(value?)`

Saves the current model — or the one you pass — and resolves the persisted model. Diff-only: only fields that changed since the base model are sent, decided by comparing each field against the base model, never by whether the new value looks empty.

| Param | Type | Required |
| --- | --- | --- |
| `value` | `BillingSettingsModel \| Record<string, unknown>` | No |

**Returns:** `Promise<BillingSettingsModel>` — the persisted model.

**Rejects:** with a `DetailedError` carrying the underlying failure — including when the editor is externally locked, or the owning record is a staged, unprocessed import.

> **🧪 For Testers:** Setting `enabled: 0` and saving must produce an outbound body carrying the literal key `invoice_consolidation_enabled: 0` — never an omitted key. Calling `update()` with nothing dirty resolves successfully with **zero** requests.

#### `revert()`

Restores the model to its last-saved values. Not a machine-level "undo" — it is a form input carrying the base model back through the same validation path a normal edit takes.

**Returns:** `Promise<BillingSettingsModel>`.

> **🧪 For Testers:** After a dirty edit, `revert()` leaves the model deep-equal to the base model and `isDirty` false, even if a debounced `input()` call was still pending when `revert()` was called.

#### `clear()`

Clears the current form context back to its starting state.

**Returns:** `void`.

> **🧪 For Testers — a live, open gap.** Typing into the form schedules a debounced parse; calling `clear()` immediately afterward clears the model right away, but the still-pending debounced parse can fire moments later and silently repopulate the just-cleared value. `revert()` was fixed against this same race; `clear()` was not. Do not assume `clear()` is safe to call while a keystroke's debounce window may still be open.

#### `setDisabled(disabled)`

Locks or unlocks every control from OUTSIDE this module's own gates — independent of whether the record itself would otherwise allow editing.

| Param | Type | Required |
| --- | --- | --- |
| `disabled` | `boolean` | Yes |

**Returns:** `void`.

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

| Property | Type | Meaning |
| --- | --- | --- |
| `context` | `ComputedRef<BillingSettingsContext \| undefined>` | The full editor context object |
| `model` | `ComputedRef<BillingSettingsModel \| undefined>` | The current form model |
| `baseModel` | `ComputedRef<BillingSettingsModel \| undefined>` | The last-saved values `revert()` restores to |
| `schema` | `ComputedRef<JsonSchema \| undefined>` | The form's JSON schema — the five native controls |
| `uischema` | `ComputedRef<UISchemaElement \| undefined>` | The form's UI definition, paired with `schema` |
| `id` | `ComputedRef<string \| undefined>` | The id of the client whose preference is being managed |
| `title` | `ComputedRef<string \| undefined>` | Display title |
| `isStaged` | `ComputedRef<boolean>` | `true` while the owning client record is a staged, unprocessed import |
| `isVisible` | `ComputedRef<boolean>` | `true` only when the brand has explicitly opted clients into this surface |
| `errors` | `ComputedRef<string \| undefined>` | Machine-captured error message — read, never raised |
| `validationErrors` | `ComputedRef<ErrorObject[] \| undefined>` | Field-level validation errors (AJV shape) — read, never raised |

> **🧪 For Testers:** `errors` and `validationErrors` are state, never events. A rejected save lands here and stays readable until the next operation supersedes it.

### Editor meta — `useMeta()`

| Flag | True when |
| --- | --- |
| `hasErrors` | The editor captured an error |
| `isAvailable` | The form is available for input |
| `isComplete` | The preference has been saved |
| `isDirty` | The model differs from its last-saved values |
| `isEditable` | Not staged, not mid-save, and not externally locked — the combined "can I actually edit right now" flag |
| `isLoading` | The editor is waiting for its client id, or resolving its lookups |
| `isProcessing` | A save is in flight |
| `isStaged` | The owning client record is a staged, unprocessed import |
| `isValid` | The current model passes schema validation |
| `isVisible` | The brand has explicitly opted clients into this surface — defaults `false` |
| `showErrors` | A validation error exists **and** the form has been touched |

> **🧪 For Testers:** `isEditable` folds three independent gates into one flag — prefer it over reconstructing "not staged AND not processing AND not locked" yourself.

### Editor internals — `useInternals()`

| Property | Meaning |
| --- | --- |
| `actorScope` | The resolved actor for this instance |
| `send` | The raw event sender |
| `service` | The raw underlying service |
| `state` | The raw reactive state |

---

## The form definition — paste-ready

The editor serves its form definition at runtime through **`useBillingSettingsManager().useContext().schema`** and **`.uischema`**. All five controls are this module's own.

```json
{
  "type": "object",
  "required": [],
  "properties": {
    "enabled": { "type": "number", "enum": [0, 1, 2] },
    "baseRule": {
      "type": ["string", "null"],
      "enum": ["daily", "date_of_month", "day_of_week", "first_day_of_month", "last_day_of_month", null]
    },
    "dayOfWeek": {
      "type": ["string", "null"],
      "enum": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", null]
    },
    "dateOfMonthDay": { "type": ["integer", "null"], "minimum": 1, "maximum": 31 },
    "dueDateDay": { "type": ["integer", "null"], "minimum": 1, "maximum": 28 }
  }
}
```

```json
{
  "type": "VerticalLayout",
  "elements": [
    { "type": "Control", "scope": "#/properties/enabled", "i18n": "form.invoice_consolidation_enabled" },
    { "type": "Control", "scope": "#/properties/baseRule", "i18n": "form.invoice_consolidation_base_rule" },
    { "type": "Control", "scope": "#/properties/dayOfWeek", "i18n": "form.invoice_consolidation_base_rule_day_of_week" },
    { "type": "Control", "scope": "#/properties/dateOfMonthDay", "i18n": "form.invoice_consolidation_base_rule_date_of_month_day" },
    { "type": "Control", "scope": "#/properties/dueDateDay", "i18n": "form.invoice_consolidation_due_date_day" }
  ]
}
```

Paste both into [jsonforms.io](https://jsonforms.io/examples/basic) — schema on the left, UI schema on the right — to see the rendered form.

### Starting data

The editor's baseline model — what an untouched form holds before a key is pressed, seeded from the read:

```json
{
  "enabled": 1,
  "baseRule": null,
  "dayOfWeek": null,
  "dateOfMonthDay": null,
  "dueDateDay": null
}
```

> **🧪 For Testers:** The barrel exposes no bare `useSchema` / `useUischema`. The only supported way to obtain the form definition is the editor's context — a consumer reaching for a bare export is reaching for something the module does not offer.

---

## Errors are state, never announcements

```ts
import type {
  UseBillingSettings,
  UseBillingSettingsManager
} from "@upmind-automation/headless";
declare const settings: ReturnType<UseBillingSettings["fresh"]>;
declare const manager: ReturnType<UseBillingSettingsManager["fresh"]>;

// Read view
const { error } = settings.useContext();
const { hasErrors } = settings.useMeta();

// Editor
const { errors, validationErrors } = manager.useContext();
const { hasErrors: managerHasErrors } = manager.useMeta();

// Success signal for the editor
await manager.useActions().onDone();
```

## Types

```ts
import {
  useBillingSettings,
  useBillingSettingsManager,
  CLIENT_BILLING_SETTINGS_SCOPE_MATRIX,
  ClientBillingSettingsContextTypes,
  type ClientBillingSettingsScopeMatrix,
  type BillingSettingsContext,
  type BillingSettingsModel,
  type BillingSettingsRecord,
  type BillingSettingsUpdateBody,
  type UseBillingSettingsActions,
  type UseBillingSettingsContext,
  type UseBillingSettingsMeta,
  type UseBillingSettingsInternals,
  type UseBillingSettingsManagerActions,
  type UseBillingSettingsManagerContext,
  type UseBillingSettingsManagerMeta,
  type UseBillingSettingsManagerInternals
} from "@upmind-automation/headless";
```

That list is the module's whole public surface. The services, mappers, schemas, and the machine-config file are internal and are not exported — see [gotchas.md](./gotchas.md).
