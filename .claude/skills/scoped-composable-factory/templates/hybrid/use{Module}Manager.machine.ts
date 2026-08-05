/** @internal */
// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton and its named worked
 * example. Authority: `code-xstate.md` (naming, canonical state-read APIs —
 * cite, never restate) + `code-scoped-composable.companion.md` "Shared-machine
 * config factory". A disagreement between this skeleton and the doctrine is a
 * surfaced finding, never silently resolved toward the skeleton.
 *
 * THIS IS THE MANAGER HALF of the hybrid variant. The module carries NO
 * `{module}.machine.ts`: it does not own a machine, it CONFIGURES the shared
 * `dataManagerMachine` (`../data-manager`) — one typed `.withConfig(...)`
 * payload per scoped instance.
 *
 * WHY THIS SHAPE: pinning the return type to
 * `Parameters<typeof dataManagerMachine.withConfig>[0]` is what keeps the
 * `interpret(...)` call site in `useModuleManager.ts` free of `as any`. The old
 * shape — three `useXActions()` / `useXGuards()` / `useXServices() as any`
 * hooks handed to `.withConfig({...})` inline — is live in `client-address`,
 * `client-company`, `client-phone`, `client-personal-details` and
 * `basket-billing/unified`; those are the migration targets, not a copy source.
 */

import { assign } from "xstate";
import { dataManagerMachine } from "../data-manager";
import { useSchema, useUischema } from "./module.schemas";
import { useModuleManagerServices } from "./module.services";
import { useModelParser } from "../../utils";
import type {
  ModuleContext,
  ModuleModel,
  ModuleServices
} from "./module.types";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @internal
 * @module module/useModuleManager.machine
 * @description Builds the ONE typed `.withConfig(...)` payload — actions,
 * guards and the services adapter — for a single scoped `service` instance of
 * the shared `dataManagerMachine`. Consumed by `useModuleManager.ts`:
 *
 *   const machineService = interpret(
 *     dataManagerMachine
 *       .withConfig(createModuleManagerMachineConfig(service))
 *       .withContext({ ...seed })
 *   );
 *
 * Every key below is one the SHARED machine references. Read
 * `data-manager/data-manager.machine.ts` before adding or removing one: an
 * action/guard/service the machine names but this payload omits either falls
 * back to the machine's own no-op default (silently doing nothing) or crashes
 * on entering its state. Neither is a type error.
 *
 * @precedent the restored `client-email/useClientEmailManager.machine.ts` — the
 * first file in this tree to carry the typed shape rather than `as any ×3`.
 */

/**
 * Builds the `dataManagerMachine.withConfig(...)` payload for one scoped
 * `service` instance. The return type is pinned to the shared machine's own
 * config parameter, so every `assign` updater and guard is type-checked against
 * the real context — this is what removes the `as any` casts the old inline
 * three-hook shape forced. NEVER widen it back.
 * @internal
 */
export function createModuleManagerMachineConfig(
  service: ModuleServices
): Parameters<typeof dataManagerMachine.withConfig>[0] {
  return {
    actions: {
      /**
       * Display strings for the entity being edited. Both are plain context
       * fields the manager's `useContext()` re-exposes — never i18n'd here and
       * never rendered as feedback.
       *
       * `String(...)` is here only because the placeholder `ModuleModel` is
       * `Record<string, unknown>`; once `module.types.ts` carries the module's
       * real model type, read the field directly and drop the coercion. Never
       * reach for a cast to close that gap.
       */
      setMeta: assign({
        title: ({ model }: ModuleContext) => String(model?.title ?? "New item"),
        description: ({ model: _model }: ModuleContext) => ""
      }),

      /**
       * The schema/uischema PAIR — always assigned together (ARMS.md pair law):
       * a schema field with no control renders a required-but-invisible input.
       * This is the ONLY place they enter the system; they travel to consumers
       * through machine context, which is why `index.ts` exports no bare
       * `useSchema`/`useUischema`.
       */
      setSchemas: assign({
        schema: useSchema(),
        uischema: useUischema()
      }),

      setModel: assign({
        model: (
          { schema, baseModel }: ModuleContext,
          { data }: AnyEventObject
        ) => useModelParser<ModuleModel>(schema, data, baseModel)
      }),

      /**
       * Folds a REFRESH event's payload into context WITHOUT overwriting a
       * value the scope already resolved — `clientId ||` is load-bearing:
       * `useModuleManager.ts` seeds the scope-resolved client id at
       * construction, and this must not let a later session-derived REFRESH
       * clobber a `.for('client', id)` retarget.
       */
      refreshContext: assign({
        clientId: ({ clientId }: ModuleContext, { data }: AnyEventObject) =>
          clientId || data?.clientId
      })
    },

    guards: {
      /**
       * Gates the machine out of `subscribing` into `loading`. The shared
       * machine's own default returns `true` unconditionally; overriding it with
       * the module's real precondition is what makes the form wait for an
       * addressable client instead of firing an unaddressed request.
       */
      hasSubscription: ({ clientId }: ModuleContext, _event: AnyEventObject) =>
        !!clientId
    },

    /**
     * The services adapter for this scoped instance — what the old inline shape
     * passed as `useXServices() as any`. The ALREADY-SCOPED `service` is
     * threaded in, so every machine-invoked request inherits the same resolved
     * target client as the rest of the module.
     */
    services: useModuleManagerServices(service)
  };
}

// Type export for consumers
export type ModuleManagerMachineConfig = ReturnType<
  typeof createModuleManagerMachineConfig
>;
