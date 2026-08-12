import { computed } from "vue";
import { useBrand } from "../brand";
import { mapProfileFields } from "./client-personal-details.mappers";
import { mapToHeadlessError, useCollection } from "../../utils";
import type {
  ClientPersonalDetailsRecordQuery,
  ProfileField
} from "./client-personal-details.types";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
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
  query: ClientPersonalDetailsRecordQuery
) {
  // Resolves the language row's DISPLAY name in `mapProfileFields` — the
  // same brand languages list the manager's schema enum is built from
  // (`client-personal-details.schemas.ts`'s `languageOptions`). Read-only
  // projection; `ProfileModel.language` (AC-33) never passes through this.
  const { languages } = useBrand();

  const data = computed<ProfileField[]>(() =>
    mapProfileFields(query.data.value, languages.value)
  );

  const { findOne, getOne } = useCollection<ProfileField>(data);

  const error = computed<ResponseError | undefined>(() =>
    query.error.value ? mapToHeadlessError(query.error.value) : undefined
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
