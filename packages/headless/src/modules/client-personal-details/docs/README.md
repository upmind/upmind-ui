# client-personal-details

> A client's own profile — native fields plus custom field values, read and edited through a diff-only save.

## What Is This?

Think of `client-personal-details` as the **client's own answer sheet** — the profile record itself, holding both the four "always there" fields (name, public name, language) and whatever custom questions the brand has added, answered.

- The **questions** (what custom fields exist, their types, how to render a form for them) live in a sibling module — `client-custom-fields`.
- This module holds the **answers** for one specific client, reads them, and saves only what actually changed.

The module ships **one composable**, `usePersonalDetails`. It serves the display list (the client's current profile, including custom field values) and the form editor (change native fields and/or custom field values) from one scoped instance.

It usually manages the **calling client's own** profile — but the target is always an explicit entity id, and that id is not validated locally against who is calling. There is no capability here for one client to act _as_ another, and there is nothing in this module for a staff member or a guest to act at all — `.as(ScopeActorTypes.STAFF).for(...)` is a compile-time error, and the bare `.as(ScopeActorTypes.STAFF)` compiles but is refused at runtime.

> **🧪 For Testers:** The only actor that resolves on the composable is `client`. There is nothing in this module for a staff member or a guest to reach a profile with — but split the assertion the way the refusal splits: `.as(ScopeActorTypes.STAFF).for(...)` is a compile failure, so assert it at type level, while a bare `.as(ScopeActorTypes.STAFF)` compiles and must be asserted at runtime. That is narrower than "no other profile is ever reachable": `.as(ScopeActorTypes.CLIENT).for(ClientPersonalDetailsContextTypes.CLIENT, id)` addresses _whichever_ client id it is given, on the caller's own session bearer — see [gotchas.md](./gotchas.md) before assuming the id is always the caller's own.

## Quick Start

```ts
import {
  usePersonalDetails,
  ScopeActorTypes
} from "@upmind-automation/headless";

// --- Read the display list, then change a value and save
const manager = usePersonalDetails().as(ScopeActorTypes.SELF); // callable bare — a client has exactly one profile
await manager.useActions().isReady();
const { data } = manager.useContext(); // the display list — native fields, then custom fields
await manager.useActions().input({ firstName: "New" });
await manager.useActions().update();
```

## Features

| Capability                     | Surface                                                          | What it does                                                                  |
| ------------------------------ | ---------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Read own profile               | `usePersonalDetails().useContext().data`                         | Native fields + custom field values, projected for display                    |
| Know the profile is ready      | `usePersonalDetails().useMeta().isAvailable`                     | The form is available for input (a client id resolved and the profile loaded) |
| Edit the profile               | `usePersonalDetails().useActions().input()` + `.update()` | Validated form input, diff-only save                                          |
| Clear a value                  | Set a field to `""` (native) or leave a custom field blank       | Survives to the wire as `""` or `null`, per field kind                        |
| Revert unsaved changes         | `…useActions().revert()`                                         | Restores the base model                                                       |
| Narrow the form                | `…useActions().filterFields(['firstName'])`                      | Rebuilds the schema/form to only those fields                                 |
| Validate as the client types   | `…useActions().input()` + `useMeta().isValid`                    | Reports acceptance and which field is wrong                                   |
| Render the form                | `…useContext().schema` / `.uischema`                             | The form definition, consuming the sibling module's own custom-field contract |

## Key Concepts

### One composable, one profile

The display list and the editor are one composable sharing one scoped instance, so whichever you read from resolves the same target client. A client has exactly one profile, so the composable is **callable bare**: `usePersonalDetails().as(ScopeActorTypes.SELF)` with no further argument constructs and settles.

> **👩‍💻 For Developers:** The composable is registered under one internal name. See [architecture.md](./architecture.md).

### Reading was genuinely broken before this — not just rough

Before this module's current shape, a client's custom field values could not be read at all through the path a consumer actually used — every value rendered as the literal string `"undefined"`, and the editor's starting model for custom fields was always empty. The read is now a real, dedicated query against the client's own record.

> **🧪 For Testers:** If you're testing against an OLDER build of this module, do not treat a custom field value rendering correctly as a given — confirm the read is actually reaching the client's own record, not a stale session projection.

### Clearing a value is not one rule — it's two

A cleared **native** field (first name, last name, public name) reaches the wire as an empty string. A cleared **custom** field value reaches the wire as `null`. This is the single most consumer-visible asymmetry in this module — both are "cleared", both are sent (never omitted), but the wire values differ by which kind of field it is.

> **🧪 For Testers:** Clear a native field and assert the outgoing body carries `""` for that key. Clear a custom field and assert the outgoing body carries `null` for that key. Do not expect the same value for both.

### Saves are diff-only, and an empty diff is a genuine no-op

`update()` compares the current model against the base model it was seeded from and sends only what differs. Calling it with nothing dirty resolves successfully with **zero** requests.

> **🧪 For Testers:** Change nothing and call `update()` — assert zero network activity, not a request with an empty body.

### The interface language is tracked by id, shown by name

The model holds the language as an **id**; the read-only display projection (`data`) shows its **name**. A client whose current language id doesn't appear in the brand's own language list still gets a disabled option showing that language's name, rather than the field going blank.

> **🧪 For Testers:** Never expect a raw id to render where a name is expected, and never expect the model to hold a name where it holds an id.

### Errors are state — the module raises nothing

No toast, no notification. Every failure is captured where the consumer can read and render it: `useContext().error` / `.errors` / `.validationErrors` and `useMeta().hasErrors`.

## Documentation

| Doc                                  | Audience                                             | Content                                                                                          |
| ------------------------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **This README**                      | Everyone                                             | Overview, concepts, quick start                                                                  |
| [usage.md](./usage.md)               | All devs                                             | Full API reference                                                          |
| [architecture.md](./architecture.md) | Internal / contributors                              | Data flow, the shared identity seam, dependencies                                                |
| [gotchas.md](./gotchas.md)           | All                                                  | The sharp edges — clear semantics, the one-instance lifetime, cross-namespace test cleanup |
| [foundation.md](./foundation.md)     | Teams building against the platform on another stack | Framework-neutral platform spec: endpoints, payloads, failure modes                              |
| [CHANGELOG.md](./CHANGELOG.md)       | All                                                  | Change history and porting notes                                                                 |
