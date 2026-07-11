import { useContext } from "../../utils";
import type { DataManagerContext } from "../data-manager/data-manager.types";
import type { ResponseError, UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope";
import type { ErrorObject } from "ajv";
// -----------------------------------------------------------------------------
/**
 * @module client-email/useClientEmailManager.context
 * @description Client-email manager context factory (computed form values).
 *
 * NOTE: Never access state.value.context directly — always use the useContext
 * utility.
 */

/**
 * Creates the client-email manager context (computed form values).
 * @internal
 */
export function createClientEmailManagerContext(
  _actorScope: ScopeActorTypes,
  actor: UseActor
) {
  const { state } = actor;

  // ---------------------------------------------------------------------------
  return {
    /** The full data-manager context object. */
    context: useContext<DataManagerContext>(state),

    /** Description of the email. */
    description: useContext<string | undefined>(state, "description"),

    /** Error message(s) from the context, if any. */
    errors: useContext<ResponseError["message"]>(state, "error.message"),

    /** The id of the email being managed (undefined for a new email). */
    id: useContext<string | undefined>(state, "id"),

    /** The current form model. */
    model: useContext<DataManagerContext["model"]>(state, "model"),

    /** The JSON schema for the form. */
    schema: useContext<DataManagerContext["schema"]>(state, "schema"),

    /** Display title of the email. */
    title: useContext<string | undefined>(state, "title"),

    /** The UI schema for the form. */
    uischema: useContext<DataManagerContext["uischema"]>(state, "uischema"),

    /** Field-level validation errors (AJV ErrorObject[]). */
    validationErrors: useContext<ErrorObject[]>(state, "error.data")
  };
}

// Type export for consumers
export type UseClientEmailManagerContext = ReturnType<
  typeof createClientEmailManagerContext
>;
