# client-address-dry

> **This is a factory smoke-test module, not the production one.** `client-address-dry` was built side-by-side with the existing `client-address/` module (which is untouched) to prove out a build process. Nothing in this codebase imports `client-address-dry` yet. Do not point product UI at it without an explicit follow-on decision to promote it over `client-address/`.

A scoped, query-backed collection for a client's postal addresses: list, add, edit, remove, and set-default, reachable as the client themself, as staff acting on behalf of a named client, or as staff acting as a client during impersonation. Follows the scoped-composable pattern — `.as(actor)` + the four-layer return (`useContext` / `useMeta` / `useActions` / `useInternals`), no direct props.

## What is this?

A client can hold one or more postal addresses (one marked default). This module gives one collection composable, `useClientAddressesDry`, that a client, a staff member acting on that client's behalf, and a staff member acting as that client all use to work with the same list — the difference is entirely in _who_ is asking and _whose_ list they're asking about:

- `.as('self')` — the active session's own client, reading/writing their own addresses against the ordinary client endpoint. A staff member acting as a client during impersonation reaches this same path, authenticated as that client.
- `.as('staff').for('client', id)` — a staff member acting on a _named_ client's addresses, retargeted to the legacy admin endpoint under the staff session's own token (never the active session's token, never the client's own endpoint).

> **Staff writes: gated by capability, not yet enabled on an unmodified session today.** The staff arm's `add`/`update`/`setDefault`/`remove`/`refresh`/`ensure` are each `undefined` unless the staff session carries the matching permission code (`list_client_addresses` / `create_client_address` / `update_client_address` / `delete_client_address`). Alongside these, `useMeta()` on the staff scope exposes four readable flags (`canList`/`canCreate`/`canUpdate`/`canDelete`), computed from the exact same permission read that gates the actions, so the two can never silently disagree for the same session. **The permission codes are read off a field the session store does not yet carry through to a staff session's mapped profile, so on today's unmodified session every one of the four flags reads `false` and every gated write is `undefined`, regardless of the staff member's real permissions.** Staff _reads_ (the retargeted list) are unaffected and work today. This module's own code is correct and takes effect the moment that field is populated — see [gotchas.md](./gotchas.md) §1.

## Quick start

```ts
import {
  useClientAddressesDry,
  ScopeActorTypes
} from "@upmind-automation/headless";

// --- the active session's own client
const mine = useClientAddressesDry().as(ScopeActorTypes.SELF);
const { data, default: defaultAddress } = mine.useContext();
const { isLoading, isEmpty } = mine.useMeta();
const { add, remove, setDefault } = mine.useActions();

await add({
  type: 1, // Home
  address: {
    address1: "1 Fixture Street",
    city: "Fixture City",
    postcode: "FX1 1FX",
    countryId: countryId
  }
});

// --- staff acting on a named client's addresses
const asStaff = useClientAddressesDry()
  .as(ScopeActorTypes.STAFF)
  .for("client", targetClientId);

const staffMeta = asStaff.useMeta();
const staffActions = asStaff.useActions();
if (staffMeta.canDelete) {
  // undefined today on an unmodified session — see the callout above
  await staffActions.remove?.(addressId);
}
```

## Actor usage

| Call                                                                                   | Meaning                                                                                       | Works on an unmodified session today?                                   |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `useClientAddressesDry().as('self')`                                                   | The active session's own address list — read + write                                          | Yes                                                                     |
| `useClientAddressesDry().as('self')` under an impersonation session                    | Staff acting as a client — that client's own list, read + write, authenticated as that client | Yes                                                                     |
| `useClientAddressesDry().as('staff').for('client', id)` — reads                        | Staff reading a named client's address list (admin endpoint, staff token)                     | Yes                                                                     |
| `useClientAddressesDry().as('staff').for('client', id)` — writes                       | Staff add/update/remove/setDefault/ensure on a named client's addresses                       | **No — gated off pending a session-store field; see the callout above** |
| `useClientAddressesDry().as('staff').for('client', id)` — `useMeta()` permission flags | Readable preview of which of the four write actions the staff session may perform             | Reads `false` for all four today, for the same reason                   |

`.as(...)` takes the `ScopeActorTypes` enum. There is no `guest` scope for this module — addresses are a client-identity concern.

## Layers

Query-backed (TanStack), no state machine:

- `useContext()` → `data`, `default`, `error`, `findOne`, `getOne`, `lookups` (country/region), `model` (new-address form seed), `pagination`, `schema`, `uischema`
- `useMeta()` → `isError`, `isEmpty`, `isLoading`, `isAvailable`, `isAuthenticated` (alias of `isAvailable`) — plus, staff-only, `canList`/`canCreate`/`canUpdate`/`canDelete`
- `useActions()` → `destroy`, `isReady`, `add`, `update`, `ensure`, `remove`, `setDefault`, `refresh`, `nextPage`, `prevPage`, `invalidate`, `getOne`, `findOne`, `parse`, `validate`, `filters.query` — plus, staff-only and permission-conditional, the same `add`/`update`/`setDefault`/`remove`/`refresh`/`ensure` keys (value `undefined` when the permission is absent)
- `useInternals()` → `actorScope`, `query`, `service`, `queryKey`

Two arms exist, and only two: **services** (`client-address-dry.services.staff.ts` — retargets list + every mutation to `admin/clients/{id}/addresses` under the staff session token) and **actions** (`useClientAddressesDry.actions.staff.ts` — the permission gate), plus a small third: **meta** (`useClientAddressesDry.meta.staff.ts` — the readable permission flags, sourced from the same computed permission bundle the actions arm gates on). `context` and `schemas` stay shared — identical shape for every actor; see [architecture.md](./architecture.md).

## Gotchas (summary — full detail in [gotchas.md](./gotchas.md))

- Staff writes are gated off on an unmodified session today pending a session-store field (§1).
- A record that arrived through a bulk import surfaces identically to any other row in this collection — no distinguishing flag, no edit/delete lockout (§2).
- `.inBrand(id)` only ever seeds a new address's country from the _session's own active brand_ — naming a different brand id has no resolution path in headless today (§3).
- `useInternals().service` is a deliberate, ungated escape hatch — it bypasses the staff permission gate by design, consistent with every other scoped module (§4).
- A create that already matches an existing address for the client is rejected outright, not silently deduplicated (§5).
- `remove()` on a non-deletable address and a soft-succeeded create/update both resolve without throwing — check the returned value, not just whether the call rejected (§6).

## Documentation

| Doc                                  | Audience                | What's inside                                                       |
| ------------------------------------ | ----------------------- | ------------------------------------------------------------------- |
| **This README**                      | Everyone                | Overview, actor usage, quick start                                  |
| [usage.md](./usage.md)               | Developers              | Full API reference, copy-paste examples                             |
| [architecture.md](./architecture.md) | Internal / Contributors | Services/actions/meta arm resolution, query lifecycle, dependencies |
| [gotchas.md](./gotchas.md)           | Everyone                | Edge cases, testable expected behaviour                             |
| [foundation.md](./foundation.md)     | Platform reference      | Framework-agnostic capability description (rebuild-oriented)        |
| [CHANGELOG.md](./CHANGELOG.md)       | Everyone                | Version history, known limitations                                  |

## Tests

- `__tests__/client-address-dry.contract.test.ts` — unit: scope-matrix shape, `type`-required schema.
- `__tests__/client-address-dry.client.int.test.ts` — integration: client/self CRUD, delete-eligibility guard, staged-import read parity, cart-shape invariant, permission flags absent for a client.
- `__tests__/client-address-dry.staff.int.test.ts` — integration: the admin-path retarget proof (URL + staff-token, asserted on the outbound request, not the response), permission gating on writes, the readable permission flags, the `ensure` create-gate.
- `__tests__/client-address-dry.impersonation.int.test.ts` — integration: a staff member acting as a client reaches the client path under the impersonation client's own token, never the staff token, never the admin path.
- `__tests__/*.must-fail.patch` — colocated negative-control fixtures (one per guard); apply → run → confirm red for the stated reason → revert.
