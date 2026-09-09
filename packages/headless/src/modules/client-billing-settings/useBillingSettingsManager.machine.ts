/** @internal */
import { assign } from "xstate";
import { useSchema, useUischema } from "./client-billing-settings.schemas";
import { useClientBillingSettingsManagerServices } from "./client-billing-settings.services";
import { useModelParser } from "../../utils";
import type { dataManagerMachine } from "../data-manager";
import type {
  BillingSettingsContext,
  BillingSettingsModel,
  ClientBillingSettingsServices
} from "./client-billing-settings.types";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @internal
 * @module client-billing-settings/useBillingSettingsManager.machine
 * @description Builds the ONE typed `.withConfig(...)` payload — actions,
 * guards and the services adapter — for a single scoped `service` instance
 * of the shared `dataManagerMachine`. The module owns no machine of its own;
 * `data-manager/data-manager.machine.ts` is PROTECTED
 * (`agent-behavior.companion.md` §5) and is never edited here.
 *
 * Every key below is one the SHARED machine references. Read
 * `data-manager/data-manager.machine.ts` before adding or removing one: an
 * action/guard/service the machine names but this payload omits either falls
 * back to the machine's own no-op default or crashes on entering its state.
 *
 * There is no `REVERT` event in the shared machine (`data-manager.machine.ts`
 * carries only `CLEAR` and `REFRESH`). Revert (row C9) is composed as a `SET`
 * of `baseModel` through `input()` in `useBillingSettingsManager.actions.ts`
 * — never added here.
 */
export function createBillingSettingsManagerMachineConfig(
  service: ClientBillingSettingsServices
): Parameters<typeof dataManagerMachine.withConfig>[0] {
  return {
    actions: {
      /** Display strings for the preference being edited. Never rendered as feedback. */
      setMeta: assign({
        title: (_context: BillingSettingsContext) => "Invoice consolidation",
        description: (_context: BillingSettingsContext) => ""
      }),

      /**
       * The schema/uischema PAIR — always assigned together. This is the
       * ONLY place they enter the system; they travel to consumers through
       * machine context, which is why `index.ts` exports neither.
       */
      setSchemas: assign({
        schema: (context: BillingSettingsContext) => useSchema(context),
        uischema: (context: BillingSettingsContext) => useUischema(context)
      }),

      /**
       * `updating.onDone`'s (also `adding.onDone`'s — never reached, see this
       * module's own docstring) ONLY assign action. `data` here is the
       * PERSISTED model the `update` service resolved
       * (`client-billing-settings.services.ts`'s `{...baseModel, ...model}`),
       * so `baseModel` is reconciled to it in the SAME action, never left at
       * its pre-write value. An un-reconciled `baseModel` diffs the NEXT
       * edit against a stale floor: a field just written, then set back to
       * its ORIGINAL value, would diff to empty against the stale baseline
       * and short-circuit to zero requests — a second, genuine write
       * silently dropped (row X6 / AC26). A no-op save resolves `data` equal
       * to the already-current `baseModel`, so this assign is a no-op there
       * too — AC11's and AC21's own empty-diff short-circuit stays intact.
       */
      setModel: assign({
        model: (
          { schema, baseModel }: BillingSettingsContext,
          { data }: AnyEventObject
        ) => useModelParser<BillingSettingsModel>(schema, data, baseModel),
        baseModel: (
          { baseModel }: BillingSettingsContext,
          { data }: AnyEventObject
        ) => ({ ...baseModel, ...(data ?? {}) })
      }),

      /**
       * Folds a REFRESH payload into context WITHOUT overwriting a value the
       * scope already resolved — `clientId ||` is load-bearing, mirroring
       * `usePersonalDetailsManager.machine.ts`.
       */
      refreshContext: assign({
        clientId: (
          { clientId }: BillingSettingsContext,
          { data }: AnyEventObject
        ) => clientId || data?.clientId,
        id: ({ id }: BillingSettingsContext, { data }: AnyEventObject) =>
          id || data?.id
      })
    },

    guards: {
      hasSubscription: (
        { clientId }: BillingSettingsContext,
        _event: AnyEventObject
      ) => !!clientId
    },

    /**
     * The services adapter for this scoped instance. The ALREADY-SCOPED
     * `service` is threaded in, so every machine-invoked request inherits
     * the same resolved target client as the rest of the module.
     */
    services: useClientBillingSettingsManagerServices(service)
  };
}

// Type export for consumers
export type ClientBillingSettingsManagerMachineConfig = ReturnType<
  typeof createBillingSettingsManagerMachineConfig
>;
