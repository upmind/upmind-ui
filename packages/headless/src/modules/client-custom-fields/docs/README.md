# client-custom-fields

> A brand's client custom field definitions, their value semantics, and the per-field image upload flow.

## What Is This?

Think of `client-custom-fields` as the **rulebook** for a brand's custom fields — not any one client's answers to them.

- The **definitions** are the questions a brand has configured for its clients (an age, a profile picture, anything else the brand added) — shared across every client on the brand.
- The **value semantics** are the rules for reading and writing an answer correctly for each question's type — a number stays a number, a checkbox stays a boolean, an image is a file that becomes a stored hash.
- The **image editor** is the one place a file actually gets uploaded, for the one field type (IMAGE) whose value isn't a plain scalar.

A specific client's own _answers_ — the values themselves, attached to that client's profile — are read and saved by a neighbouring module. This module hands that module the rulebook; it never reads or writes a client's saved answers itself.

The module ships **two composables**:

| Surface                        | Composable                  | Use it when                                                                                                           |
| ------------------------------ | --------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **The definitions collection** | `useClientCustomFields`     | You need the brand's field definitions — to render a form, resolve a value's type/options, or coerce/diff a value set |
| **The image editor**           | `useClientCustomFieldImage` | You are uploading, clearing, or previewing the stored image for one specific field                                    |

> **🧪 For Testers:** The only actor that resolves on either composable is `client`. `staff` and `guest` are compile-time errors — there is nothing in this module for a staff member or a guest to act at all. That is narrower than "no other entity is ever reachable": both composables address whichever client (or, for the image editor, field) id they are given, on the caller's own session bearer — see [gotchas.md](./gotchas.md) before assuming the id is always the caller's own.

## Quick Start

```ts
import {
  useClientCustomFields,
  useClientCustomFieldImage,
  ScopeActorTypes,
  ClientCustomFieldsContextTypes,
  ClientCustomFieldContextTypes
} from "@upmind-automation/headless";

// --- The collection: read the brand's definitions
const fields = useClientCustomFields()
  .as(ScopeActorTypes.CLIENT)
  .for(ClientCustomFieldsContextTypes.VALUES, clientId);
const { data } = fields.useContext();
await fields.useActions().isReady();

// --- The image editor: upload a new image for one field
const image = useClientCustomFieldImage()
  .as(ScopeActorTypes.CLIENT)
  .for(ClientCustomFieldContextTypes.FIELD, fieldId);
await image.useActions().upload(file);
const { downloadUrl } = image.useContext();
```

## Features

| Feature                                                 | Notes                                                                                                                    |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Read the brand's client custom field definitions        | Ordered by display order, client-side                                                                                    |
| Client-side filter over the loaded definitions          | No network request                                                                                                       |
| Per-type value coercion (all 8 field types)             | Never produces the literal string `"undefined"`                                                                          |
| Schema / form-definition generation                     | Re-exported from a shared parser, consumed by the profile module                                                         |
| Resolve a value's definition from its own embedded copy | Works without the definitions collection being loaded                                                                    |
| Upload / clear / preview an image value                 | Wraps the platform's existing upload capability                                                                          |
| Aggregate pre-save image flush                          | Resolves every pending image in a value set to its hash in one step                                                      |
| Upload progress                                         | Whether an upload is in flight, and whether it has settled — never an intermediate value. See [gotchas.md](./gotchas.md) |

## Key Concepts

### Definitions vs. values

This module owns the brand's **definitions** — what fields exist, their types, their display rules — and the **rules** for reading and writing a value correctly. It does not hold or persist any specific client's **values**; those live on that client's own profile record, read and saved elsewhere.

> **👩‍💻 For Developers:** If you're looking for "the client's age", you want the profile module, not this one. If you're looking for "what types of custom fields does this brand have, and how do I render a form for them", you're in the right place.

### The numeric type is the only safe discriminator

Every definition carries both a numeric type (`typeId`) and a string label (`type`) describing the same thing. Only the numeric one is specified for every field type that exists — two of the eight have actually been observed against real data — so branch on `typeId`, never on the string label.

### Actor types — and entity ids

The module uses the scoped composable pattern with `.as()`, and every method takes an **enum member**, never a plain string:

```ts
// The only actor that resolves — the same on both composables
const fields = useClientCustomFields()
  .as(ScopeActorTypes.CLIENT)
  .for(ClientCustomFieldsContextTypes.VALUES, clientId);

// Staff and guest are compile-time errors — there is no scope for them here
```

Naming a client's id here is addressing an **entity**, not adopting an **actor**: the caller's own credentials travel with the request regardless of which id was named, and this contract does not validate locally that the id matches the caller. There is no capability anywhere in this module for one client to act _as_ another — see [foundation.md](./foundation.md#core-concepts) for the full statement.

> **🧪 For Testers:** `.as(ScopeActorTypes.SELF)` alone works and resolves to the calling client, with no chaining available — every matrix in this module maps `self` to a type with no `.for()`/`.fresh()`. Name `.as(ScopeActorTypes.CLIENT)` when you need to chain `.for()`. See [gotchas.md](./gotchas.md).

## Documentation

| Doc                                  | Audience                                             | Content                                                                                           |
| ------------------------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **This README**                      | Everyone                                             | Overview, concepts, quick start                                                                   |
| [usage.md](./usage.md)               | All devs                                             | API reference for both composables                                                                |
| [architecture.md](./architecture.md) | Internal / contributors                              | Data flow, the shared identity seam, dependencies                                                 |
| [gotchas.md](./gotchas.md)           | All                                                  | The sharp edges — the type discriminator, the image-upload progress gap, load-order, scope typing |
| [foundation.md](./foundation.md)     | Teams building against the platform on another stack | Framework-neutral platform spec: endpoints, payloads, failure modes                               |
| [CHANGELOG.md](./CHANGELOG.md)       | All                                                  | Change history and porting notes                                                                  |

## Playground

None yet. Drive the collection and the image editor through wherever a client's custom fields are rendered — currently the client profile pages under `playgrounds/labs/src/pages/account/profile/`.
