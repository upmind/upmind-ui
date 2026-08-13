# Changelog

All notable changes to the `client-phone` module are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

This release converts `client-phone` from a pre-scope module (bare `useClientPhones()`, `useClientPhoneManager(id, opts)`) onto this codebase's scope-based composable architecture. Both the collection and the per-phone editor are converted and shipped together — this module starts from zero prior test coverage, so every fixture in this release is a first capture against a live environment, not a regression baseline.

### Added

- **Both composables are now scoped.** `useClientPhones().as('self')` and `useClientPhoneManager().as('self').for('phone', id)` / `.fresh()` replace the old bare calls. Two scope matrices, one services factory, one cache key, one identity seam.
- **`useClientPhones().useMeta().isAvailable`** — reports whether this scope can address a client at all. It is `true` only when the session is authenticated **and** the scope resolved a client id, it is reactive, and it is the _same predicate_ every request gate in the module calls rather than a second copy of it.
- **A per-phone read behind the editor** — opening one number no longer requires the whole collection to have loaded first, or the manager reaching into the collection's own instance to seed itself.
- **Form definition through the editor** — `useContext().schema` and `.uischema`, adopted by the editor and served as a pair. The pair is also published as plain copy-pasteable JSON in [usage.md](./usage.md#the-form-definition--paste-ready).
- **A recorded-fixture corpus and full colocated test set** — this module shipped with zero tests before this release; it now has unit, integration and negative-control coverage, all replayed against genuinely captured requests and responses.
- **A colocated `.feature` specification** mapping every acceptance criterion this conversion was measured against to an executable scenario.

### Changed

- **The editor's `useMeta()` returns flat computeds, not a single `meta` object.** Read `useMeta().isValid`; the `meta.value.isValid` form is gone. See the migration guide below.
- **`isReady()` and `onDone()` on the editor are now bounded at 60 seconds**, converting an unbounded upstream stall into a reportable timeout instead of a silent hang. See [gotchas.md](./gotchas.md#4-isready-and-ondone-are-bounded-at-60-seconds).
- **`refresh()` rejects with `NotAuthenticatedError`** when the scope cannot address a client — both before the request is issued and if the session dies mid-flight. Every other collection read resolves quietly.
- **The collection's `useMeta()` is four members** — `hasError`, `isAvailable`, `isEmpty`, `isLoading`.
- **Cross-module find-or-create moved onto the scoped collection.** Consumers composing this module's phone number into a contact record or a billing form now call `useClientPhones().as('self').useActions().ensure(...)` rather than a bare services import.
- **Documentation refreshed against the shipped surface** — README, usage, architecture, gotchas and foundation now describe both composables, the real recorded fixtures, and the real failure modes.

### Removed

- **The advertised `clientId` construction option on the editor is gone.** It was never wired to anything — no service read it and no request URL was ever retargeted by it — so nothing that previously worked stops working. It is removed rather than carried forward unwired, because leaving an option in place that a consumer's JSDoc-reading could believe worked is worse than removing it outright. Tracked for a follow-up issue (see "Not captured" below).
- **The bare form-schema export pair leaves the module's public surface.** The schema and UI schema are reachable only through the editor's context now — see [usage.md](./usage.md#the-form-definition--paste-ready) for the one exception and how it is resolved without re-exporting the pair.
- **The services module leaves the public surface.** It is now internal-only; every request the module issues goes through the two composables.

### Fixed

- **Every request URL derives its target client from the resolved scope**, through one seam shared by the collection, the editor and every request-issuing function — the list read, the per-address read, create, update, find-or-create, delete and set-default. An instance addresses exactly the client its scope named.
- **A latent guard bug that could let an unauthenticated, clientless request reach the wire is corrected.** The pre-conversion guard on delete and set-default used a logic operator inconsistent with every other guard in the same file, which resolved permissive rather than restrictive for that one edge case. The corrected guard is the same addressability predicate every other request gate in the module now shares.
- **`isNew` is a real, working flag.** The pre-conversion computation could only ever evaluate to `false`, regardless of whether the editor was on a fresh draft or an existing record. It now reads the same context field the underlying state machine's own guard reads.
- **Opening an existing record and starting a fresh draft no longer feed the same empty input to the form parser.** The pre-conversion lookup step never read the existing record before seeding the form, so both cases produced an indistinguishable, empty starting point. The lookup now runs before the seed in both cases.
- **A circular barrel-load fault that could make the module unimportable under certain import orders is resolved**, by importing the scope-building utility from its own file rather than through an aggregating barrel that could still be mid-evaluation when this module's own top-level setup ran.
- **Eight type-safety suppressions are eliminated** from the module's source as part of the conversion, with no behaviour change.

### Recorded fixtures

Genuinely captured request/response pairs back every documented behaviour — this module had none before this release:

| Fixture                                                    | Covers                                             |
| ---------------------------------------------------------- | -------------------------------------------------- |
| `get-clients-id-phones.json`                               | the unpaged list read                              |
| `get-clients-id-phones-case-page-1.json`                   | first page, `limit=2&offset=0`                     |
| `get-clients-id-phones-case-page-2.json`                   | second page, `limit=2&offset=2`                    |
| `get-clients-id-phones-id.json`                            | the per-phone read                                 |
| `post-clients-id-phones.json`                              | create (request body captured too)                 |
| `put-clients-id-phones-id.json`                            | change the phone's value                           |
| `put-clients-id-phones-id-case-set-default.json`           | promote a number to default                        |
| `put-clients-id-phones-id-case-error.json`                 | a `422` rejection on an invalid phone id           |
| `delete-clients-id-phones-id.json`                         | delete                                             |
| `get-countries.json` / `get-countries-filter-code-gb.json` | reference country data the editor resolves against |

### Notes

- Both composables act on the calling client's own collection only, today. `staff` and `guest` are compile-time errors in both scope matrices.
- `remove()` and `setDefault()` raise a user-visible success or failure message; every other capability in this module — including the whole editor half — does not. This asymmetry is deliberate; see [gotchas.md](./gotchas.md#8-remove-and-setdefault-raise-feedback--nothing-else-does).
- A number's category (`type`) and its verification flag are both display-only. See "Not captured" below for why the latter is not a drop.

### Not captured

- **Twelve real capabilities an older, non-headless implementation of this same collection demonstrably supports are recorded as deliberate, signed drops from this release, each awaiting a tracked follow-up issue:** the whole staff-facing surface for managing a client's numbers on their behalf (a distinct admin endpoint family, capability gates, an "acting as this client" mode, staff-specific copy), the removed-not-wired editor option noted above, and a handful of other client-facing behaviours that older implementation had (a required category selector on the form, a staged-imports list flag, a deterministic sort order on the list, and success toasts on add/edit). None of these twelve were working capabilities of this module immediately prior to this release — the staff surface, the category selector, the staged-imports flag, the sort order and the add/edit toasts were all already absent here, and the editor option never functioned even though it was present. This release makes each one a recorded, signed decision rather than an inherited, silent absence. As of this writing, the tracking references for these twelve are still pending — this changelog will be updated with them once filed.
- **Phone number verification does not exist anywhere in this module's recorded history**, before or after this conversion. `meta.isVerified` is exposed for display because the underlying record carries the flag; there has never been an action to change it. This is a recorded fact, not a drop — see [gotchas.md](./gotchas.md#12-no-phone-verification-exists--in-this-module-or-in-what-it-was-converted-from).

---

## Migration Guide

### Getting an instance

**Breaking change:** both composables are now scoped and require `.as('self')`.

```ts
// Before
import {
  useClientPhones,
  useClientPhoneManager
} from "@upmind-automation/headless";
const phones = useClientPhones();
const manager = useClientPhoneManager(phoneId);
const draft = useClientPhoneManager();

// After
const phones = useClientPhones().as("self");
const manager = useClientPhoneManager().as("self").for("phone", phoneId);
const draft = useClientPhoneManager().as("self").fresh();
```

### Reading state — the four-layer destructure

**Breaking change:** every member now lives behind one of `useActions()` / `useContext()` / `useMeta()` / `useInternals()`, not on the composable's own return value.

```ts
// Before
const { data, default: defaultPhone, isReady } = useClientPhones();

// After
const phones = useClientPhones().as("self");
const { data, default: defaultPhone } = phones.useContext();
const { isReady } = phones.useActions();
```

### Reading the editor's state flags

**Breaking change:** the editor's `useMeta()` returns one computed per flag instead of a single `meta` object.

```ts
// Before
const { meta } = manager.useMeta();
if (meta.value.isValid) await save();

// After
const { isValid } = manager.useMeta();
if (isValid.value) await save();
```

Flags available: `hasErrors`, `isAvailable`, `isComplete`, `isDirty`, `isLoading`, `isNew`, `isProcessing`, `isValid`.

### The removed `clientId` editor option

**Breaking change:** the editor no longer accepts a `clientId` construction option.

```ts
// Before (never actually worked — see the changelog entry above)
useClientPhoneManager(phoneId, { clientId: someOtherClientId });

// After — there is no equivalent today; the editor always addresses the session's own client
useClientPhoneManager().as("self").for("phone", phoneId);
```

If your integration relied on this option, it was not functioning before this release either — no request was ever retargeted by it. Track the follow-up issue for the underlying capability once it is filed.

### Cross-module find-or-create

**Breaking change:** a bare services import for find-or-create is gone.

```ts
// Before
import { useClientPhoneServices } from "@upmind-automation/headless";
await useClientPhoneServices().ensure({ phone });

// After
import { useClientPhones } from "@upmind-automation/headless";
import { ScopeActorTypes } from "@upmind-automation/headless";
await useClientPhones().as(ScopeActorTypes.SELF).useActions().ensure({ phone });
```

### Obtaining the form definition

```ts
// Before
import { usePhoneSchema, usePhoneUischema } from "@upmind-automation/headless";

// After
const { schema, uischema } = manager.useContext();
```
