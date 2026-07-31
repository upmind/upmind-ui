import type { ClientAddressDryStaffCapabilities } from "./client-address-dry.types";

// -----------------------------------------------------------------------------
/**
 * @module client-address-dry/useClientAddressesDry.meta.staff
 * @description Staff-specific collection meta — parity #19 (D-ADDR-5,
 * AC-B5): the four staff capability booleans exposed as readable UI state.
 * Populated ONLY for the `staff` arm; shared meta stays in
 * `useClientAddressesDry.meta.ts`. `capabilities` is NOT computed here — it
 * is the SAME `getClientAddressDryStaffCapabilities()` bundle the entry
 * factory computes ONCE per scope and also hands to the `actions.staff` arm
 * (single source of truth); this arm never runs its own independent
 * `hasStaffCapability` lookup.
 */
export function createStaffClientAddressDryMeta(
  capabilities: ClientAddressDryStaffCapabilities
) {
  return {
    /**
     * OVERRIDING MEMBER — same key as the shared `useClientAddressesDry.meta.ts`
     * placeholder (`undefined` off-arm).
     * @decision
     * what: expose the four staff capability booleans (`canList`/`canCreate`/
     *   `canUpdate`/`canDelete`) as readable `useMeta()` members, computed
     *   from the SAME `getClientAddressDryStaffCapabilities()` source the
     *   `actions.staff` arm gates action exposure on — never a second,
     *   independent `hasStaffCapability` lookup here.
     * why: legacy vue-app gates its delete/update CONTROLS on
     *   `delete_client_address`/`update_client_address`
     *   (`vue-app/src/store/modules/data/clients/addresses.ts:155,203`), so
     *   downstream UI needs to READ these flags to gate its own controls,
     *   not only have them silently gate an action closure it cannot see
     *   into. Staff-exclusive per ADR-001 §6 (client/self is never
     *   capability-gated) — A vs A+B over the armless shared meta (clause 3,
     *   `code-composables.companion.md`).
     * rejected: (a) leaving the flags trapped inside the `actions.staff`
     *   closure — the UI cannot read them there to gate its own controls;
     *   (b) a second `hasStaffCapability` lookup inside this arm parallel to
     *   `actions.staff` — meta and actions must read the ONE computed
     *   source, never a duplicated computation that could silently drift.
     */
    canList: capabilities.canList,
    canCreate: capabilities.canCreate,
    canUpdate: capabilities.canUpdate,
    canDelete: capabilities.canDelete
  };
}

// Type export for consumers
export type StaffClientAddressDryMeta = ReturnType<
  typeof createStaffClientAddressDryMeta
>;
