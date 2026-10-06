// TEMPLATE FILE — scaffolded by the factory; replace every placeholder.
import { useStateMatches } from "../../utils";
import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module module/useModule.meta
 * @description Module meta factory.
 */

export function createModuleMeta(actorScope: ScopeActorTypes, actor: UseActor) {
  const { state } = actor;

  const hasErrors = useStateMatches(state, "error");
  const hasValidationErrors = useStateMatches(state, "available.invalid");
  const isComplete = useStateMatches(state, "complete");
  const isProcessing = useStateMatches(state, [
    "available.checking",
    "available.loggingIn",
    "available.registering"
  ]);

  return {
    /** True if the last service call failed. */
    hasErrors,

    /** True if the active form fails validation. */
    hasValidationErrors,

    /** True once the flow reached its final state. */
    isComplete,

    /** True while the module is validating or submitting. */
    isProcessing
  };
}

export type UseModuleMeta = ReturnType<typeof createModuleMeta>;
