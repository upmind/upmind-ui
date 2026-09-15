# client-billing-settings — Architecture

## Overview

The module ships **two** scoped composables over one shared services factory:

- **`useBillingSettings`** — the read view. Query-backed, no state machine. One reactive record query per resolved `(actor, context)` scope, minted at construction.
- **`useBillingSettingsManager`** — the editor. Backed by the platform's shared form-editor machine, one interpreter per resolved scope.

Both share the **same** scope matrix and context enum — a client has exactly one consolidation preference, so both composables scope on the identical entity. Only `client` resolves; `self`, `staff`, and `guest` are all `null as never` in the shared matrix, making `.as('self')`, `.as('staff')`, and `.as('guest')` compile-time errors rather than advertised-but-absent capabilities.

Because a client's preference has only one member in its context enum, `.as(ScopeActorTypes.CLIENT)` with no further argument is the _normal_ call for both halves — sharing one registry name would give the read view and the editor the identical scope key, and the registry would hand one consumer the other's instance. **This module registers the two composables under two different internal names** for exactly that reason, mirroring the sibling `client-personal-details` module's own precedent.

The single most important property of this module is that **every request resolves its target client from the scope**, never from a direct session read — one identity-resolution function, shared by both halves, branching on the resolved context rather than on which actor is calling. That single seam is what makes a read and a write always agree on the same target client.

## Data Flow

### Instantiation — the read view

```mermaid
flowchart TD
  call["useBillingSettings().as(ScopeActorTypes.CLIENT)"] --> resolve["resolveClientId resolves the target client from the scope"]
  resolve --> mint["mint a reactive single-record query, keyed to this client, ONCE for this scope"]
  mint --> visibility["kick off the brand visibility-gate fetch, independently, in parallel"]
  mint --> ready["return the four sub-composable factories, all closed over the same query"]
  visibility --> ready
```

The reactive read shares its cache key and its URL with two sibling modules (`client-personal-details`, `client-custom-fields`) — deliberately, so a page that mounts more than one of the three dedupes onto one request instead of three. See "The shared cache key" below.

### Instantiation — the editor

```mermaid
flowchart TD
  call["useBillingSettingsManager().as(ScopeActorTypes.CLIENT)"] --> resolve["resolveClientId resolves the target client from the scope"]
  resolve --> interpret["interpret the shared form-editor machine, seeded with the resolved client id"]
  interpret --> gate{"client id<br/>resolved yet?"}
  gate -- no --> wait["hold in 'subscribing' — no request issued"]
  gate -- yes --> load["load the preference (one-shot) + the brand visibility gate, seed BOTH the model and the base model"]
  wait --> load
  load --> ready["return the four sub-composable factories"]
```

A late-resolving client id (a cold boot, where the session hasn't settled yet) tops up the already-interpreting machine through a **self-stopping** watch on the same resolved client id the rest of the module uses — never a second, independent read of the session.

### The save path — diff, staged-import gate, then persist

```mermaid
flowchart TD
  save["Caller invokes update()"] --> locked{"Owning record<br/>a staged import?"}
  locked -- yes --> reject(["Rejected — no request sent"])
  locked -- no --> diff["Compute the diff-only body: each field vs the base model, by IDENTITY, never by truthiness"]
  diff --> empty{"Diff empty?"}
  empty -- yes --> noop(["Resolve with zero requests"])
  empty -- no --> put["PUT clients/{id} — the diff-only body"]
  put --> invalidate["Invalidate this module's own cache key prefix"]
  invalidate --> done(["Save settled"])
```

Guarantees the platform holds: the staged-import check runs before the diff is even computed, and it is checked directly against a fresh one-shot read — not against whatever the machine's own context happens to hold — so a caller invoking the underlying service directly cannot bypass it by skipping the machine's own gate.

Constraints the caller has to plan around: the on/off/follow field's own "off" value (`0`) is falsy; every step between the caller's input and the outbound diff has to test for "did this change" rather than "does this look like a value", or the off state silently vanishes from the request. See "The falsy-zero restoration" below.

### The falsy-zero restoration

```mermaid
flowchart TD
  input["Caller inputs a model with enabled: 0 (or any of the four nullable fields set to null)"] --> parse["Schema-parse against the form's own schema"]
  parse --> compact["The parser's own final compaction step drops falsy/nullish leaves, INCLUDING a literal 0"]
  compact --> restore["This module explicitly RE-INSTATES every key the caller's own input named, verbatim — 0 stays 0, null stays null"]
  restore --> model(["Parsed model — the caller's own value survives"])
```

Guarantees the platform holds: a value the caller explicitly set is never silently dropped from the model before the diff step ever sees it — the restoration re-instates the caller's own value exactly, never a placeholder.

Constraints the caller has to plan around: this restoration only re-instates what the caller's own input explicitly named; a field the caller never touched is never invented into existence.

## Sub-composables

| Sub-composable | Read view | Editor |
| --- | --- | --- |
| `useActions()` | 3 members — readiness, refresh, lifecycle | 9 members — input, save, revert, clear, external lock, lifecycle |
| `useContext()` | 3 members — the preference, staged flag, captured error | 11 members — the full context object, model, base model, schema pair, id, title, staged/visibility flags, errors |
| `useMeta()` | 5 flags | 11 flags |
| `useInternals()` | 2 — actor scope, raw query | 4 — actor scope, raw sender, raw service, raw state |

## Services

One services file serves both halves:

| Concern | Where it lives |
| --- | --- |
| Target-client resolution | one function, consumed by both the read view and the editor |
| Addressability predicate | one function; its reactive form is what `isAvailable` exposes on both composables |
| The reactive preference read | a reactive query sharing its cache key and URL with two sibling modules |
| A one-shot preference read | used by the editor's own lookups and the staged-import check; deliberately bypasses the shared reactive cache entirely — see "The shared cache key" below |
| The visibility-gate read | resolved once per scope, shared between the readiness wait and the synchronous flag reads so neither can observe a still-in-flight fetch |
| The diff-only update body | pure, no side effects beyond the request itself; compares each field by identity, never by truthiness |
| The machine-services adapter | takes the already-scoped services instance as an argument, so the machine inherits the same resolved client as the rest of the module |

The module owns **no machine of its own** — it builds a typed configuration payload for the shared form-editor machine, overriding its actions, guards, and invoked services. The shared machine has no dedicated "revert" event; revert is composed as an ordinary form input carrying the last-saved values back through the same validation path a normal edit takes.

## Errors

Errors are **state**, not events. Nothing in this module raises a toast or notification.

| Surface | Where a failure lands |
| --- | --- |
| Read view's own query | the query's own error → `useContext().error`, `useMeta().hasErrors` |
| Visibility-gate fetch | a dedicated recoverable flag → `useMeta().hasVisibilityError` on the read view; fails closed (hidden) on both halves regardless |
| Editor save | the machine's context error → `useContext().errors`, `useMeta().hasErrors`; the action also rejects with a detailed error |
| Editor field validation | the validation errors → `useContext().validationErrors`, `useMeta().isValid` |

## Dependencies

### This module reads from

| Module | Uses |
| --- | --- |
| Active client session | the acting client's identity when no other context is supplied; whether the session is authenticated |
| Brand configuration | the single visibility-gate key |
| The shared request layer | the reactive preference read, the one-shot lookup read, the diff-only PUT, URL building, cache invalidation |
| Localisation | translated caller-facing text on rejected reads and saves |
| The shared form-editor machine | interpreted, never redefined |

### Modules that read from this one

None yet — this is a newly introduced module. Its own scope is deliberately narrower than the wider client-billing surface the legacy application groups it with; a second, not-yet-built capability is expected to become its first consumer once it lands.

## The shared cache key

This module, `client-personal-details`, and `client-custom-fields` all read the **identical** `clients/{id}?with=custom_fields,custom_fields.field` resource, under the **identical** cache key — deliberately, so a page mounting more than one of the three dedupes onto a single request rather than issuing one each.

This is safe **only** because the reactive read primitive this module uses applies its own field-selection **per observer**, in isolation — a second or third reactive observer on the same key gets its own independent projection at zero extra requests, and cannot change what any other observer sees.

**The unsafe pattern, and why it stays a live risk this module doesn't fully control.** The platform's *other* read primitive — a one-shot fetch-and-select call — bakes its own field-selection **inside** the very function the cache stores against. `client-custom-fields` reads this same shared key that way, selecting just the target client's brand id. If that call wins the race to populate the entry, the cache holds that bare brand-id string for the entry's full freshness window — and this module's own reactive read, mounting afterward, silently reports every field as `undefined` rather than erroring. This module's own one-shot reads never touch this shared key (they bypass the cache entirely, for exactly this reason) — but this module does not control what `client-custom-fields` does with the same key. See [gotchas.md](./gotchas.md#4-the-shared-cache-key-can-be-poisoned-by-a-sibling-module-this-module-does-not-control) for the concrete hazard.

## Module boundary

The barrel is the module's only public surface: two composables and their own type, one scope-matrix constant and its matching type, one context enum, four model types, and eight sub-composable types (four per composable). Curated named re-exports only — no `export *`.

Everything else is internal and carries a file-level internal marker: the services, the mappers, the schemas, and the machine-config file. The machine-config file is **not** a machine definition — it is a configuration payload for the platform's shared, unmodified form-editor machine.
