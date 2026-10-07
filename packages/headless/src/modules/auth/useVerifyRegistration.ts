import { interpret } from "xstate";
import { createScopedComposable } from "../scope";
import { useI18n } from "../system-localisation";
import {
  createVerifyRegistrationMachineContext,
  verifyRegistrationMachine
} from "./auth.registration.machine";
import { VERIFY_REGISTRATION_SCOPE_MATRIX } from "./auth.types";
import { createVerifyRegistrationActions } from "./useVerifyRegistration.actions";
import { createVerifyRegistrationContext } from "./useVerifyRegistration.context";
import { createVerifyRegistrationInternals } from "./useVerifyRegistration.internals";
import { createVerifyRegistrationMeta } from "./useVerifyRegistration.meta";
import {
  createActor,
  DetailedError,
  ErrorOrigin,
  responseCodes
} from "../../utils";
import type { VerifyRegistrationScopeMatrix } from "./auth.types";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { ScopeConfig, ScopeKey } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module auth/useVerifyRegistration
 * @description Scoped registration-activation landing. Verifies the activation
 * link, collects a password when the account has none, completes the
 * registration and publishes the outcome. The consumer owns navigation.
 */
// -----------------------------------------------------------------------------
/**
 * Creates the landing for a specific scope. Actor is already resolved by the
 * scope builder (SELF → concrete actor).
 * @private
 */
function createVerifyRegistrationForScope(
  config: ScopeConfig,
  scopeKey: ScopeKey
) {
  const { t } = useI18n();

  const actorScope = config.actor as ScopeActorTypes;

  const service = interpret(
    verifyRegistrationMachine.withContext(
      createVerifyRegistrationMachineContext()
    ),
    { devTools: true }
  );
  service.start();

  const actorRef = createActor(service);
  if (!actorRef) {
    throw new DetailedError(
      t("errors.auth.unavailable"),
      responseCodes.Service_Unavailable,
      ErrorOrigin.Headless,
      { scope: config }
    );
  }

  return {
    // --- Sub-composables (no direct props)
    /** Sub-composable for landing actions (machine events). */
    useActions: () =>
      createVerifyRegistrationActions(actorScope, actorRef, scopeKey),

    /** Sub-composable for landing context (outcome, error, form, redirect). */
    useContext: () => createVerifyRegistrationContext(actorScope, actorRef),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () => createVerifyRegistrationInternals(actorScope, actorRef),

    /** Sub-composable for landing meta (outcome flags). */
    useMeta: () => createVerifyRegistrationMeta(actorScope, actorRef)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped composable for the registration-activation link landing.
 *
 * @example
 * ```ts
 * const landing = useVerifyRegistration().as('self')
 * landing.useActions().verify({ username, hash, expires, redirect })
 * ```
 */
export const useVerifyRegistration = createScopedComposable<
  ReturnType<typeof createVerifyRegistrationForScope>,
  VerifyRegistrationScopeMatrix
>(
  "useVerifyRegistration",
  createVerifyRegistrationForScope,
  VERIFY_REGISTRATION_SCOPE_MATRIX
);

// Type export for consumers
export type UseVerifyRegistration = ReturnType<typeof useVerifyRegistration>;
