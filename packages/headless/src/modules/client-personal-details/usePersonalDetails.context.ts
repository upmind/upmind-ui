import { computed } from "vue";
import { useBrand } from "../brand";
// A's own definitions collection (R2) — the read half's display list must
// enumerate the brand's DEFINITIONS, not just the client's answered values
// (the FE-2824-shaped defect this threading fixes: a client with zero
// values learned about zero definitions and rendered zero rows).
import {
  ClientCustomFieldsContextTypes,
  useClientCustomFields
} from "../client-custom-fields";
import { mapProfileFields } from "./client-personal-details.mappers";
import { ClientPersonalDetailsContextTypes } from "./client-personal-details.types";
import { mapToHeadlessError, useCollection } from "../../utils";
import { ScopeActorTypes } from "../scope/scope.types";
import type {
  ClientPersonalDetailsRecordQuery,
  ProfileField
} from "./client-personal-details.types";
import type { ScopeContext } from "../scope";
import type { ResponseError } from "../../utils";
// -----------------------------------------------------------------------------
/**
 * @module client-personal-details/usePersonalDetails.context
 * @description Read context — the reactive profile display list and its
 * lookup helpers, plus the client's own raw custom-field values.
 *
 * ERRORS ARE STATE, NOT EVENTS. `error` is the query's own captured
 * failure, exposed for the consumer to render. This layer never raises it.
 *
 * @doctrine clause 2 — shared-only (armless).
 */
export function createPersonalDetailsContext(
  _actorScope: ScopeActorTypes,
  query: ClientPersonalDetailsRecordQuery,
  scopeContext?: ScopeContext
) {
  // Resolves the language row's DISPLAY name in `mapProfileFields` — the
  // same brand languages list the manager's schema enum is built from
  // (`client-personal-details.schemas.ts`'s `languageOptions`). Read-only
  // projection; `ProfileModel.language` (AC-33) never passes through this.
  const { languages } = useBrand();

  /**
   * @decision retarget A's own scope ONLY when THIS module's own scope was
   * explicitly retargeted (an explicit `.for('profile', id)`); a bare
   * `.as(actor)` call is left UNPINNED on A's side too.
   * what:    `.for(VALUES, scopeContext.id)` only fires when `scopeContext`
   *          names a `PROFILE` context — the SAME check `resolveClientId`
   *          (`client-personal-details.services.ts`) makes to decide between
   *          the given id and the session's own. Otherwise this calls
   *          `useClientCustomFields().as(ScopeActorTypes.CLIENT)` with no
   *          `.for()` at all, letting A's OWN `resolveClientId` fall back to the
   *          session's `activeUser` id — reactively, resolving late exactly
   *          like this module's own query does for the SAME self case.
   * why:     a bare self scope has no id to give A YET on a cold boot
   *          (AC-41 — the session resolves its client id LATE), and A's own
   *          `.for()` context id is a STATIC snapshot, captured once and
   *          never revisited — pinning it to `undefined` here would freeze
   *          A's collection unaddressable for this scope's whole lifetime,
   *          even after the session resolves. `.for('profile', id)` is
   *          different: that id is caller-supplied and already known
   *          synchronously (design.md/AC-30's retarget), so pinning it
   *          immediately is both safe and required — A's brand/definitions
   *          must resolve for the SAME named profile B's own read/write
   *          seam addresses, never silently the session's own client.
   * rejected: always calling `.for(VALUES, id)` with `resolveClientId`'s
   *          resolved id — rejected: the manager's `loadLookups` can do this
   *          safely because it runs inside an async XState service invoked
   *          only once the machine already knows the scope is addressable;
   *          this factory runs eagerly, at `.useContext()` call time, with
   *          no such guard, and `resolveClientId` itself is `@internal` to
   *          `client-personal-details.services.ts` — not reachable from here
   *          without exporting it past its own module boundary.
   */
  // `ScopeActorTypes.CLIENT` is hardcoded, not `_actorScope` — this module's
  // own matrix (`PERSONAL_DETAILS_SCOPE_MATRIX`) resolves ONLY `CLIENT`, and
  // A's own matrix likewise resolves ONLY `CLIENT`; `client-personal-details.services.ts`'s
  // `loadLookups` is the precedent for hardcoding rather than threading the
  // (always-CLIENT) param through.
  const customFieldsScope =
    scopeContext?.type === ClientPersonalDetailsContextTypes.PROFILE
      ? useClientCustomFields()
          .as(ScopeActorTypes.CLIENT)
          .for(ClientCustomFieldsContextTypes.VALUES, scopeContext.id)
      : useClientCustomFields().as(ScopeActorTypes.CLIENT);
  const { data: definitions, error: definitionsError } =
    customFieldsScope.useContext();

  const data = computed<ProfileField[]>(() =>
    mapProfileFields(query.data.value, languages.value, definitions.value)
  );

  const { findOne, getOne } = useCollection<ProfileField>(data);

  /**
   * A failed/pending definitions load never blanks the profile (degrade,
   * don't blank): `mapProfileFields`'s own `definitions` default keeps the
   * four native fields rendering regardless, and A's error is surfaced here
   * — reachable — only when B's OWN read has nothing to report.
   */
  const error = computed<ResponseError | undefined>(
    () =>
      (query.error.value
        ? mapToHeadlessError(query.error.value)
        : undefined) ?? definitionsError.value
  );

  /** The client's own raw custom field values, as read (AC-30's read verb). */
  const customFields = computed(() => query.data.value.customFieldValues ?? []);

  // --- actor-specific context: none earned yet (clause 2).

  return {
    /** The client's custom field values, raw (each carrying its own embedded definition). */
    customFields,

    /** The reactive profile display list — native fields, then custom fields. */
    data,

    /** The query's own captured error — read, never raised. */
    error,

    /** Finds a single field by a partial mapping. */
    findOne,

    /** Finds a single field by id. */
    getOne

    // The arm merges in HERE, last.
    // ...actorContext
  };
}

// Type export for consumers
export type UsePersonalDetailsContext = ReturnType<
  typeof createPersonalDetailsContext
>;
