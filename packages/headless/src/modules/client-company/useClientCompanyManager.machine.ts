/** @internal */
import { assign } from "xstate";
import { useSchema, useUischema } from "./client-company.schemas";
import { useClientCompanyManagerServices } from "./client-company.services";
import { useModelParser } from "../../utils";
import { compact, find, get } from "lodash-es";
import type { dataManagerMachine } from "../data-manager";
import type { ScopeContext } from "../scope";
import type {
  ClientCompanyServices,
  CompanyContext,
  CompanyModel
} from "./client-company.types";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @internal
 * @module client-company/useClientCompanyManager.machine
 * @description Builds the ONE typed `.withConfig(...)` payload — actions,
 * guards and the services adapter — for a single scoped `service` instance of
 * the shared `dataManagerMachine`. The module owns no machine of its own
 * (NFR-4).
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
 * config parameter, which is what type-checks every `assign` updater and
 * guard against the real context — and what removes the three `as any` casts
 * the pre-conversion `withConfig` call carried
 * (`useClientCompanyManager.ts` L56-58). NEVER widen it back.
 * @internal
 */
export function createClientCompanyManagerMachineConfig(
  service: ClientCompanyServices,
  scopeContext?: ScopeContext
): Parameters<typeof dataManagerMachine.withConfig>[0] {
  return {
    actions: {
      /**
       * Display strings for the company being edited. Plain context fields
       * the manager's `useContext()` re-exposes — never rendered as
       * feedback.
       *
       * `description` reads `model.regNumber` / `model.tax.number` directly —
       * the pre-conversion `actions.ts` L18-21 read `get(model,
       * "company.regNumber")` / `get(model, "company.tax.number")`, a
       * `company.` prefix that does not exist on `CompanyModel`, so both
       * always resolved undefined (AC-21, `parity.yaml` C27).
       */
      setMeta: assign({
        title: ({ model }: CompanyContext) => model?.name || "New Company",
        description: ({ model, addresses }: CompanyContext) => {
          const address = find(addresses, ["id", model?.addressId]);
          const addressDetails = get(address, "description");
          const companyDetails = compact([
            model?.regNumber ? `Reg #: ${model.regNumber}` : null,
            model?.tax?.number ? `Tax #: ${model.tax.number}` : null
          ]).join(";");

          return compact([addressDetails, companyDetails]).join(";");
        }
      }),

      /**
       * The schema/uischema PAIR — always assigned together. This is the
       * ONLY place they enter the system; they travel to consumers through
       * machine context, which is why `index.ts` exports neither (they are
       * a distinct, PURE fragment surface instead — `client-company.schemas.ts`
       * — see `design.md` D5).
       */
      setSchemas: assign({
        schema: (context: CompanyContext) => useSchema(context),
        uischema: (context: CompanyContext) => useUischema(context)
      }),

      setModel: assign({
        model: (
          { schema, baseModel }: CompanyContext,
          { data }: AnyEventObject
        ) => useModelParser<CompanyModel>(schema, data, baseModel)
      }),

      /**
       * Folds a REFRESH payload into context WITHOUT overwriting a value the
       * scope already resolved — `clientId ||` is load-bearing: the manager
       * seeds the scope-resolved client at construction, and a later
       * session-derived REFRESH must not clobber it.
       */
      refreshContext: assign({
        clientId: (context: CompanyContext, { data }: AnyEventObject) =>
          context.clientId || data?.clientId
      })
    },

    guards: {
      /**
       * Gates the machine out of `subscribing` into `loading`. The shared
       * machine's default returns true unconditionally; overriding it is
       * what makes the form wait for an addressable client instead of firing
       * an unaddressed request.
       */
      hasSubscription: (context: CompanyContext, _event: AnyEventObject) =>
        !!context.clientId
    },

    /**
     * The services adapter for this scoped instance. The ALREADY-SCOPED
     * `service` is threaded in, so every machine-invoked request inherits
     * the same resolved target client as the rest of the module.
     */
    services: useClientCompanyManagerServices(service, scopeContext)
  };
}

// Type export for consumers
export type ClientCompanyManagerMachineConfig = ReturnType<
  typeof createClientCompanyManagerMachineConfig
>;
