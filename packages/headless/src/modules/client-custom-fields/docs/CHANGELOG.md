# Changelog

All notable changes to the `client-custom-fields` module are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

- **`useClientCustomFieldImage`** — a second composable in this module: the per-field IMAGE value editor, wrapping the platform's existing upload capability rather than implementing the upload endpoint itself. Open a field with `.as(ScopeActorTypes.CLIENT).for(ClientCustomFieldContextTypes.FIELD, fieldId)`.
  - 5 actions — `destroy`, `flush`, `isReady`, `remove`, `upload`.
  - 5 context members — `downloadUrl`, `hash`, `preview`, `value`, `errors`.
  - 5 meta flags — `hasError`, `isAvailable`, `isComplete`, `isUploading`, `progress`.
  - 2 internals — `actorScope`, `uploader`.
- **`CustomField.typeId`** — an additive numeric field-type discriminator, specified for all 8 field types (two of the eight — NUMBER and IMAGE — have actually been observed against real data; the rest are specified but not yet confirmed). `CustomField.type` (the wire's own type label) is unchanged and is now display/debug only, never a coercion branch.
- **`CustomFieldModel`** — the code-keyed value record type is now a real, filled-in shape (was an empty placeholder).
- **Full-fidelity definition mapping** — `hidden`, `user_only`, `editable`, `display_contexts`, and `order` are now all mapped onto a definition; none is left unmapped.
- **`isReadOnly` and `isDisabled` no longer collapse to the same flag** — each now derives from its own source field.
- **Bounded, error-settling readiness** — `isReady()` now resolves `false` on a definitions-read failure or a brand-resolution failure, rather than an uncapped poll that only ever resolved on success.
- **`invalidate()` is restored**, scoped to this module's own cache key.
- **A dirty-only, code-keyed request diff** (`mapCustomFieldValuesToRequest`) — an empty string normalises to `null` so a value can be cleared; `undefined` signals an empty diff.
- **Per-type value coercion covers all 8 field types** and never emits the literal string `"undefined"` or `"null"`; for a number, a nullish or empty raw value coerces to `undefined` rather than `NaN`.
- **A read-only display projection** (`mapCustomFieldDisplay`) — a SELECT value projects to its option's label, a checkbox to a yes/no string, an IMAGE to a download URL + preview pair.
- **A value's definition resolves from its own embedded copy** (`resolveFieldByValue`), without requiring the definitions collection to be loaded at all.
- **The barrel is now the module's only public surface** — curated named exports only; the services, mappers, and schema re-export file each carry an internal marker.

### Changed

- **The definitions request now targets the target client's OWN brand**, resolved through the same identity seam every request in this module uses — never the calling session's own brand.
- **Definitions are sorted client-side** by display order, regardless of what order the server returns them in.
- **Client-side filtering matches the reference conversion's own pattern** — a partial-match predicate over the already-loaded list, issuing no new request.
- **The collection's context member is renamed from `VALUES` to `CLIENT`**, matching every sibling client module. The former name described the RESOURCE being addressed (the value set) while the id it carried was the CLIENT's own — a mismatch a since-reversed change misread as `.for()` itself being wrong, briefly dropping the context entirely in favour of a bare `.withId()`. `ClientCustomFieldsContextTypes`, `CLIENT_CUSTOM_FIELDS_SCOPE_MATRIX`, and `ClientCustomFieldsScopeMatrix` are exported from the module barrel (and the package root) as before. The image editor's own `ClientCustomFieldContextTypes.FIELD` context is unaffected — it names a real entity (which field), not an owner, and keeps its `.for(FIELD, id)` shape. See [gotchas.md](./gotchas.md#6-the-trap-was-the-contexts-name-not-for-itself--a-resource-named-member-carrying-the-clients-own-id).
- **`useClientCustomFields`'s scope matrix is registered at runtime again** (`.scopeMatrix` is re-attached on the exported wrapper, read by `useModulePort.ts` before the composable is ever invoked) — the earlier all-`never` drop no longer applies.
- **Documentation refreshed against the shipped surface.**

### Known limitations

- **Upload progress is binary (`0`/`100`), not incremental.** Legacy reports real byte-level progress; this module cannot, because the transport it uploads through has no upload-progress hook, the shared upload capability's progress event is never dispatched anywhere in the tree, and the upload composable's own return value does not expose a progress field. See [gotchas.md](./gotchas.md#1-image-upload-progress-is-binary-0100-not-incremental). Recorded as out-of-scope for this module; a follow-up issue is pending filing once those barriers are addressed elsewhere.
- **Two of the eight field-type string labels are confirmed against real recorded data; the rest are inferred from naming convention.** This module's own coercion is unaffected (it keys on the numeric discriminator); a shared, re-exported form-generation helper keys on the string label instead. See [gotchas.md](./gotchas.md#5-the-numeric-type-is-the-only-safe-discriminator--the-string-label-can-silently-fall-through).
- **Staff and guest surfaces are not built.** Both composables' matrices pin `staff` and `guest` to `null as never`, so `.as(ScopeActorTypes.STAFF).for(...)` is a compile-time error while the bare `.as(ScopeActorTypes.STAFF)` still type-checks and is refused at runtime — a designed boundary rather than an advertised-but-absent capability. A staff-acting-for-a-client surface for reading/writing another client's definitions and images, and brand-level authoring of the definitions catalogue itself, are both out of scope for this module — recorded as out-of-scope, with follow-up issues pending filing.

### Recorded fixtures

Six request/response pairs captured against a live environment back the documented behaviour:

| Fixture                                                                    | Covers                                                                                                      |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `get-custom-fields-brand-id-filter-object-type-client-sort-order-asc.json` | the brand-scoped definitions read                                                                           |
| `get-clients-id-case-with-values.json`                                     | a client record with embedded custom field values, used to exercise the embedded-definition resolution path |
| `post-clients-fields-id-image.json`                                        | a successful image upload                                                                                   |
| `post-clients-fields-id-image-case-rejected.json`                          | the `422` rejection shape for an invalid image                                                              |
| `put-clients-id-case-set-custom-field.json`                                | a save that sets a custom field value                                                                       |
| `put-clients-id-case-clear-custom-field.json`                              | a save that clears a custom field value                                                                     |

A large share of this module's value-semantics proofs (schema generation, display projection for choice/checkbox fields) rest on constructed inputs layered over the two real recorded field types this environment has, rather than on further recorded captures — this environment carries only a NUMBER and an IMAGE definition. Every wire-level contract (the requests and responses above) rests on a real recording; only pure, already-mapped-shape functions are exercised with constructed inputs, and every such case is labelled as constructed in its own test output.

### Not captured

- The rejection shape for a validation failure on the definitions collection itself (as opposed to the image upload) has not been observed.

---

## Migration Guide

### Addressing the collection's owning client

**Breaking change:** the context member is named `CLIENT`, not `VALUES`.

```ts
import {
  useClientCustomFields,
  ScopeActorTypes,
  ClientCustomFieldsContextTypes
} from "@upmind-automation/headless";

const clientId = "825d96e7-63ed-0913-46c4-174825283406";

// Before
// useClientCustomFields().as(ScopeActorTypes.CLIENT).for(ClientCustomFieldsContextTypes.VALUES, clientId);

// After
const fields = useClientCustomFields()
  .as(ScopeActorTypes.CLIENT)
  .for(ClientCustomFieldsContextTypes.CLIENT, clientId);
```

The image editor's own `.for(ClientCustomFieldContextTypes.FIELD, fieldId)` is unchanged — see "Uploading an image value" below.

### Reading a definition's type

**Breaking change:** branch on `typeId`, the numeric discriminator, not `type` (the display label).

```ts
import type { CustomField } from "@upmind-automation/headless";
import { CustomFieldsTypes } from "@upmind-automation/types";

declare const field: CustomField;

// Before — unsafe: keys on a string only confirmed for 2 of 8 types
if (field.type === "number") {
  /* … */
}

// After
if (field.typeId === CustomFieldsTypes.NUMBER) {
  /* … */
}
```

### Filling in a value model

```ts
import type { CustomFieldModel } from "@upmind-automation/headless";

// Before — CustomFieldModel was an empty placeholder type
const beforeModel: CustomFieldModel = {}; // no shape to rely on

// After — a real code-keyed record
const model: CustomFieldModel = { age: 42, profile_picture: "z5PJhA..." };
```

### Uploading an image value

```ts
import {
  useClientCustomFieldImage,
  ScopeActorTypes,
  ClientCustomFieldContextTypes
} from "@upmind-automation/headless";

const fieldId = "0c9ff2c1-6d29-4f6d-9a54-1a9d5f0b3b21";
const file = new File([], "avatar.png", { type: "image/png" });

// After — new in this module
const image = useClientCustomFieldImage()
  .as(ScopeActorTypes.CLIENT)
  .for(ClientCustomFieldContextTypes.FIELD, fieldId);
const hash = await image.useActions().upload(file);
```
