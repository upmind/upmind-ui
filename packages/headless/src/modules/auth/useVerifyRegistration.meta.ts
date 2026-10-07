import { computed } from "vue";
import { useContext, useStateMatches } from "../../utils";
import { isEmpty } from "lodash-es";
import type { VerifyRegistrationContext } from "./auth.types";
import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module auth/useVerifyRegistration.meta
 * @description Registration landing meta factory.
 */

/**
 * Creates the landing meta flags.
 * @internal
 */
export function createVerifyRegistrationMeta(
  _actorScope: ScopeActorTypes,
  actor: UseActor
) {
  const { state } = actor;

  const data = useContext<VerifyRegistrationContext["data"]>(state, "data");
  const error = useContext<VerifyRegistrationContext["error"]>(state, "error");
  const validationErrors = useContext<
    VerifyRegistrationContext["validationErrors"]
  >(state, "validationErrors");

  const isVerifying = useStateMatches(state, [
    "idle",
    "checkingLink",
    "verifying",
    "routing",
    "checkingExpiry"
  ]);
  const isSuccess = useStateMatches(state, "success");
  const isExpiredOrInvalid = useStateMatches(state, "expiredOrInvalid");
  const isProcessing = useStateMatches(state, [
    "verifying",
    "completing",
    "completingWithPassword"
  ]);
  const needsPassword = computed(() => !!data.value?.needsPassword);
  const needsCompleteStep = computed(() => !!data.value?.needsCompleteStep);
  const twoFARequired = computed(() => !!data.value?.twoFARequired);
  const hasErrors = computed(() => !!error.value);
  const hasValidationErrors = computed(() => !isEmpty(validationErrors.value));

  // -----------------------------------------------------------------------------
  return {
    /** True when a failure is published. */
    hasErrors,

    /** True when the set-password form has validation errors. */
    hasValidationErrors,

    /** True when the registration completed. */
    isComplete: isSuccess,

    /** True when the link is missing a value, refused, past its expiry, or the set-password grant failed. */
    isExpiredOrInvalid,

    /** True while a request is in flight. */
    isProcessing,

    /** True when the registration completed and the client token is saved. */
    isSuccess,

    /** True until the link check settles, including before `verify()` is called. */
    isVerifying,

    /** True when the verified account has no name. Keeps its value after the verify. */
    needsCompleteStep,

    /** True when the verified account has no password. Not a view key — use `currentState`. */
    needsPassword,

    /** True when the verified account signs in with two-factor. */
    twoFARequired
  };
}

// Type export for consumers
export type UseVerifyRegistrationMeta = ReturnType<
  typeof createVerifyRegistrationMeta
>;
