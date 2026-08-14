/** @internal */
import { assign } from "xstate";
import { useSchema, useUischema } from "./client-address.schemas";
import { useClientAddressManagerServices } from "./client-address.services";
import { useModelParser } from "../../utils";
import { compact, get } from "lodash-es";
import type { dataManagerMachine } from "../data-manager";
import type {
  AddressContext,
  AddressModel,
  ClientAddressServices
} from "./client-address.types";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @internal
 * @module client-address/useClientAddressManager.machine
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
 * The display strings for one model — the ONE derivation `setMeta` and
 * `setModel` share.
 *
 * Extracted because the shared machine runs `setMeta` on `loading.onDone` and
 * on `available.checking.parsing.onDone`, but NOT on either
 * `processing.*.onDone` — so a save that ends the machine (`allowMultipleEdits`
 * false takes `processed` straight to `complete`) never re-derives them and the
 * editor's `title` / `description` keep reporting the pre-save address.
 * Appending `setMeta` to those two `onDone` action lists would mean editing
 * `data-manager.machine.ts`, which is protected core; folding the same
 * derivation into this module's OWN `setModel` reaches the identical states
 * without touching it.
 */
function deriveMeta(model?: AddressModel) {
  return {
    title: model?.name || model?.address?.address1 || "New Address",
    description: compact([
      get(model, "address.address1"),
      get(model, "address.address2"),
      get(model, "address.city"),
      get(model, "address.state"),
      get(model, "address.postcode")
    ]).join(", ")
  };
}

/**
 * Builds the `dataManagerMachine.withConfig(...)` payload for one scoped
 * `service` instance. The return type is pinned to the shared machine's own
 * config parameter, which is what type-checks every `assign` updater and guard
 * against the real context — and what removes the three `as any` casts the
 * pre-conversion `withConfig` call carried (`useClientAddressManager.ts`
 * L56-58) along with the eleven grandfathered `no-explicit-any` suppressions
 * they were ledgered under. NEVER widen it back.
 * @internal
 */
export function createClientAddressManagerMachineConfig(
  service: ClientAddressServices
): Parameters<typeof dataManagerMachine.withConfig>[0] {
  return {
    actions: {
      /**
       * Display strings for the address being edited. Plain context fields the
       * manager's `useContext()` re-exposes — never rendered as feedback.
       *
       * `deriveMeta` composes the fields the MODEL actually carries. The
       * pre-conversion `actions.ts` L16-24 read `address.street`,
       * `address.region.name` and `address.country.name` — none of which exist
       * on `AddressModel` (it carries `regionId` / `countryId`), so all three
       * always resolved undefined. Same defect class as the mapper's dead
       * `street` lookup (`parity.yaml` L2), and the same field order.
       */
      setMeta: assign(({ model }: AddressContext) => deriveMeta(model)),

      /**
       * The schema/uischema PAIR — always assigned together. This is the ONLY
       * place they enter the system; they travel to consumers through machine
       * context, which is why the barrel exports the fragment builders and not
       * these parsers (`design.md` D-6).
       *
       * Genuine Δ from the `client-email` reference, whose `setSchemas` is
       * static: these parsers are CONTEXT-DERIVED. They consume `countries`,
       * `regions`, `config` and `id` — which is what makes the country lock
       * (`CLIENT_ALLOW_ADDRESS_UPDATE`, AC-21) and the edit-only `type` control
       * (AC-22) reachable at all.
       */
      setSchemas: assign({
        schema: (context: AddressContext) => useSchema(context),
        uischema: (context: AddressContext) => useUischema(context)
      }),

      /**
       * `id` is adopted alongside the model, not just parsed into it. The
       * shared machine runs this on `processing.adding.onDone`, where `data` is
       * the record the API just CREATED — and `id` is what its own `isNew`
       * guard reads. Without the second updater a saved draft keeps reporting
       * itself new and a second save POSTs a duplicate (AC-24). `context.id ||`
       * comes first so an ordinary `SET` can never rewrite the address under
       * edit.
       *
       * It carries the meta too — see `deriveMeta`. This action IS the save
       * limbs' only module-owned hook, and the shared machine's
       * `processing.*.onDone` runs `setModel` without `setMeta`.
       */
      setModel: assign(
        (
          { id, schema, baseModel }: AddressContext,
          { data }: AnyEventObject
        ) => {
          const model = useModelParser<AddressModel>(schema, data, baseModel);

          // The function form, not the object form: XState v4 hands EVERY
          // updater in an object assignment the ORIGINAL context, so a
          // `title` / `description` updater there would derive from the model
          // this action is replacing. Deriving once from the new model is what
          // makes the meta land on the save limbs at all.
          return {
            model,
            id: id || (get(data, "id") as AddressContext["id"]),
            ...deriveMeta(model)
          };
        }
      ),

      /**
       * Folds a REFRESH payload into context WITHOUT overwriting a value the
       * scope already resolved — `clientId ||` is load-bearing: the manager
       * seeds the scope-resolved client at construction, and a later
       * session-derived REFRESH must not clobber it.
       */
      refreshContext: assign({
        clientId: (context: AddressContext, { data }: AnyEventObject) =>
          context.clientId || data?.clientId
      })
    },

    guards: {
      /**
       * Gates the machine out of `subscribing` into `loading`. The shared
       * machine's default returns true unconditionally; overriding it is what
       * makes the form wait for an addressable client instead of firing an
       * unaddressed request.
       */
      hasSubscription: (context: AddressContext, _event: AnyEventObject) =>
        !!context.clientId
    },

    /**
     * The services adapter for this scoped instance. The ALREADY-SCOPED
     * `service` is threaded in, so every machine-invoked request inherits the
     * same resolved target client as the rest of the module.
     */
    services: useClientAddressManagerServices(service)
  };
}

// Type export for consumers
export type ClientAddressManagerMachineConfig = ReturnType<
  typeof createClientAddressManagerMachineConfig
>;
