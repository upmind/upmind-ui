/** @internal */
import { assign } from "xstate";
import { useSchema, useUischema } from "./client-email.schemas";
import { useClientEmailManagerServices } from "./client-email.services";
import { useModelParser } from "../../utils";
import type { dataManagerMachine } from "../data-manager";
import type {
  ClientEmailServices,
  EmailContext,
  EmailModel
} from "./client-email.types";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @internal
 * @module client-email/useClientEmailManager.machine
 * @description Builds the ONE typed `.withConfig(...)` payload — actions,
 * guards and the services adapter — for a single scoped `service` instance of
 * the shared `dataManagerMachine`. The module owns no machine of its own.
 *
 * Every key below is one the SHARED machine references. Read
 * `data-manager/data-manager.machine.ts` before adding or removing one: an
 * action/guard/service the machine names but this payload omits either falls
 * back to the machine's own no-op default or crashes on entering its state.
 * Neither is a type error.
 */

/**
 * Builds the `dataManagerMachine.withConfig(...)` payload for one scoped
 * `service` instance. The return type is pinned to the shared machine's own
 * config parameter, which is what type-checks every `assign` updater and guard
 * against the real context — and what removes the casts the older inline
 * three-hook shape forced. NEVER widen it back.
 * @internal
 */
export function createClientEmailManagerMachineConfig(
  service: ClientEmailServices
): Parameters<typeof dataManagerMachine.withConfig>[0] {
  return {
    actions: {
      /**
       * Display strings for the email being edited. Plain context fields the
       * manager's `useContext()` re-exposes — never rendered as feedback.
       */
      setMeta: assign({
        title: ({ model }: EmailContext) => model?.email || "New Email",
        description: ({ model: _model }: EmailContext) => ""
      }),

      /**
       * The schema/uischema PAIR — always assigned together. This is the ONLY
       * place they enter the system; they travel to consumers through machine
       * context, which is why `index.ts` exports neither.
       */
      setSchemas: assign({
        schema: useSchema(),
        uischema: useUischema()
      }),

      setModel: assign({
        model: (
          { schema, baseModel }: EmailContext,
          { data }: AnyEventObject
        ) => useModelParser<EmailModel>(schema, data, baseModel)
      }),

      /**
       * Folds a REFRESH payload into context WITHOUT overwriting a value the
       * scope already resolved — `clientId ||` is load-bearing: the manager
       * seeds the scope-resolved client at construction, and a later
       * session-derived REFRESH must not clobber it.
       */
      refreshContext: assign({
        clientId: ({ clientId }: EmailContext, { data }: AnyEventObject) =>
          clientId || data?.clientId
      })
    },

    guards: {
      /**
       * Gates the machine out of `subscribing` into `loading`. The shared
       * machine's default returns true unconditionally; overriding it is what
       * makes the form wait for an addressable client instead of firing an
       * unaddressed request.
       */
      hasSubscription: ({ clientId }: EmailContext, _event: AnyEventObject) =>
        !!clientId
    },

    /**
     * The services adapter for this scoped instance. The ALREADY-SCOPED
     * `service` is threaded in, so every machine-invoked request inherits the
     * same resolved target client as the rest of the module.
     */
    services: useClientEmailManagerServices(service)
  };
}

export type ClientEmailManagerMachineConfig = ReturnType<
  typeof createClientEmailManagerMachineConfig
>;
