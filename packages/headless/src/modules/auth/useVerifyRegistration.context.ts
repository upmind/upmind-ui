import { computed } from "vue";
import { useContext, useState } from "../../utils";
import type {
  SetPasswordModel,
  VerifyRegistrationData,
  VerifyRegistrationError,
  VerifyRegistrationTwoFAProvider
} from "./auth.types";
import type { ErrorObject, UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
// -----------------------------------------------------------------------------
/**
 * @module auth/useVerifyRegistration.context
 * @description Registration landing context factory.
 */

/**
 * Creates the landing context.
 * @internal
 */
export function createVerifyRegistrationContext(
  _actorScope: ScopeActorTypes,
  actor: UseActor
) {
  const { state } = actor;

  const currentState = useState<string>(state, "value");
  const data = useContext<VerifyRegistrationData>(state, "data");
  const error = useContext<VerifyRegistrationError>(state, "error");
  const model = useContext<SetPasswordModel>(state, "model");
  const redirect = useContext<string>(state, "redirect");
  const schema = useContext<JsonSchema>(state, "schema");
  const sessionId = useContext<string>(state, "sessionId");
  const uischema = useContext<UISchemaElement>(state, "uischema");
  const validationErrors = useContext<ErrorObject[]>(
    state,
    "validationErrors",
    []
  );
  const twoFAProvider = computed(
    (): VerifyRegistrationTwoFAProvider | null =>
      data.value?.twoFAProvider ?? null
  );

  // -----------------------------------------------------------------------------
  return {
    /** Current machine state value; `"needsPassword"` is the form view key. */
    currentState,

    /** Mapped verify answer; `undefined` before the verify ends. */
    data,

    /** Published failure, with the API `apiCode` when the API sent one. */
    error,

    /** Set-password form model, prefilled with the link username. */
    model,

    /** Same-app return path from the link, or `undefined` when unsafe or absent. Navigate without decoding it. */
    redirect,

    /** JSON schema of the set-password form. */
    schema,

    /** Actor id of the new client session; set when the grant succeeds. */
    sessionId,

    /** Lower-cased two-factor provider, `""` when none, `null` before the verify. */
    twoFAProvider,

    /** UI schema of the set-password form. */
    uischema,

    /**
     * Set-password validation errors; pass to `UpmForm` `additionalErrors`.
     * @see https://ajv.js.org/guide/validation-errors.html#validation-error-object
     */
    validationErrors
  };
}

// Type export for consumers
export type UseVerifyRegistrationContext = ReturnType<
  typeof createVerifyRegistrationContext
>;
