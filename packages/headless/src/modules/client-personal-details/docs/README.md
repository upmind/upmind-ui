# client-personal-details

> A client's own profile — native fields plus custom field values, read and edited through a diff-only save.

## What Is This?

Think of `client-personal-details` as the **client's own answer sheet** — the profile record itself, holding both the four "always there" fields (name, public name, language) and whatever custom questions the brand has added, answered.

- The **questions** (what custom fields exist, their types, how to render a form for them) live in a sibling module — `client-custom-fields`.
- This module holds the **answers** for one specific client, reads them, and saves only what actually changed.

The module ships **two composables**, because reading and editing are different jobs:

| Surface           | Composable                  | Use it when                                                                       |
| ----------------- | --------------------------- | --------------------------------------------------------------------------------- |
| **The read view** | `usePersonalDetails`        | You are showing the client's current profile, including their custom field values |
| **The editor**    | `usePersonalDetailsManager` | You are showing a form to change native fields and/or custom field values         |

Both usually manage the **calling client's own** profile — but the target is always an explicit entity id, and that id is not validated locally against who is calling. There is no capability here for one client to act _as_ another, and `staff` and `guest` are both compile-time errors — there is nothing in this module for a staff member or a guest to act at all.

> **🧪 For Testers:** The only actor that resolves on either composable is `client`. `staff` and `guest` are compile-time errors — there is nothing in this module for a staff member or a guest to reach a profile with. That is narrower than "no other profile is ever reachable": `.as(ScopeActorTypes.CLIENT).for(ClientPersonalDetailsContextTypes.PROFILE, id)` addresses _whichever_ client id it is given, on the caller's own session bearer — see [gotchas.md](./gotchas.md) before assuming the id is always the caller's own.

## Quick Start

```ts
import {
  usePersonalDetails,
  usePersonalDetailsManager,
  ScopeActorTypes
} from "@upmind-automation/headless";

// --- The read view
const profile = usePersonalDetails().as(ScopeActorTypes.SELF);
const { data } = profile.useContext(); // the display list — native fields, then custom fields
await profile.useActions().isReady();

// --- The editor: change a value and save
const manager = usePersonalDetailsManager().as(ScopeActorTypes.SELF); // callable bare — a client has exactly one profile
await manager.useActions().isReady();
await manager.useActions().input({ firstName: "New" });
await manager.useActions().update();
```

## Features

| Capability                     | Surface                                                          | What it does                                                                  |
| ------------------------------ | ---------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Read own profile               | `usePersonalDetails().useContext().data`                         | Native fields + custom field values, projected for display                    |
| Know whether the read is yours | `usePersonalDetails().useMeta().isAvailable`                     | Authenticated **and** a client id resolved                                    |
| Edit the profile               | `usePersonalDetailsManager().useActions().input()` + `.update()` | Validated form input, diff-only save                                          |
| Clear a value                  | Set a field to `""` (native) or leave a custom field blank       | Survives to the wire as `""` or `null`, per field kind                        |
| Revert unsaved changes         | `…useActions().revert()`                                         | Restores the base model                                                       |
| Narrow the form                | `…useActions().filterFields(['firstName'])`                      | Rebuilds the schema/form to only those fields                                 |
| Validate as the client types   | `…useActions().input()` + `useMeta().isValid`                    | Reports acceptance and which field is wrong                                   |
| Render the form                | `…useContext().schema` / `.uischema`                             | The form definition, consuming the sibling module's own custom-field contract |

## Key Concepts

### Two composables, one profile

The read view and the editor are separate composables sharing one identity seam — whichever one issues a request, it resolves the same target client. A client has exactly one profile, so the editor is **callable bare**: `usePersonalDetailsManager().as(ScopeActorTypes.SELF)` with no further argument constructs and settles.

> **👩‍💻 For Developers:** The two composables are registered under two DIFFERENT internal names, even though they share one scope matrix — a deliberate departure from some other converted modules in this codebase, needed because this module's single-member context gives both composables' "no `.for()` supplied" call the identical scope key. See [architecture.md](./architecture.md).

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

The editor's model holds the language as an **id**; the read-only display projection shows its **name**. A client whose current language id doesn't appear in the brand's own language list still gets a disabled option showing that language's name, rather than the field going blank.

> **🧪 For Testers:** Never expect a raw id to render where a name is expected, and never expect the model to hold a name where it holds an id.

### Errors are state — the module raises nothing

No toast, no notification. Every failure is captured where the consumer can read and render it: `useContext().error` / `useMeta().hasError` on the read view; `useContext().errors` / `.validationErrors` and `useMeta().hasErrors` on the editor.

## Documentation

| Doc                                  | Audience                                             | Content                                                                                          |
| ------------------------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **This README**                      | Everyone                                             | Overview, concepts, quick start                                                                  |
| [usage.md](./usage.md)               | All devs                                             | Full API reference for both composables                                                          |
| [architecture.md](./architecture.md) | Internal / contributors                              | Data flow, the shared identity seam, dependencies                                                |
| [gotchas.md](./gotchas.md)           | All                                                  | The sharp edges — clear semantics, the two-composable naming split, cross-namespace test cleanup |
| [foundation.md](./foundation.md)     | Teams building against the platform on another stack | Framework-neutral platform spec: endpoints, payloads, failure modes                              |
| [CHANGELOG.md](./CHANGELOG.md)       | All                                                  | Change history and porting notes                                                                 |

## Playground

`playgrounds/labs/src/pages/account/profile/components/ClientProfile.vue` and `ClientProfileFieldsEdit.vue` drive this module's two composables directly.

```bash
cd playgrounds/labs
pnpm dev
```

Then navigate to the account profile page to see the module in action.
