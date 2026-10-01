import { computed } from "vue";
import { useI18n } from "../system-localisation";
import { mapProfileFields } from "./client-personal-details.mappers";
import {
  fieldsFromValidationErrors,
  pickUischemaControls,
  useCollection,
  useContext
} from "../../utils";
import { concat, uniq } from "lodash-es";
import type {
  ProfileContext,
  ProfileField,
  ProfileModel,
  UischemaForOptions
} from "./client-personal-details.types";
import type { ResponseError, UseActor } from "../../utils";
import type { CustomField } from "../client-custom-fields";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { UISchemaElement } from "@jsonforms/core";
import type { ILanguage } from "@upmind-automation/types";
import type { ErrorObject } from "ajv";
// -----------------------------------------------------------------------------
/**
 * @module client-personal-details/usePersonalDetails.context
 * @description Manager context — the reactive read side of the machine
 * context. Every member goes through the `useContext` state-read utility;
 * `state.value.context` is never read directly.
 *
 * THIS is where the schema and uischema surface. They enter the system in
 * `usePersonalDetails.machine.ts`'s `setSchemas`, live in machine
 * context, and reach consumers HERE — the barrel exports no bare pair.
 *
 * ERRORS ARE STATE, NOT EVENTS. `errors` and `validationErrors` are the
 * machine's captured failure, exposed for the consumer to render.
 *
 * @doctrine clause 2 — shared-only (armless).
 */

export function createPersonalDetailsContext(
  _actorScope: ScopeActorTypes,
  actor: UseActor
) {
  const { state } = actor;
  const { t } = useI18n();

  // --- actor-specific context: none earned yet (clause 2).

  const uischemaRef = useContext<ProfileContext["uischema"]>(state, "uischema");
  const validationErrorsRef = useContext<ErrorObject[]>(state, "error.data");
  const modelRef = useContext<ProfileModel | undefined>(state, "model");
  const fieldsRef = useContext<CustomField[]>(state, "lookups.fields");
  const languagesRef = useContext<ILanguage[]>(state, "lookups.languages");

  /**
   * The reactive profile display list — native fields, then custom fields —
   * projected off machine context so the ONE composable's read surface matches
   * the query-backed read half it replaced.
   */
  const data = computed<ProfileField[]>(() =>
    mapProfileFields(modelRef.value, fieldsRef.value, languagesRef.value, t)
  );

  const { findOne, getOne } = useCollection<ProfileField>(data);

  /**
   * Returns a uischema narrowed to the given fields. Reads the CURRENT whole
   * uischema and validation errors off machine state and composes them.
   *
   * When `includeInvalid` is true (the default), fields with validation errors
   * are merged in — full-schema validation refuses a save while a required
   * field outside the view is empty, so pulling invalid fields in is what
   * lets the save proceed.
   *
   * @param fields The field tokens to include (e.g. `['firstName']` or
   * `['customFields.age']`).
   * @param options Optional settings.
   */
  function uischemaFor(
    fields: string[],
    options: UischemaForOptions = {}
  ): UISchemaElement | undefined {
    const { includeInvalid = true } = options;
    const base = uischemaRef.value;

    let effectiveFields = fields;
    if (includeInvalid) {
      const invalidFields = fieldsFromValidationErrors(
        validationErrorsRef.value
      );
      effectiveFields = uniq(concat(fields, invalidFields));
    }

    return pickUischemaControls(base, effectiveFields);
  }

  return {
    /** The full data-manager context object. */
    context: useContext<ProfileContext>(state),

    /** The reactive profile display list — native fields, then custom fields. */
    data,

    /** The machine's captured error object — read, never raised. */
    error: useContext<ResponseError | undefined>(state, "error"),

    /** Machine-captured error message, if any — read, never raised. */
    errors: useContext<ResponseError["message"]>(state, "error.message"),

    /** Finds a single profile field by a partial mapping. */
    findOne,

    /** Finds a single profile field by id. */
    getOne,

    /** The list of custom-field definitions this scope's lookups resolved. */
    fields: useContext<CustomField[]>(state, "lookups.fields"),

    /** The id of the profile being managed — the owning client's own id. */
    id: useContext<string | undefined>(state, "id"),

    /** The current form model. */
    model: useContext<ProfileModel | undefined>(state, "model"),

    /** The base (persisted) model `revert()` restores to. */
    baseModel: useContext<ProfileModel | undefined>(state, "baseModel"),

    /** The JSON schema for the form (from machine context — see JSDoc). */
    schema: useContext<ProfileContext["schema"]>(state, "schema"),

    /** Display title of the profile. */
    title: useContext<string | undefined>(state, "title"),

    /** The UI schema for the form (from machine context — see JSDoc). */
    uischema: useContext<ProfileContext["uischema"]>(state, "uischema"),

    /** Field-level validation errors (AJV `ErrorObject[]`) — read, never raised. */
    validationErrors: validationErrorsRef,

    /**
     * Returns a uischema narrowed to the given fields. Composes the current
     * whole uischema with validation errors (when `includeInvalid` is true).
     */
    uischemaFor

    // The arm merges in HERE, last.
    // ...actorContext
  };
}

// Type export for consumers
export type UsePersonalDetailsContext = ReturnType<
  typeof createPersonalDetailsContext
>;
