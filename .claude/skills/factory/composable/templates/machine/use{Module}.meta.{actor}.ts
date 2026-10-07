// TEMPLATE FILE — scaffold only when this actor earns a meta arm (ARMS.md).
import { computed } from "vue";
import { useStateMatches } from "../../utils";
import type { UseActor } from "../../utils";
// -----------------------------------------------------------------------------
/**
 * @module module/useModule.meta.client
 * @description Client-specific module meta.
 */

export function createClientModuleMeta(actor: UseActor) {
  const { state } = actor;

  const canRegisterAsGuest = computed(() => true);
  const isClientProcessing = useStateMatches(state, [
    "available.checking",
    "available.loggingIn",
    "available.registering",
    "available.registeringAsGuest"
  ]);

  return {
    /** True if this client may register as a guest. */
    canRegisterAsGuest,

    /** True while the module is validating, submitting or registering. */
    isProcessing: isClientProcessing
  };
}

export type ClientModuleMeta = ReturnType<typeof createClientModuleMeta>;
