/** @internal */
import { assign } from "xstate";
import { useSchema, useUischema } from "./client-personal-details.schemas";
import { useClientPersonalDetailsManagerServices } from "./client-personal-details.services";
import { useModelParser } from "../../utils";
import type { dataManagerMachine } from "../data-manager";
import type {
  ClientPersonalDetailsServices,
  ProfileContext,
  ProfileModel
} from "./client-personal-details.types";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @internal
 * @module client-personal-details/usePersonalDetailsManager.machine
 * @description Builds the ONE typed `.withConfig(...)` payload — actions,
 * guards and the services adapter — for a single scoped `service` instance
 * of the shared `dataManagerMachine`. The module owns no machine of its own
 * (R6).
 *
 * Every key below is one the SHARED machine references. Read
 * `data-manager/data-manager.machine.ts` before adding or removing one: an
 * action/guard/service the machine names but this payload omits either falls
 * back to the machine's own no-op default or crashes on entering its state.
 */

/**
 * @decision the `hasSubscription` guard key is kept, unrenamed, despite
 * AC-54's literal wording.
 * what:    the guard key below is `hasSubscription` — identical to
 *          `useClientEmailManager.machine.ts`'s own key.
 * why:     the SHARED, protected `dataManagerMachine` (R6) references this
 *          guard by exactly that literal string —
 *          `always: { target: "loading", cond: "hasSubscription" }`
 *          (`data-manager.machine.ts:25`). XState resolves a `withConfig`
 *          guard by NAME MATCH against the string the machine's own `cond:`
 *          names. Renaming this key does not rename what the machine asks
 *          for — it silently STOPS overriding it, and the machine's own
 *          unconditional default (`() => true`) takes over, firing an
 *          unaddressed request the instant the machine starts, before any
 *          client id resolves. That is the exact regression AC-40/AC-41/
 *          AC-42 exist to prevent.
 * rejected: renaming the key — checked and rejected for the reason above.
 * contradiction: AC-54's own read-back ("a snapshot of the config's guard
 *          keys contains no `hasSubscription`") is therefore NOT satisfiable
 *          without either (a) editing the protected machine (forbidden by
 *          R6), or (b) breaking the gating AC-40/AC-41/AC-42 require.
 *          Reported verbatim in this dispatch's handoff rather than silently
 *          worked around either way.
 */
export function createPersonalDetailsManagerMachineConfig(
  service: ClientPersonalDetailsServices
): Parameters<typeof dataManagerMachine.withConfig>[0] {
  return {
    actions: {
      /** Display strings for the profile being edited. Never rendered as feedback. */
      setMeta: assign({
        title: ({ model }: ProfileContext) =>
          model?.firstName || model?.publicName || "Profile",
        description: (_context: ProfileContext) => ""
      }),

      /**
       * The schema/uischema PAIR — always assigned together. This is the
       * ONLY place they enter the system; they travel to consumers through
       * machine context, which is why `index.ts` exports neither.
       */
      setSchemas: assign({
        schema: (context: ProfileContext) => useSchema(context),
        uischema: (context: ProfileContext) => useUischema(context)
      }),

      setModel: assign({
        model: (
          { schema, baseModel }: ProfileContext,
          { data }: AnyEventObject
        ) => useModelParser<ProfileModel>(schema, data, baseModel)
      }),

      /**
       * Folds a REFRESH payload into context WITHOUT overwriting a value the
       * scope already resolved — `clientId ||` is load-bearing, mirroring
       * `useClientEmailManager.machine.ts`. Also folds a `filterFields`
       * top-up (this module's own extension — the "scope-factory argument"
       * design.md §8 requires) into `lookups`, so a caller can retarget
       * which fields the editor narrows to WITHOUT a machine edit: a REFRESH
       * carrying `data.filterFields` re-enters `loading`, which rebuilds the
       * schema against the new narrowing.
       */
      refreshContext: assign({
        clientId: ({ clientId }: ProfileContext, { data }: AnyEventObject) =>
          clientId || data?.clientId,
        id: ({ id }: ProfileContext, { data }: AnyEventObject) =>
          id || data?.id,
        lookups: ({ lookups }: ProfileContext, { data }: AnyEventObject) =>
          data?.filterFields
            ? { ...lookups, filterFields: data.filterFields }
            : lookups
      })
    },

    guards: {
      hasSubscription: ({ clientId }: ProfileContext, _event: AnyEventObject) =>
        !!clientId
    },

    /**
     * The services adapter for this scoped instance. The ALREADY-SCOPED
     * `service` is threaded in, so every machine-invoked request inherits
     * the same resolved target client as the rest of the module.
     */
    services: useClientPersonalDetailsManagerServices(service)
  };
}

// Type export for consumers
export type ClientPersonalDetailsManagerMachineConfig = ReturnType<
  typeof createPersonalDetailsManagerMachineConfig
>;
