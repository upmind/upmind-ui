import { useContext } from "../../utils";
import type {
  ProfileContext,
  ProfileModel
} from "./client-personal-details.types";
import type { ResponseError, UseActor } from "../../utils";
import type { CustomField } from "../client-custom-fields";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { ErrorObject } from "ajv";
// -----------------------------------------------------------------------------
/**
 * @module client-personal-details/usePersonalDetailsManager.context
 * @description Manager context — the reactive read side of the machine
 * context. Every member goes through the `useContext` state-read utility;
 * `state.value.context` is never read directly.
 *
 * THIS is where the schema and uischema surface. They enter the system in
 * `usePersonalDetailsManager.machine.ts`'s `setSchemas`, live in machine
 * context, and reach consumers HERE — the barrel exports no bare pair.
 *
 * ERRORS ARE STATE, NOT EVENTS. `errors` and `validationErrors` are the
 * machine's captured failure, exposed for the consumer to render.
 *
 * @doctrine clause 2 — shared-only (armless).
 */
export function createPersonalDetailsManagerContext(
  _actorScope: ScopeActorTypes,
  actor: UseActor
) {
  const { state } = actor;

  // --- actor-specific context: none earned yet (clause 2).

  return {
    /** The full data-manager context object. */
    context: useContext<ProfileContext>(state),

    /** Machine-captured error message, if any — read, never raised. */
    errors: useContext<ResponseError["message"]>(state, "error.message"),

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
    validationErrors: useContext<ErrorObject[]>(state, "error.data")

    // The arm merges in HERE, last.
    // ...actorContext
  };
}

// Type export for consumers
export type UsePersonalDetailsManagerContext = ReturnType<
  typeof createPersonalDetailsManagerContext
>;
