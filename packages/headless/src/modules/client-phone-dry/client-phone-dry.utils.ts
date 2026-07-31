/** @internal */
import { useSessionStore } from "../session-store";
import { first, some, values } from "lodash-es";
import type { ClientPhoneDryCapability } from "./client-phone-dry.types";
import type { Phone } from "./client-phone-dry.types";
import type { SessionEntry } from "../session-store";
import type { IFunctionality, IToken } from "@upmind-automation/types";

// -----------------------------------------------------------------------------
/**
 * @module client-phone-dry/utils
 * @description Staff-session helpers (D1 token select, gap #7 capability
 * gate) shared by the services and actions staff arms, plus the D4
 * staged-row predicates shared by context and actions. Never earns a
 * `.{actor}.ts` arm of its own — a pure-input-in/output-out util, per
 * `templates/ARMS.md` "Which files can earn an arm".
 */

/**
 * @decision
 * what: the active staff session's entry (token + user) is read from
 *   `staffSessions` directly, never from `useActiveSession()`'s active-default
 *   session.
 * why: D1 — under multi-session the active session may be a client session
 *   even while a staff session is held; the staff arm must authenticate as
 *   staff regardless of which actor is active (mirrors
 *   `auth/auth.services.ts:76-77` `first(values(staffSessions.value))?.token`).
 * rejected: `useActiveSession().useContext().session` — resolves to whichever
 *   actor is currently active, not necessarily staff.
 */
function getActiveStaffEntry(): SessionEntry | undefined {
  const { staffSessions } = useSessionStore().useContext();
  return first(values(staffSessions.value));
}

/** The staff session token to authenticate a `.for('client', id)` call as (D1). */
export function getStaffToken(): IToken | undefined {
  return getActiveStaffEntry()?.token;
}

/**
 * @decision
 * what: staff capability codes are read off the staff session user's
 *   `functionalities` — a field `/admin/self` already fetches
 *   (`session-store.services.ts:84`) but `SessionUser` does not yet expose.
 * why: ADR-001 §6 requires staff-capability-gated actions (gap #7, AC-B3); no
 *   capability channel exists anywhere in headless today, and this module's
 *   file-ownership grant is `client-phone-dry/` only, so extending
 *   `session-store`'s public `SessionUser` type is out of this smoke test's
 *   scope. Read defensively off the raw wire field instead.
 * rejected: extending `session-store.types.ts`'s `SessionUser` with a
 *   first-class capabilities field — the real fix, but a shared sibling
 *   module is outside this story's file list (design.md §4); surfaced here
 *   rather than silently done.
 */
export function hasStaffCapability(
  capability: ClientPhoneDryCapability
): boolean {
  const user = getActiveStaffEntry()?.user as
    | { functionalities?: IFunctionality[] }
    | undefined;
  return some(user?.functionalities, ["code", capability]);
}

/** D4 — a staged-import row, per `staged_import` surfaced as `meta.isStaged`. */
export function isStaged(phone: Pick<Phone, "meta">): boolean {
  return !!phone.meta.isStaged;
}

/** D4 — a staged row is locked for edit/set-default/delete until reconciled. */
export function canEdit(phone: Pick<Phone, "meta">): boolean {
  return !isStaged(phone);
}
