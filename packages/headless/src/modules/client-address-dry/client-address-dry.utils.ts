/** @internal */
import { useSessionStore } from "../session-store";
import { ClientAddressDryCapability } from "./client-address-dry.types";
import { first, some, values } from "lodash-es";
import type { ClientAddressDryStaffCapabilities } from "./client-address-dry.types";
import type { SessionEntry } from "../session-store";
import type { IFunctionality, IToken } from "@upmind-automation/types";

// -----------------------------------------------------------------------------
/**
 * @module client-address-dry/utils
 * @description Staff-session helpers (D-ADDR-1 token select, parity #8
 * capability gate) shared by the services and actions staff arms. Never earns
 * a `.{actor}.ts` arm of its own — a pure-input-in/output-out util, per
 * `templates/ARMS.md` "Which files can earn an arm". Unlike
 * `client-phone-dry.utils.ts`, there is NO `isStaged`/`canEdit` pair here —
 * `IAddress` carries no `staged_import` field (D-ADDR-4, parity DR4).
 */

/**
 * @decision
 * what: the active staff session's entry (token + user) is read from
 *   `staffSessions` directly, never from `useActiveSession()`'s active-default
 *   session.
 * why: D-ADDR-1 — under multi-session the active session may be a client
 *   session even while a staff session is held; the staff arm must
 *   authenticate as staff regardless of which actor is active (mirrors
 *   `auth/auth.services.ts:76-77` `first(values(staffSessions.value))?.token`
 *   and the shipped `client-phone-dry.utils.ts:31-34`).
 * rejected: `useActiveSession().useContext().session` — resolves to whichever
 *   actor is currently active, not necessarily staff.
 */
function getActiveStaffEntry(): SessionEntry | undefined {
  const { staffSessions } = useSessionStore().useContext();
  return first(values(staffSessions.value));
}

/** The staff session token to authenticate a `.for('client', id)` call as (D-ADDR-1). */
export function getStaffToken(): IToken | undefined {
  return getActiveStaffEntry()?.token;
}

/**
 * @decision
 * what: staff capability codes are read off the staff session user's
 *   `functionalities` — a field `/admin/self` already fetches
 *   (`session-store.services.ts:84`) but `SessionUser` does not yet expose.
 * why: ADR-001 §6 requires staff-capability-gated actions (parity #8,
 *   AC-B3/AC-B4); no capability channel exists anywhere in headless today,
 *   and this module's file-ownership grant is `client-address-dry/` only, so
 *   extending `session-store`'s public `SessionUser` type is out of this
 *   smoke test's scope. Read defensively off the raw wire field instead
 *   (mirrors `client-phone-dry.utils.ts:56-63`).
 * rejected: extending `session-store.types.ts`'s `SessionUser` with a
 *   first-class capabilities field — the real fix, but a shared sibling
 *   module is outside this story's file list (design.md §4); surfaced here
 *   rather than silently done.
 */
export function hasStaffCapability(
  capability: ClientAddressDryCapability
): boolean {
  const user = getActiveStaffEntry()?.user as
    | { functionalities?: IFunctionality[] }
    | undefined;
  return some(user?.functionalities, ["code", capability]);
}

/**
 * @decision
 * what: the four staff capability booleans (`canList`/`canCreate`/
 *   `canUpdate`/`canDelete`) are computed ONCE here, off `hasStaffCapability`
 *   above, and returned as a single bundle.
 * why: D-ADDR-5 (operator ruling 2026-07-31) — AC-B3/AC-B4 (the `actions.staff`
 *   arm's gating) and AC-B5 (the `meta.staff` arm's readable flags) must trace
 *   to the SAME computed source; the entry factory
 *   (`useClientAddressesDry.ts`) calls this ONCE per scope and passes the
 *   result to both arms, so neither runs its own independent
 *   `hasStaffCapability` lookup.
 * rejected: letting each arm call `hasStaffCapability` directly (the
 *   pre-refactor shape) — two independent lookups reading the same session
 *   state have no shared source proving they can never silently diverge.
 */
export function getClientAddressDryStaffCapabilities(): ClientAddressDryStaffCapabilities {
  return {
    canList: hasStaffCapability(ClientAddressDryCapability.LIST),
    canCreate: hasStaffCapability(ClientAddressDryCapability.CREATE),
    canUpdate: hasStaffCapability(ClientAddressDryCapability.UPDATE),
    canDelete: hasStaffCapability(ClientAddressDryCapability.DELETE)
  };
}
