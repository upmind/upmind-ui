# client-billing-settings — Architecture

## Overview

The module ships **one** scoped composable, `useBillingSettings`, over one services factory. It is backed by the platform's shared form-editor machine, one interpreter per resolved `(actor, context)` scope, and it serves the form editor and its read surface from that one instance. Only `client` resolves; `self`, `staff`, and `guest` are all `null as never` in the scope matrix, making `.as('self')`, `.as('staff')`, and `.as('guest')` compile-time errors rather than advertised-but-absent capabilities.

A client's preference has only one member in its context enum, so `.as(ScopeActorTypes.CLIENT)` with no further argument is the _normal_ call and always resolves to the same registry entry. The composable is registered under a single internal name.

The single most important property of this module is that **every request resolves its target client from the scope**, never from a direct session read — one identity-resolution function, branching on the resolved context rather than on which actor is calling. That single seam is what makes a read and a write always agree on the same target client.

## Data Flow

### Instantiation

```mermaid
flowchart TD
  call["useBillingSettings().as(ScopeActorTypes.CLIENT)"] --> resolve["resolveClientId resolves the target client from the scope"]
  resolve --> interpret["interpret the shared form-editor machine, seeded with the resolved client id"]
  interpret --> gate{"client id<br/>resolved yet?"}
  gate -- no --> wait["hold in 'subscribing' — no request issued"]
  gate -- yes --> load["load the preference + the brand visibility gate, seed BOTH the model and the base model"]
  wait --> load
  load --> ready["return the four sub-composable factories"]
```

A late-resolving client id (a cold boot, where the session hasn't settled yet) tops up the already-interpreting machine through a **self-stopping** watch on the same resolved client id the rest of the module uses — never a second, independent read of the session.

### The save path — two independent diffs, each with its own gate

```mermaid
flowchart TD
  save["Caller invokes update()"] --> diff["Compute two diff-only bodies: consolidation fields vs base, currency fields vs base — each by IDENTITY, never by truthiness"]
  diff --> cEmpty{"Consolidation diff empty?"}
  cEmpty -- no --> cGate{"Brand has opted clients<br/>into managing consolidation?"}
  cGate -- no --> cReject(["Consolidation write rejected — no request sent"])
  cGate -- yes --> cPut["PUT clients/{id}"]
  cEmpty -- yes --> cNoop(["No consolidation request"])
  diff --> curEmpty{"Currency diff empty?"}
  curEmpty -- no --> curGate{"Preferred-payment-currency change,<br/>AND brand offers that choice?"}
  curGate -- no, and field untouched --> curPut["PUT accounts/{accountId}"]
  curGate -- field touched but choice closed --> curReject(["Currency write rejected — no request sent"])
  curEmpty -- yes --> curNoop(["No currency request"])
  cPut --> invalidate["Invalidate this module's own cache key prefix"]
  curPut --> invalidate
  invalidate --> done(["Save settled"])
```

Guarantees the platform holds: each diff is gated and short-circuited independently — a save that only touches the account's currency fields issues no `clients/{id}` request at all, and a save touching only consolidation fields issues no `accounts/{accountId}` request. The consolidation gate reads the same brand configuration `isAvailable` reads: a missing or staff-only value refuses the write, checked after the empty-diff short-circuit so a currency-only save is unaffected by it.

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

| Sub-composable | Members |
| --- | --- |
| `useActions()` | input, save, revert, clear, readiness, lifecycle |
| `useContext()` | the full context object, model, base model, schema pair, id, title, currency options, errors |
| `useMeta()` | state flags, including visibility and payment-currency-choice |
| `useInternals()` | 4 — actor scope, raw sender, raw service, raw state |

## Services

One services file serves the composable:

| Concern | Where it lives |
| --- | --- |
| Target-client resolution | one function, consumed by every request in the module |
| Addressability predicate | one function; its reactive form feeds `isAvailable` |
| The preference read | the module's own one-shot read of `clients/{id}`, account slice, under this module's own cache entry — never shared with `client-personal-details` |
| The visibility-gate read | resolved once per scope during the loading phase |
| The diff-only update bodies | pure, no side effects beyond the request itself; compares each field by identity, never by truthiness — one body for the consolidation fields, a separate one for the account's currency fields |
| The machine-services adapter | takes the already-scoped services instance as an argument, so the machine inherits the same resolved client as the rest of the module |

The module owns **no machine of its own** — it builds a typed configuration payload for the shared form-editor machine, overriding its actions, guards, and invoked services. The shared machine has no dedicated "revert" event; revert is composed as an ordinary form input carrying the last-saved values back through the same validation path a normal edit takes.

## Errors

Errors are **state**, not events. Nothing in this module raises a toast or notification.

| Surface | Where a failure lands |
| --- | --- |
| Preference read | the machine's context error → `useContext().errors`, `useMeta().hasErrors` |
| Visibility-gate fetch | fails closed: `useMeta().isVisible` stays `false` |
| Save | the machine's context error → `useContext().errors`, `useMeta().hasErrors`; the action also rejects with a detailed error |
| Field validation | the validation errors → `useContext().validationErrors`, `useMeta().isValid` |

## Dependencies

### This module reads from

| Module | Uses |
| --- | --- |
| Active client session | the acting client's identity when no other context is supplied; whether the session is authenticated |
| Brand configuration | the single visibility-gate key |
| The shared request layer | the one-shot preference read, the diff-only PUT, URL building, cache invalidation |
| Localisation | translated caller-facing text on rejected reads and saves |
| The shared form-editor machine | interpreted, never redefined |

### Modules that read from this one

None yet — this is a newly introduced module. Its own scope is deliberately narrower than the wider client-billing surface the legacy application groups it with; a second, not-yet-built capability is expected to become its first consumer once it lands.

## The preference cache entry

This module reads `clients/{id}?with=accounts,accounts.currency` under its own cache entry. `client-personal-details` reads the same client record with a different slice under its own entry, so the two entries never collide and a page mounting both issues one request per module. See [gotchas.md](./gotchas.md#4-the-preference-read-has-its-own-cache-entry--it-is-not-shared-with-client-personal-details).

## Module boundary

The barrel is the module's only public surface: one composable and its type, one scope-matrix constant and its matching type, one context enum, four model types, and four sub-composable types. Curated named re-exports only — no `export *`.

Everything else is internal and carries a file-level internal marker: the services, the mappers, the schemas, and the machine-config file. The machine-config file is **not** a machine definition — it is a configuration payload for the platform's shared, unmodified form-editor machine.
