# Changelog

All notable changes to the `client-address` module are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

This release converts `client-address` from a pre-scope module (bare `useClientAddresses()`, `useClientAddressManager(id, opts)`) onto this codebase's scope-based composable architecture. Both the collection and the per-address editor are converted and shipped together, matching the merged `client-phone` and `client-company` conversions' shape.

### Added

- **Both composables are now scoped.** `useClientAddresses().as('client')` and `useClientAddressManager().as('client').for('address', id)` / `.fresh()` replace the old bare calls. Two scope matrices, one services factory, one cache key, one identity seam.
- **`useClientAddresses().useMeta().isAvailable`** — reports whether this scope can address a client at all. It is `true` only when the session is authenticated **and** the scope resolved a client id, it is reactive, and it is the _same predicate_ every request gate in the module calls rather than a second copy of it.
- **A per-address read behind the editor** — opening one address no longer requires the whole collection to have loaded first.
- **The editor pins its resolved client for its own lifetime.** An open form addresses the account it was opened for, even if the session subsequently moves to a different client. The collection does not pin — it follows the live session.
- **Form definition through the editor** — `useContext().schema` and `.uischema`, adopted by the editor and served as a pair. The pair is also published as plain copy-pasteable JSON in [usage.md](./usage.md#the-form-definition--paste-ready).
- **Two schema fragment functions on the barrel** — `useSchemaDefinitions()` / `useUischemaDefinitions()` — for the two consumers that compose the address form's fields into a parent schema at module scope, where no editor instance exists to read from. See [gotchas.md](./gotchas.md#14-the-schema-fragment-functions-are-for-composing-this-form-into-another-one--not-for-rendering-it).
- **A recorded-fixture corpus and full colocated test set** — unit, integration and negative-control coverage, replayed against genuinely captured requests and responses.
- **A colocated `.feature` specification** mapping every acceptance criterion this conversion was measured against to an executable scenario.

### Changed

- **The editor's `useMeta()` returns flat computeds, not a single `meta` object.** Read `useMeta().isValid`; the `meta.value.isValid` form is gone.
- **`isReady()` and `onDone()` on the editor are now bounded**, converting an unbounded upstream stall into a reportable timeout instead of a silent hang.
- **`refresh()` rejects with `NotAuthenticatedError`** when the scope cannot address a client — both before the request is issued and if the session dies mid-flight. Every other collection read resolves quietly.
- **The collection's `useMeta()` is seven members** — `hasError`, `hasNextPage`, `hasPages`, `hasPrevPage`, `isAvailable`, `isEmpty`, `isLoading`.
- **`useClientAddressServices` is retired, not deprecated.** Its callers now reach find-or-create through `useClientAddresses().as('client').useActions().ensure(...)` — passing the model directly, not wrapped in `{ model }`. See [gotchas.md](./gotchas.md#13-useclientaddressservices-is-retired-not-deprecated).
- **A region cleared by a country change now reaches the wire as an explicit `region_id: null` on an edit**, rather than being silently dropped by serialisation. A create with no region chosen still sends no `region_id` key at all — the two cases are deliberately not the same wire shape. See [gotchas.md](./gotchas.md#8-a-country-change-clears-the-region-differently-depending-on-whether-the-address-is-new).
- **The update limb of the editor's save resolves the same mapped shape as the create limb**, so a successful edit's saved model is derived consistently rather than a raw wire response silently reverting the model to its pre-edit values on `setModel`.
- **Documentation refreshed against the shipped surface** — README, usage, architecture, gotchas and foundation now describe both composables, the real recorded fixtures, and the real failure modes.

### Removed

- **The advertised `clientId` construction option on the editor is gone.** It was never wired to anything — no service read it and no request URL was ever retargeted by it — so nothing that previously worked stops working. It is removed rather than carried forward unwired.
- **The bare form-schema export pair (the parsed schema/uischema, as opposed to the fragment builders) leaves the module's public surface.** They are reachable only through the editor's context now — see [usage.md](./usage.md#the-form-definition--paste-ready).
- **The services module leaves the public surface.** It is now internal-only; every request the module issues goes through the two composables.

### Fixed

- **Every request URL derives its target client from the resolved scope**, through one seam shared by the collection, the editor and every request-issuing function — the list read, the per-address read, create, update, find-or-create, delete and set-default. An instance addresses exactly the client its scope named. Previously, several call sites each re-read the session independently, and the editor's own `clientId` construction option never reached a URL at all.
- **A latent guard bug that could let an unauthenticated, clientless request reach the wire is corrected on `remove` and `setDefault`.** The pre-conversion guard used a logic operator inconsistent with every other guard in the same file, which resolved permissive rather than restrictive for that one edge case.
- **A country change that made the previously-selected region invalid used to wedge the form.** An unresolvable country previously threw inside the form-parsing step, and the shared machine's parsing state has no error handler for it — the editor sat in a `parsing` state indefinitely, with no request ever issued. A fallback to a selectable country now keeps the draft usable.
- **A region cleared by a country change no longer leaves the server holding a stale region.** The pre-conversion body omitted the field on a clearance, which the server read as "unchanged" rather than "cleared"; an explicit `null` now clears it.
- **`nextPage()` / `prevPage()` now settle as a rejection instead of throwing synchronously** when called through this surface, so a forced call always settles rather than escaping as an uncaught exception.
- **Eight type-safety suppressions are eliminated** from the module's source as part of the conversion, with no behaviour change.

### Recorded fixtures

Genuinely captured request/response pairs back every documented behaviour:

| Fixture                                                              | Covers                                                     |
| ------------------------------------------------------------------------ | -------------------------------------------------------------- |
| `get-clients-id-addresses.json`                                      | the unpaged list read, with embedded region/country            |
| `get-clients-id-addresses-case-page-1.json`                         | first page, `limit=2&offset=0` (services-layer paging only)    |
| `get-clients-id-addresses-case-page-2.json`                         | second page, `limit=2&offset=2`                                 |
| `get-clients-id-addresses-case-query-filter-query-london.json`      | the filtered list read                                          |
| `get-clients-id-addresses-id.json`                                  | the per-address read                                            |
| `post-clients-id-addresses.json`                                    | create (request body captured too)                              |
| `put-clients-id-addresses-id.json`                                  | a diff-only edit                                                 |
| `put-clients-id-addresses-id-case-set-default.json`                 | promote an address to default                                   |
| `put-clients-id-addresses-id-case-set-default-rejected.json`        | a `422` rejection on an invalid address id                       |
| `delete-clients-id-addresses-id.json`                               | delete                                                           |
| `delete-clients-id-addresses-id-case-remove-rejected.json`          | a `409` rejection on a delete the platform refuses               |
| `get-countries.json`                                                | the country reference data the editor resolves against           |
| `get-countries-id-regions-case-country-a.json` / `-case-country-b.json` | region lists for two different countries, exercising the country-change re-resolution |
| `get-config-brand-values-*.json`                                    | the brand's address-form rules (region-required, country-locked) |

### Notes

- Both composables act on the calling client's own collection only, today. `staff`, `self` and `guest` are compile-time errors in both scope matrices — this module resolves on `client`, not `self`.
- `remove()` and `setDefault()` raise a user-visible success or failure message; every other capability in this module — including the whole editor half — does not. This asymmetry is deliberate; see [gotchas.md](./gotchas.md#6-remove-and-setdefault-raise-feedback--nothing-else-does).
- An address's verification level is display-only. Nothing in this module changes it.
- The address type can be changed on an existing address, but not chosen on create — see [gotchas.md](./gotchas.md#9-the-address-type-can-be-changed-on-an-existing-address--but-not-chosen-on-create).

### Not captured

- **Staff address management is recorded as a deliberate, signed drop from this release, awaiting a tracked follow-up issue:** the admin endpoint family for staff creating, updating or deleting a client's address on their behalf; acting-as-the-client impersonation while doing so; the three capability gates that govern it; a per-client admin cache scope; and a staff-only copy-address-to-clipboard affordance. None of these were working capabilities of this module immediately prior to this release for a headless consumer — this release makes the omission a recorded, signed decision rather than an inherited, silent absence. As of this writing, the tracking reference for this drop is still pending.
- **A dedicated wire-level request naming exactly this form's two brand-config keys** cannot always be demonstrated, because of a shared cross-module configuration cache's own behaviour. This is a limitation of what can be shown on the wire, not a missing capability: the settings the request would confirm (country lock, region requirement) work correctly regardless. See [gotchas.md](./gotchas.md#12-the-brand-config-request-behind-the-country-lock-and-region-requirement-may-never-be-independently-observable).
- **Two consumer applications outside this package** (a hosting funnel and a separate checkout funnel, both maintained in their own repositories) read this module's default-address reporting through its pre-conversion shape and are not part of this release; they will not type-check against the new scoped surface until a small follow-up change points them at it, which is not itself part of this release.

---

## Migration Guide

### Getting an instance

**Breaking change:** both composables are now scoped and require `.as('client')`.

```ts
// Before
import {
  useClientAddresses,
  useClientAddressManager
} from "@upmind-automation/headless";
const addresses = useClientAddresses();
const manager = useClientAddressManager(addressId);
const draft = useClientAddressManager();

// After
const addresses = useClientAddresses().as("client");
const manager = useClientAddressManager().as("client").for("address", addressId);
const draft = useClientAddressManager().as("client").fresh();
```

### Reading state — the four-layer destructure

**Breaking change:** every member now lives behind one of `useActions()` / `useContext()` / `useMeta()` / `useInternals()`, not on the composable's own return value.

```ts
// Before
const { data, default: defaultAddress, isReady } = useClientAddresses();

// After
const addresses = useClientAddresses().as("client");
const { data, default: defaultAddressId } = addresses.useContext();
const { isReady } = addresses.useActions();
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
useClientAddressManager(addressId, { clientId: someOtherClientId });

// After — there is no equivalent today; the editor always addresses the
// account the scope resolved
useClientAddressManager().as("client").for("address", addressId);
```

If your integration relied on this option, it was not functioning before this release either — no request was ever retargeted by it.

### `useClientAddressServices` is retired

**Breaking change:** a bare services import is gone.

```ts
// Before
import { useClientAddressServices } from "@upmind-automation/headless";
await useClientAddressServices().ensure({ model: addressModel });

// After
import { useClientAddresses } from "@upmind-automation/headless";
import { ScopeActorTypes } from "@upmind-automation/headless";
await useClientAddresses()
  .as(ScopeActorTypes.CLIENT)
  .useActions()
  .ensure(addressModel); // the model DIRECTLY, no { model } wrapper
```

### Obtaining the form definition

```ts
// Before
import { useAddressSchema, useAddressUischema } from "@upmind-automation/headless";

// After — rendering the address form standalone
const { schema, uischema } = manager.useContext();

// After — composing the address FIELDS into a parent schema (a different job)
import {
  useSchemaDefinitions,
  useUischemaDefinitions
} from "@upmind-automation/headless";
```

### `default()` still returns an id, not the row

Unchanged in shape from the pre-conversion collection, and worth restating because it is easy to assume otherwise on a first read: `useContext().default()` resolves the default address's `id`. Chain `getOne(default())` for the full record. See [gotchas.md](./gotchas.md#1-default-returns-an-id-not-the-row).
