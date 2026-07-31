import { ClientPhoneDryCapability } from "./client-phone-dry.types";
import { canEdit, hasStaffCapability } from "./client-phone-dry.utils";
import { useCollection } from "../../utils";
import type {
  Phone,
  PhoneModel,
  ClientPhoneDryListQuery,
  ClientPhoneDryServices
} from "./client-phone-dry.types";

// -----------------------------------------------------------------------------
/**
 * @module client-phone-dry/useClientPhonesDry.actions.staff
 * @description Staff-specific collection actions — gap #7 capability gating
 * (ADR-001 §6, AC-B3), extended to `ensure`'s create branch (repair cycle 1
 * — see `evidence/code-handoff.md` "Repair cycle 1"). Populated ONLY for the
 * `staff` arm; shared actions stay in `useClientPhonesDry.actions.ts`. Each
 * member's VALUE is `undefined` when the staff session lacks the matching
 * capability code — `typeof actions.remove === 'undefined'` either way
 * (ADR-001 §6's own example), never a present callable that silently no-ops.
 */
export function createStaffClientPhoneDryActions(
  service: ClientPhoneDryServices,
  query: ClientPhoneDryListQuery
) {
  const { getOne } = useCollection<Phone>(query.data);

  const canList = hasStaffCapability(ClientPhoneDryCapability.LIST);
  const canCreate = hasStaffCapability(ClientPhoneDryCapability.CREATE);
  const canUpdate = hasStaffCapability(ClientPhoneDryCapability.UPDATE);
  const canDelete = hasStaffCapability(ClientPhoneDryCapability.DELETE);

  return {
    /**
     * OVERRIDING MEMBER — same key as the shared `refresh`.
     * @decision
     * what: `refresh` is `undefined` unless the staff session carries
     *   `list_client_phones`.
     * why: gap #7 (ADR-001 §6) — a staff member without list capability
     *   should not be able to (re)issue the retargeted admin list read.
     * rejected: leaving `refresh` unconditionally shared — that would let a
     *   staff session without `list_client_phones` still refetch the admin
     *   list, the exact gap #7 closes.
     */
    refresh: canList ? query.refetch : undefined,

    /**
     * OVERRIDING MEMBER — same key as the shared `add`.
     * @decision
     * what: `add` is `undefined` unless the staff session carries
     *   `create_client_phone`.
     * why: gap #7 — the shared member exposes `add` unconditionally; this
     *   arm conditions it on the staff capability legacy also requires.
     * rejected: an always-present `add` that internally checks the
     *   capability and no-ops — rejected because ADR-001 §6's contract is
     *   the PROPERTY itself reading `undefined`
     *   (`typeof actions.remove === 'undefined'`), not a callable that
     *   silently declines.
     */
    add: canCreate ? (model: PhoneModel) => service.add(model) : undefined,

    /**
     * OVERRIDING MEMBER — same key as the shared `ensure`.
     * @decision
     * what: `ensure` is `undefined` unless the staff session carries
     *   `create_client_phone` — gated identically to `add` above; when
     *   present it still resolves through `service.ensure`, which composes
     *   over THIS arm's own `loadList`/`add` overrides (admin path + staff
     *   token), so a granted `ensure()` still lands correctly on the target
     *   client.
     * why: `service.ensure` is find-or-create — its create branch calls the
     *   very same `resolvedAdd` the gated `add` member above calls. Left
     *   shared/ungated (the review-flagged defect), a staff session WITHOUT
     *   `create_client_phone` could still create a phone via
     *   `ensure({not-in-list})`, bypassing gap #7's create gate entirely
     *   (ADR-001 §6; legacy `phones.ts` gates create on
     *   `create_client_phone`) — a fail-open capability hole, the FE-2824
     *   archetype this smoke test exists to close. design.md §4's actions
     *   row lists `ensure` as shared-only; that row is silent on this path,
     *   not an intentional decision to leave it ungated, so this overrides it.
     * rejected: (a) leaving `ensure` shared/ungated, matching design.md's
     *   literal row — the row never reasoned about `ensure`'s create branch,
     *   so its silence is not a considered scope decision; (b) removing
     *   `ensure` from the staff surface outright — a repo-wide grep
     *   (headless, vue-app, widgets) found no consumer of any
     *   `client-phone-dry` export yet (net-new smoke module), so dead-ness
     *   is not the reason to drop it, and `ensure` is a named member of the
     *   design.md §2 `useActions()` contract worth preserving under the
     *   same gate as `add` rather than deleting.
     */
    ensure: canCreate
      ? (model: PhoneModel) => service.ensure(model)
      : undefined,

    /**
     * OVERRIDING MEMBER — same key as the shared `update`.
     * @decision
     * what: `update` is `undefined` unless the staff session carries
     *   `update_client_phone`; still enforces D4's edit lockout when present.
     * why: gap #7, same as `add` above.
     * rejected: same as `add` above.
     */
    update: canUpdate
      ? (id: Phone["id"], model: PhoneModel) => {
          const phone = getOne(id);
          if (phone && !canEdit(phone)) return Promise.resolve(undefined);
          return service.update(id, model);
        }
      : undefined,

    /**
     * OVERRIDING MEMBER — same key as the shared `setDefault`.
     * @decision
     * what: `setDefault` is `undefined` unless the staff session carries
     *   `update_client_phone` (legacy gates `makeDefault` on the same
     *   capability, `vue-app/.../phones.ts:177`); still enforces D4's edit
     *   lockout when present.
     * why: gap #7, same as `add` above.
     * rejected: same as `add` above.
     */
    setDefault: canUpdate
      ? (id: Phone["id"]) => {
          const phone = getOne(id);
          if (phone && !canEdit(phone)) return Promise.resolve(undefined);
          return service.setDefault(id).mutateAsync();
        }
      : undefined,

    /**
     * OVERRIDING MEMBER — same key as the shared `remove`.
     * @decision
     * what: `remove` is `undefined` unless the staff session carries
     *   `delete_client_phone`; still enforces `meta.canDelete` + D4's edit
     *   lockout when present.
     * why: gap #7, same as `add`/`update` above; mirrors legacy's
     *   `vue-app/.../phones.ts:129` `user/can('delete_client_phone')` guard.
     * rejected: same as `add` above.
     */
    remove: canDelete
      ? (id: Phone["id"]) => {
          const phone = getOne(id);
          if (!phone || !phone.meta.canDelete || !canEdit(phone)) {
            return Promise.resolve(undefined);
          }
          return service.remove(id).mutateAsync();
        }
      : undefined
  };
}

// Type export for consumers
export type StaffClientPhoneDryActions = ReturnType<
  typeof createStaffClientPhoneDryActions
>;
