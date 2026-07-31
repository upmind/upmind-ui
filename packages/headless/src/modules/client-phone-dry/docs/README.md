# client-phone-dry

> **This is a factory smoke-test module, not the production one.** `client-phone-dry` was built side-by-side with the existing `client-phone/` module (which is untouched) to prove out the `/scoped-composable-factory` build path — specifically, whether the factory can deliver a genuine staff-on-behalf-of retarget instead of the `client-email` pilot's cosplayed one (scope shape present, `.for('client', id)` silently dropped — the FE-2824 archetype). Nothing in this codebase imports `client-phone-dry` yet. Do not point product UI at it without an explicit follow-on decision to promote it over `client-phone/`.
>
> Source of truth for the story: `docs/sdd/client-phone-dry-smoke/` (`design.md`, `parity.yaml`, `evidence/verify.md`, `evidence/operator-ruling-functionalities-waiver.md`).

A scoped, query-backed collection for a client's phone numbers: list, add, edit, remove, and set-default, reachable either as the client themself or as staff acting on a named client's behalf. Follows the ADR-001 scope pattern — `.as(actor)` + the four-layer return (`useContext` / `useMeta` / `useActions` / `useInternals`), no direct props.

## What is this?

A client can hold one or more phone numbers (one marked default). This module gives one collection composable, `useClientPhonesDry`, that both a client and a staff member use to work with that list — the difference is entirely in _who_ is asking and _whose_ list they're asking about:

- `.as('self')` — **Cell A**: the active session's own client, reading/writing their own phones against the ordinary client endpoint.
- `.as('staff').for('client', id)` — **Cell B**: a staff member acting on a _named_ client's phones, retargeted to the legacy admin endpoint under the staff session's own token (never the active session's token, never the client's own endpoint).

> **Staff writes today: gated off, not broken.** The staff arm's `add`/`update`/`setDefault`/`remove`/`ensure`/`refresh` are each `undefined` unless the staff session carries the matching capability code (`list_client_phones` / `create_client_phone` / `update_client_phone` / `delete_client_phone`). On the **unmodified prod path today, every staff session resolves zero capabilities** — the field the gate reads (`functionalities`) is fetched from `/admin/self` but not yet carried through `session-store`'s mapped session user. Staff writes are **delivered-conditional on that pending `session-store` wiring**, not unconditionally shipped. Staff _reads_ (the retargeted list) are unaffected and work today. See [gotchas.md](./gotchas.md) §1 for the full account and the sibling precedent (`session-store/docs/FE-2825-note.md`).

## Quick start

```ts
import {
  useClientPhonesDry,
  ScopeActorTypes
} from "@upmind-automation/headless";

// --- Cell A: the active session's own client
const mine = useClientPhonesDry().as(ScopeActorTypes.SELF);
const { data, default: defaultPhone } = mine.useContext();
const { isLoading, isEmpty } = mine.useMeta();
const { add, remove, setDefault } = mine.useActions();

await add({
  type: 1, // mobile
  phone: {
    number: "+15559876543",
    nationalNumber: "5559876543",
    countryCallingCode: "1",
    country: "US"
  }
});

// --- Cell B: staff acting on a named client's phones
const asStaff = useClientPhonesDry()
  .as(ScopeActorTypes.STAFF)
  .for("client", targetClientId);

const staffActions = asStaff.useActions();
// undefined today on the unmodified prod path — see the callout above
if (staffActions.remove) {
  await staffActions.remove(phoneId);
}
```

## Actor usage

| Call                                                          | Meaning                                                                 | Works on unmodified prod path today?                                     |
| ------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `useClientPhonesDry().as('self')`                             | The active session's own phone list — read + write                      | Yes                                                                      |
| `useClientPhonesDry().as('staff').for('client', id)` — reads  | Staff reading a named client's phone list (admin endpoint, staff token) | Yes                                                                      |
| `useClientPhonesDry().as('staff').for('client', id)` — writes | Staff add/update/remove/setDefault/ensure on a named client's phones    | **No — gated off pending `session-store` wiring; see the callout above** |

`.as(...)` takes the `ScopeActorTypes` enum. There is no `guest` cell for this module — phones are a client-identity concern, ADR-001 §"actor × context" applies with only `client`/self and `staff`.for('client', id) populated.

## Layers

Query-backed (TanStack), no state machine:

- `useContext()` → `data`, `default`, `error`, `findOne`, `getOne`, `lookups` (country), `model` (new-phone form seed), `pagination`, `schema`, `uischema`, `isStaged(phone)`, `canEdit(phone)`
- `useMeta()` → `isError`, `isEmpty`, `isLoading`, `isAvailable`, `isAuthenticated` (alias of `isAvailable`)
- `useActions()` → `destroy`, `isReady`, `add`, `update`, `ensure`, `remove`, `setDefault`, `refresh`, `nextPage`, `prevPage`, `invalidate`, `parse`, `validate`, `filters.query` — plus, staff-only and capability-conditional, the same `add`/`update`/`setDefault`/`remove`/`refresh`/`ensure` keys (value `undefined` when the capability is absent)
- `useInternals()` → `actorScope`, `query`, `service`, `queryKey`

Two arms exist, and only two: **services** (`client-phone-dry.services.staff.ts` — retargets list + every mutation to `admin/clients/{id}/phones` under the staff session token) and **actions** (`useClientPhonesDry.actions.staff.ts` — the capability gate). `context`, `meta`, and `schemas` stay armless — identical shape for both cells; see [architecture.md](./architecture.md).

## Gotchas (summary — full detail in [gotchas.md](./gotchas.md))

- Staff writes are gated off on the unmodified prod path pending a `session-store` change (§1).
- `.inBrand(id)` only ever seeds a new phone's country from the _session's own active brand_ — naming a different brand id has no resolution path in headless today (§2).
- No captured wire fixtures back this module's endpoints yet — the sample data in these docs is hand-authored (matching the test suite's own mocks), not an ADR-025 recording (§3).
- `useInternals().service` is a deliberate, ungated escape hatch — it bypasses the staff capability gate by design, consistent with every other scoped module (§4).

## Documentation

| Doc                                  | Audience                | What's inside                                                  |
| ------------------------------------ | ----------------------- | -------------------------------------------------------------- |
| **This README**                      | Everyone                | Overview, actor usage, quick start                             |
| [usage.md](./usage.md)               | Developers              | Full API reference, copy-paste examples                        |
| [architecture.md](./architecture.md) | Internal / Contributors | Services/actions arm resolution, query lifecycle, dependencies |
| [gotchas.md](./gotchas.md)           | Everyone                | Edge cases, testable expected behaviour                        |
| [foundation.md](./foundation.md)     | Platform reference      | Framework-agnostic capability description (rebuild-oriented)   |
| [CHANGELOG.md](./CHANGELOG.md)       | Everyone                | Version history, known limitations                             |

## Tests

- `__tests__/client-phone-dry.contract.test.ts` — unit: ADR-001 scope-matrix shape, D2 `type`-required schema.
- `__tests__/client-phone-dry.cell-a.int.test.ts` — integration: client/self CRUD, `can_delete` guard, staged-import lockout, cart-shape invariant.
- `__tests__/client-phone-dry.cell-b.int.test.ts` — integration: the A7 retarget proof (URL + staff-token, asserted on the outbound request, not the response), capability gating, the `ensure` create-gate.
- `__tests__/*.must-fail.patch` — five colocated negative-control fixtures (one per guard); apply → run → confirm RED for the stated reason → revert, per `verify-negative-controls.companion.md`.

See `docs/sdd/client-phone-dry-smoke/evidence/test-report.md` and `evidence/verify.md` for the full run record.
