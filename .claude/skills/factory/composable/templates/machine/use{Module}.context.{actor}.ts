// TEMPLATE FILE — scaffold only when this actor earns a context arm (ARMS.md).
import { computed } from "vue";
import { contextValue, useContext } from "../../utils";
import type { UseActor } from "../../utils";
// -----------------------------------------------------------------------------
/**
 * @module module/useModule.context.client
 * @description Client-specific module context.
 */

export function createClientModuleContext(actor: UseActor) {
  const { state } = actor;

  const entitlements = useContext<string[]>(state, "clientEntitlements", []);
  const clientLookups = computed(() => [
    ...(contextValue<Record<string, unknown>[]>(state, "lookups") ?? []),
    ...(contextValue<Record<string, unknown>[]>(state, "clientCustomFields") ??
      [])
  ]);

  return {
    /** Entitlements held for the client. */
    entitlements,

    /** Base reference data plus the client's custom fields. */
    lookups: clientLookups
  };
}

export type ClientModuleContext = ReturnType<typeof createClientModuleContext>;
