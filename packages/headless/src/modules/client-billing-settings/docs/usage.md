# client-billing-settings — Usage

Full API reference for the module's one composable, **`useBillingSettings`** — it opens the calling client's own invoice-consolidation preference in a validated form and saves only what changed.

It acts on the calling client's own preference. Every capability below carries a 🧪 **For Testers** expected-behaviour statement.

## Getting an instance

```ts
import {
  useBillingSettings,
  ScopeActorTypes,
  ClientBillingSettingsContextTypes
} from "@upmind-automation/headless";

const someClientId = "825d96e7-63ed-0913-46c4-174825283406";

// The calling client's own preference — callable bare; a client has exactly one
const manager = useBillingSettings().as(ScopeActorTypes.CLIENT);

// Or retarget to a NAMED client via a matrix-gated .for() context — only the
// `client` actor may spell it
const otherSettings = useBillingSettings()
  .as(ScopeActorTypes.CLIENT)
  .for(ClientBillingSettingsContextTypes.CLIENT, someClientId);
```

> **🧪 For Testers:** Only `client` addresses a real client's preference — a bare `.as(ScopeActorTypes.STAFF)`/`.as(ScopeActorTypes.GUEST)` type-checks but falls back to the active session's own id and is refused by this module's own addressability check at runtime. `.for(ClientBillingSettingsContextTypes.CLIENT, id)` retargets to a named client and is spellable only for the `client` actor — the matrix pins `self`, `staff` and `guest` to `null as never`. See [gotchas.md](./gotchas.md#10-the-trap-was-the-contexts-name-not-for-itself--a-resource-named-member-carrying-the-clients-own-id).

The composable returns four sub-composables:

| Layer | Access | Contains |
| --- | --- | --- |
| Actions | `.useActions()` | form input, save, revert, clear, lifecycle |
| Context | `.useContext()` | model, base model, schema, errors, currency options |
| Meta | `.useMeta()` | state flags, brand visibility and currency-choice flags |
| Internals | `.useInternals()` | the raw machine state and sender |

---

```ts
import { ScopeActorTypes, useBillingSettings } from "@upmind-automation/headless";

const manager = useBillingSettings().as(ScopeActorTypes.CLIENT);

await manager.useActions().isReady();
await manager.useActions().update({ enabled: 0 });
```

### Actions — `useActions()`

#### `isReady()` — waiting for the form

Resolves when the form is available for input.

**Returns:** `Promise<boolean>` — `true` once available; `false` on error or after a bounded 30-second timeout. **Never `Infinity`** — a failed lookup settles this to `false` rather than hanging the caller forever.

#### `input(model)`

Feeds a model into the form. Debounced — rapid calls collapse into one parse.

| Param | Type | Required |
| --- | --- | --- |
| `model` | `BillingSettingsModel \| Record<string, unknown>` | Yes |

**Returns:** `Promise<BillingSettingsModel>` — the parsed model, after validation has run.

#### `update(value?)`

Saves the current model — or the one you pass — and resolves the persisted model. Diff-only: only fields that changed since the base model are sent, decided by comparing each field against the base model, never by whether the new value looks empty. Persists both the five consolidation fields (`PUT clients/{id}`) and the account's own currency fields (`PUT accounts/{accountId}`) in the same call when either is dirty — each request is issued independently, so a save touching only one entity sends exactly one request.

| Param | Type | Required |
| --- | --- | --- |
| `value` | `BillingSettingsModel \| Record<string, unknown>` | No |

**Returns:** `Promise<BillingSettingsModel>` — the persisted model.

**Rejects:** with a `DetailedError` carrying the underlying failure — including when the brand has not opted clients into managing this preference, or when the model carries a preferred-payment-currency change while that choice is closed.

> **🧪 For Testers:** Setting `enabled: 0` and saving must produce an outbound body carrying the literal key `invoice_consolidation_enabled: 0` — never an omitted key. Calling `update()` with nothing dirty resolves successfully with **zero** requests.

#### `revert()`

Restores the model to its last-saved values. Not a machine-level "undo" — it is a form input carrying the base model back through the same validation path a normal edit takes.

**Returns:** `Promise<BillingSettingsModel>`.

> **🧪 For Testers:** After a dirty edit, `revert()` leaves the model deep-equal to the base model and `isDirty` false, even if a debounced `input()` call was still pending when `revert()` was called.

#### `clear()`

Clears the current form context back to its starting state.

**Returns:** `void`.

> **🧪 For Testers — a live, open gap.** Typing into the form schedules a debounced parse; calling `clear()` immediately afterward clears the model right away, but the still-pending debounced parse can fire moments later and silently repopulate the just-cleared value. `revert()` was fixed against this same race; `clear()` was not. Do not assume `clear()` is safe to call while a keystroke's debounce window may still be open.

#### `onDone()`

Resolves once a save has completed.

**Returns:** `Promise<boolean>`.

#### `stop()` — pausing the editor

Stops the underlying machine, leaving the registry entry in place.

**Returns:** `void`.

#### `destroy()` — releasing the editor

Stops the machine **and** removes it from the registry.

**Returns:** `void`.

### Context — `useContext()`

| Property | Type | Meaning |
| --- | --- | --- |
| `context` | `ComputedRef<BillingSettingsContext \| undefined>` | The full editor context object |
| `model` | `ComputedRef<BillingSettingsModel \| undefined>` | The current form model — the five consolidation fields plus the account's own currency fields |
| `baseModel` | `ComputedRef<BillingSettingsModel \| undefined>` | The last-saved values `revert()` restores to |
| `schema` | `ComputedRef<JsonSchema \| undefined>` | The form's JSON schema — the five native controls |
| `uischema` | `ComputedRef<UISchemaElement \| undefined>` | The form's UI definition, paired with `schema` |
| `id` | `ComputedRef<string \| undefined>` | The id of the client whose preference is being managed |
| `title` | `ComputedRef<string \| undefined>` | Display title |
| `currencyOptions` | `ComputedRef<ICurrency[]>` | The brand's supported currencies, ordered by name, plus the account's own currency when the brand list omits it |
| `errors` | `ComputedRef<string \| undefined>` | Machine-captured error message — read, never raised |
| `validationErrors` | `ComputedRef<ErrorObject[] \| undefined>` | Field-level validation errors (AJV shape) — read, never raised |

> **🧪 For Testers:** `errors` and `validationErrors` are state, never events. A rejected save lands here and stays readable until the next operation supersedes it.

### Meta — `useMeta()`

| Flag | True when |
| --- | --- |
| `hasErrors` | The editor captured an error |
| `isAvailable` | The machine has settled **and** the brand has explicitly opted clients into managing this preference themselves |
| `isComplete` | The preference has been saved |
| `isDirty` | The model differs from its last-saved values |
| `isLoading` | The editor is waiting for its client id, or resolving its lookups |
| `isProcessing` | A save is in flight |
| `isValid` | The current model passes schema validation |
| `isVisible` | The brand has explicitly opted clients into this surface — defaults `false` |
| `hasPaymentCurrencyChoice` | The brand has explicitly opted clients into paying in a different currency |
| `showErrors` | A validation error exists **and** the form has been touched |

> **🧪 For Testers:** `isAvailable` folds the machine's own readiness together with the brand's consolidation opt-in into one flag — a brand that never opts clients in leaves the editor permanently unavailable, not merely read-only.

### Internals — `useInternals()`

| Property | Meaning |
| --- | --- |
| `actorScope` | The resolved actor for this instance |
| `send` | The raw event sender |
| `service` | The raw underlying service |
| `state` | The raw reactive state |

---

## The form definition — paste-ready

The editor serves its form definition at runtime through **`useBillingSettings().useContext().schema`** and **`.uischema`**. All five controls are this module's own.

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
    "dueDateDay": { "type": ["integer", "null"], "minimum": 1, "maximum": 28 },
    "currencyId": { "type": "string" },
    "preferredPaymentCurrencyId": { "type": ["string", "null"] }
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
    { "type": "Control", "scope": "#/properties/dueDateDay", "i18n": "form.invoice_consolidation_due_date_day" },
    { "type": "Control", "scope": "#/properties/currencyId", "i18n": "form.currency_id" },
    { "type": "Control", "scope": "#/properties/preferredPaymentCurrencyId", "i18n": "form.preferred_payment_currency_id" }
  ]
}
```

`currencyId` always renders; `preferredPaymentCurrencyId` renders only when the brand has opted clients into paying in a different currency — see `useMeta().hasPaymentCurrencyChoice`.

Paste both into [jsonforms.io](https://jsonforms.io/examples/basic) — schema on the left, UI schema on the right — to see the rendered form.

### Starting data

The editor's baseline model — what an untouched form holds before a key is pressed, seeded from the client's saved record:

```json
{
  "enabled": 1,
  "baseRule": null,
  "dayOfWeek": null,
  "dateOfMonthDay": null,
  "dueDateDay": null,
  "currencyId": "25d96e76-3ed0-913d-d52c-417482528340",
  "preferredPaymentCurrencyId": null
}
```

> **🧪 For Testers:** The barrel exposes no bare `useSchema` / `useUischema`. The only supported way to obtain the form definition is the editor's context — a consumer reaching for a bare export is reaching for something the module does not offer.

---

## Errors are state, never announcements

```ts
import { useBillingSettings, ScopeActorTypes } from "@upmind-automation/headless";

const manager = useBillingSettings().as(ScopeActorTypes.CLIENT);

const { errors, validationErrors } = manager.useContext();
const { hasErrors } = manager.useMeta();

// Success signal for a save
await manager.useActions().onDone();
```

## Types

```ts
import {
  useBillingSettings,
  CLIENT_BILLING_SETTINGS_SCOPE_MATRIX,
  ClientBillingSettingsContextTypes,
  type ClientBillingSettingsScopeMatrix,
  type AccountCurrencyUpdateBody,
  type BillingSettingsContext,
  type BillingSettingsModel,
  type BillingSettingsUpdateBody,
  type UseBillingSettings,
  type UseBillingSettingsActions,
  type UseBillingSettingsContext,
  type UseBillingSettingsMeta,
  type UseBillingSettingsInternals
} from "@upmind-automation/headless";
```

That list is the module's whole public surface. The services, mappers, schemas, and the machine-config file are internal and are not exported — see [gotchas.md](./gotchas.md).
