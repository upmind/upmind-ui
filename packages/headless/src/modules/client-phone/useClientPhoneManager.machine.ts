/** @internal */
import { assign } from "xstate";
import { useSchema, useUischema } from "./client-phone.schemas";
import { useClientPhoneManagerServices } from "./client-phone.services";
import { useModelParser } from "../../utils";
import { compact, get, isObject } from "lodash-es";
import type { dataManagerMachine } from "../data-manager";
import type {
  ClientPhoneServices,
  Phone,
  PhoneContext,
  PhoneModel
} from "./client-phone.types";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @internal
 * @module client-phone/useClientPhoneManager.machine
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
 * config parameter, which type-checks every `assign` updater and guard
 * against the real context. NEVER widen it back.
 * @internal
 */
export function createClientPhoneManagerMachineConfig(
  service: ClientPhoneServices
): Parameters<typeof dataManagerMachine.withConfig>[0] {
  return {
    actions: {
      /**
       * Display strings for the phone being edited. Plain context fields the
       * manager's `useContext()` re-exposes — never rendered as feedback.
       */
      setMeta: assign({
        title: ({ model }: PhoneContext) => {
          const phone = get(model, "phone");
          if (isObject(phone)) return get(model, "phone.number", "");
          return phone;
        },
        description: ({ country }: PhoneContext) =>
          compact([get(country, "name")]).join(" | ")
      }),

      /**
       * The schema/uischema PAIR — always assigned together. This is the ONLY
       * place they enter the system; they travel to consumers through machine
       * context, which is why `index.ts` exports neither (decision D-4).
       */
      setSchemas: assign({
        schema: (context: PhoneContext) => useSchema(context),
        uischema: () => useUischema()
      }),

      setModel: assign({
        model: (
          { schema, baseModel }: PhoneContext,
          { data }: AnyEventObject
        ) => useModelParser<PhoneModel, Phone>(schema, data, baseModel)
      }),

      /**
       * Folds a REFRESH payload into context WITHOUT overwriting a value the
       * scope already resolved — `clientId ||` is load-bearing: the manager
       * seeds the scope-resolved client at construction, and a later
       * session-derived REFRESH must not clobber it (row M14).
       */
      refreshContext: assign({
        clientId: ({ clientId }: PhoneContext, { data }: AnyEventObject) =>
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
      hasSubscription: ({ clientId }: PhoneContext, _event: AnyEventObject) =>
        !!clientId
    },

    /**
     * The services adapter for this scoped instance. The ALREADY-SCOPED
     * `service` is threaded in, so every machine-invoked request inherits the
     * same resolved target client as the rest of the module.
     */
    services: useClientPhoneManagerServices(service)
  };
}

// Type export for consumers
export type ClientPhoneManagerMachineConfig = ReturnType<
  typeof createClientPhoneManagerMachineConfig
>;
