# Changelog

All notable changes to the `client-personal-details` module are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

- **A real, dedicated read of a client's own profile.** Previously, a client's custom field values could not be read at all through the path a consumer actually used — the source they projected from was never populated, so every value rendered as the literal string `"undefined"`, and the editor's starting model for custom fields was always empty. The read is now a genuine query against the client's own record, with its own settled and error states.
- **`usePersonalDetailsManager`'s `filterFields()`** — retargets which fields the editor exposes without a full reconstruction, rebuilding the schema/form definition against the new narrowing.
- **A bounded editor readiness.** `isReady()` now times out rather than waiting forever on a failed lookup.
- **`revert()`** — restores the model to its persisted base model.
- **A diff-only update body** (`firstname`, `lastname`, `public_name`, `interface_language_id`, `document_language_id`, `custom_fields` — nothing else) with correct clear semantics: a cleared native field survives as `""`; a cleared custom field survives as `null`; both are present in the body, never omitted.
- **`document_language_id` is sent only when the interface language actually changed**, alongside it and equal to it.
- **Full permission metadata on the display projection** — a read-only custom field now reports it; native fields report the values they actually derive rather than a hardcoded `false`.
- **The language row is tracked by id in the model, and by name for display** — resolved consistently rather than exposing a display name where an id was expected, or vice versa.
- **An unknown "current" language survives as a disabled option**, labelled by its resolved name rather than disappearing or rendering a raw id.
- **Typed validation** — a rejected save now carries the schema error list keyed to the field's own schema path, rather than an untyped rejection.
- **Scoped cache invalidation** — a successful save now refetches only this module's own cache key, rather than an over-broad invalidation that also refetched unrelated queries.
- **The manager is callable with no argument** — `usePersonalDetailsManager().as(ScopeActorTypes.SELF)` constructs and settles.
- **The barrel is now the module's only public surface** — curated named exports only; the services, mappers, schemas, and machine-config file each carry an internal marker.

### Changed

- **Custom field value semantics (definitions, per-type coercion, schema/form generation, and the image-flush step) are consumed from the sibling `client-custom-fields` module rather than re-implemented here.**
- **The two composables are registered under two distinct internal names**, despite sharing one scope matrix — a deliberate departure from some other converted modules in this codebase, required because this module's single-member context makes the "no `.for()` supplied" call identical for both halves.
- **Documentation refreshed against the shipped surface**, including a correction to a sibling module's own foundation doc, which previously described this pair's update-request shape for custom field values as an array of `{field_id, value}` pairs — it is, and always was, an object keyed by field code.

### Removed

- **An empty placeholder file and a name-shadowing type alias** that previously existed in this module are both gone.
- **A direct import of the localisation library** — translated error text now travels exclusively through the shared localisation wrapper.

### Known limitations

- **A staff-acting-for-a-client surface for reading or writing another client's profile is not built.** `.as('staff')` and `.as('guest')` are both compile-time errors — a designed, type-enforced boundary. A number of admin-only capabilities that exist in the legacy application (an aggregate save/revert across multiple panels, several admin-only fields, permission-gated read/write, a staged-import lock, an unverified-client banner, a cross-brand redirect guard, and a per-client brand-settings language list for a multi-brand staff context) are all out of scope for this module — none of them are client-surface capabilities to begin with. Recorded as out-of-scope, with follow-up issues pending filing.
- **How many times the underlying profile resource is actually fetched on a real page load is not settled**, though the mechanism is: this module's own read and the sibling custom-fields module's own read end up under two separate cache keys rather than one shared one, and closing that gap by force is unsafe rather than merely unfinished — see [gotchas.md](./gotchas.md#3-two-independently-keyed-reads-of-the-same-profile-resource).
- **The "unknown current language survives as a disabled option" capability is proven against a labelled CONSTRUCTED language id**, not a recorded one — this staging environment's own brand language list is exhaustive, so an id genuinely absent from it cannot be recorded by definition. The constructed id is validated against the real recorded list (confirmed absent from it) rather than invented freely. This mirrors the sibling custom-fields module's own disclosure: a real environment with only a NUMBER and an IMAGE definition means several of that module's value-semantics proofs also rest on constructed inputs layered over real recorded shapes, never on a fresh hand-authored fixture — see that module's own [CHANGELOG.md](../../client-custom-fields/docs/CHANGELOG.md) for the full account.

### Recorded fixtures

Six request/response pairs captured against a live environment back the documented behaviour:

| Fixture                                       | Covers                                                   |
| --------------------------------------------- | -------------------------------------------------------- |
| `get-clients-id.json`                         | the profile read, including embedded custom field values |
| `get-brand-settings.json`                     | the brand's own language list                            |
| `put-clients-id-case-change-firstname.json`   | a native field change                                    |
| `put-clients-id-case-native-falsy.json`       | a native field cleared to `""`                           |
| `put-clients-id-case-clear-custom-field.json` | a custom field value cleared to `null`                   |
| `put-clients-id-case-restore-age.json`        | a custom field value restored from cleared               |

### Not captured

- The rejection shape for a save whose diff is invalid against the schema (as opposed to a request the platform itself rejects) has not needed a live capture — this module's own validation stops that case locally before any request is issued.

---

## Migration Guide

### Reading a client's custom field values

**Breaking change:** the source that used to (never successfully) carry these values is gone; the values now arrive through this module's own read.

```ts
// Before — always undefined, rendered as the literal string "undefined"
const value = someSessionProjection.customFields?.age;

// After
const profile = usePersonalDetails().as(ScopeActorTypes.SELF);
const { customFields } = profile.useContext();
```

### Clearing a value

```ts
// Native field
await manager.useActions().update({ publicName: "" }); // → { "public_name": "" }

// Custom field
await manager.useActions().update({ customFields: { age: "" } }); // → { "custom_fields": { "age": null } }
```

### Building the manager without an argument

```ts
// Before — required an options argument
usePersonalDetailsManager({ filterFields: [...] });

// After — callable bare; narrow after construction instead
const manager = usePersonalDetailsManager().as(ScopeActorTypes.SELF);
manager.useActions().filterFields([...]);
```
