import { useContext } from "../../utils";
import type {
  CompleteRegistrationModel,
  GuestEmailModel,
  VerifyEmailModel
} from "./account.types";
import type { ErrorObject, ResponseError, UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
// -----------------------------------------------------------------------------
/**
 * @module account/useAccount.context
 * @description Account context factory (computed form values).
 *
 * NOTE: Never access state.value.context directly - always use the useContext utility.
 */

/**
 * Creates account context (computed form values).
 * @internal
 */
export function createAccountContext(
  _actorScope: ScopeActorTypes,
  actor: UseActor
) {
  const { state } = actor;

  const errors = useContext<ResponseError["message"]>(state, "error.message");
  const model = useContext<
    CompleteRegistrationModel | GuestEmailModel | VerifyEmailModel
  >(state, "model");
  const schema = useContext<JsonSchema>(state, "schema");
  const uischema = useContext<UISchemaElement>(state, "uischema");
  const validationErrors = useContext<ErrorObject[]>(state, "error.data");

  // -----------------------------------------------------------------------------
  return {
    /** Active account form error message(s). */
    errors,

    /** Active account form data model. */
    model,

    /** Active account form JSON schema. */
    schema,

    /** Active account form UI schema. */
    uischema,

    /** Field-level validation errors (AJV ErrorObject[]). */
    validationErrors
  };
}

// Type export for consumers
export type UseAccountContext = ReturnType<typeof createAccountContext>;
