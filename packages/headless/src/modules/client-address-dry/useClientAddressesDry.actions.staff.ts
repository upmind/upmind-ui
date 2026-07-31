import { useCollection } from "../../utils";
import type {
  Address,
  AddressModel,
  ClientAddressDryListQuery,
  ClientAddressDryServices,
  ClientAddressDryStaffCapabilities
} from "./client-address-dry.types";

// -----------------------------------------------------------------------------
/**
 * @module client-address-dry/useClientAddressesDry.actions.staff
 * @description Staff-specific collection actions — parity #8 capability
 * gating (ADR-001 §6, AC-B3/AC-B4). Populated ONLY for the `staff` arm;
 * shared actions stay in `useClientAddressesDry.actions.ts`. Each member's
 * VALUE is `undefined` when the staff session lacks the matching capability
 * code — `typeof actions.remove === 'undefined'` either way (ADR-001 §6's own
 * example), never a present callable that silently no-ops. Mirrors the
 * shipped `useClientPhonesDry.actions.staff.ts`.
 *
 * `capabilities` is NOT computed here — it is the SAME
 * `getClientAddressDryStaffCapabilities()` bundle the entry factory computes
 * ONCE per scope and also hands to the `meta.staff` arm (D-ADDR-5, single
 * source of truth); this arm never runs its own independent
 * `hasStaffCapability` lookup.
 */
export function createStaffClientAddressDryActions(
  service: ClientAddressDryServices,
  query: ClientAddressDryListQuery,
  capabilities: ClientAddressDryStaffCapabilities
) {
  const { getOne } = useCollection<Address>(query.data);

  const { canList, canCreate, canUpdate, canDelete } = capabilities;

  return {
    /**
     * OVERRIDING MEMBER — same key as the shared `refresh`.
     * @decision
     * what: `refresh` is `undefined` unless the staff session carries
     *   `list_client_addresses`.
     * why: parity #8 (ADR-001 §6) — a staff member without list capability
     *   should not be able to (re)issue the retargeted admin list read.
     * rejected: leaving `refresh` unconditionally shared — that would let a
     *   staff session without `list_client_addresses` still refetch the
     *   admin list, the exact gap parity #8 closes.
     */
    refresh: canList ? query.refetch : undefined,

    /**
     * OVERRIDING MEMBER — same key as the shared `add`.
     * @decision
     * what: `add` is `undefined` unless the staff session carries
     *   `create_client_address`.
     * why: parity #8 — the shared member exposes `add` unconditionally; this
     *   arm conditions it on the staff capability legacy also requires.
     * rejected: an always-present `add` that internally checks the
     *   capability and no-ops — rejected because ADR-001 §6's contract is
     *   the PROPERTY itself reading `undefined`
     *   (`typeof actions.remove === 'undefined'`), not a callable that
     *   silently declines.
     */
    add: canCreate ? (model: AddressModel) => service.add(model) : undefined,

    /**
     * OVERRIDING MEMBER — same key as the shared `ensure`.
     * @decision
     * what: `ensure` is `undefined` unless the staff session carries
     *   `create_client_address` — gated identically to `add` above; when
     *   present it still resolves through `service.ensure`, which composes
     *   over THIS arm's own `loadList`/`add` overrides (admin path + staff
     *   token), so a granted `ensure()` still lands correctly on the target
     *   client.
     * why: `service.ensure` is find-or-create — its create branch calls the
     *   very same `resolvedAdd` the gated `add` member above calls. Left
     *   shared/ungated, a staff session WITHOUT `create_client_address`
     *   could still create an address via `ensure({not-in-list})`, bypassing
     *   parity #8's create gate entirely (ADR-001 §6) — the FE-2824
     *   fail-open archetype this smoke test exists to close (mirrors the
     *   `client-phone-dry` repair-cycle-1 lesson this module's code-handoff
     *   cites).
     * rejected: (a) leaving `ensure` shared/ungated — the row never reasoned
     *   about `ensure`'s create branch, so its silence is not a considered
     *   scope decision; (b) removing `ensure` from the staff surface
     *   outright — it is a named member of the design.md §2 `useActions()`
     *   contract, worth preserving under the same gate as `add` rather than
     *   deleting.
     */
    ensure: canCreate
      ? (model: AddressModel) => service.ensure(model)
      : undefined,

    /**
     * OVERRIDING MEMBER — same key as the shared `update`.
     * @decision
     * what: `update` is `undefined` unless the staff session carries
     *   `update_client_address`.
     * why: parity #8, same as `add` above.
     * rejected: same as `add` above.
     */
    update: canUpdate
      ? (id: Address["id"], model: AddressModel) => service.update(id, model)
      : undefined,

    /**
     * OVERRIDING MEMBER — same key as the shared `setDefault`.
     * @decision
     * what: `setDefault` is `undefined` unless the staff session carries
     *   `update_client_address` (legacy gates `makeDefault` on the same
     *   capability, `vue-app/.../addresses.ts:203`).
     * why: parity #8, same as `add` above.
     * rejected: same as `add` above.
     */
    setDefault: canUpdate
      ? (id: Address["id"]) => service.setDefault(id).mutateAsync()
      : undefined,

    /**
     * OVERRIDING MEMBER — same key as the shared `remove`.
     * @decision
     * what: `remove` is `undefined` unless the staff session carries
     *   `delete_client_address`; still enforces `meta.canDelete` when
     *   present.
     * why: parity #8, same as `add`/`update` above; mirrors legacy's
     *   `vue-app/.../addresses.ts:155`
     *   `rootGetters["user/can"]("delete_client_address")` guard.
     * rejected: same as `add` above.
     */
    remove: canDelete
      ? (id: Address["id"]) => {
          const address = getOne(id);
          if (!address || !address.meta.canDelete) {
            return Promise.resolve(undefined);
          }
          return service.remove(id).mutateAsync();
        }
      : undefined
  };
}

// Type export for consumers
export type StaffClientAddressDryActions = ReturnType<
  typeof createStaffClientAddressDryActions
>;
