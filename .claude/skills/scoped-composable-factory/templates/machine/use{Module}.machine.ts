/** @internal */
// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton. Authority: `code-xstate.md`
 * (naming, canonical state-read APIs — cite, never restate) +
 * `code-scoped-composable.companion.md` "Shared-machine config factory". A
 * disagreement between this skeleton and the doctrine is a surfaced finding,
 * never silently resolved toward the skeleton.
 *
 * USE THIS FILE INSTEAD OF `{module}.machine.ts` when the composable is backed
 * by a SHARED machine (e.g. `dataManagerMachine` from `../data-manager`) rather
 * than its own `createMachine`. A module has EITHER `{module}.machine.ts` (it
 * owns its machine) OR this `use{Module}.machine.ts` (it configures a shared
 * one) — never both. Delete whichever does not apply.
 *
 * WHY THIS SHAPE: the shared machine is configured per scoped instance via one
 * typed `.withConfig(...)` payload. Assembling that payload in a SINGLE factory
 * whose return type is `Parameters<typeof <sharedMachine>.withConfig>[0]` is
 * what keeps the `interpret(...)` call site in `use{Module}.ts` free of `as any`.
 * The old shape — three `useXActions()` / `useXGuards()` / `useXServices() as any`
 * hooks handed to `.withConfig({...})` inline — is live in `client-address`,
 * `client-company`, `client-phone`, `client-personal-details` and
 * `basket-billing/unified`; those are the migration targets, not a copy source.
 */

import { assign } from "xstate";
import { dataManagerMachine } from "../data-manager";
import { useModuleServices } from "./module.services";
import type { DataManagerContext } from "../data-manager/data-manager.types";
import type { ModuleServices } from "./module.types";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @module module/useModule.machine
 * @description Builds the ONE typed `.withConfig(...)` payload — actions,
 * guards and the services adapter — for a single scoped `service` instance of
 * the shared `dataManagerMachine`. Consumed by `use{Module}.ts`:
 *
 *   const machineService = interpret(
 *     dataManagerMachine
 *       .withConfig(createModuleMachineConfig(service))
 *       .withContext({ ...seed })
 *   );
 */

/**
 * Builds the `dataManagerMachine.withConfig(...)` payload for one scoped
 * `service` instance. The return type is pinned to the shared machine's own
 * config parameter, so every `assign` updater and guard is type-checked against
 * the real context — this is what removes the `as any` casts the old inline
 * three-hook shape forced.
 * @internal
 */
export function createModuleMachineConfig(
  service: ModuleServices
): Parameters<typeof dataManagerMachine.withConfig>[0] {
  return {
    // Actions keyed by the names the shared machine references (e.g.
    // setModel / setMeta / refreshContext). Type each updater's context arg as
    // the shared `DataManagerContext` (or the module's own context type) —
    // NEVER `as any`.
    actions: {
      setModel: assign({
        // model: ({ schema, baseModel }: DataManagerContext, { data }: AnyEventObject) =>
        //   useModelParser<ModuleModel>(schema, data, baseModel)
      })
    },

    // Guards keyed by the names the shared machine references, bodied off the
    // shared context — not `as any`.
    guards: {
      // hasSubscription: ({ clientId }: DataManagerContext, _event: AnyEventObject) =>
      //   !!clientId
    },

    // The services adapter for this scoped instance — what the old inline shape
    // passed as `useXServices() as any`. Thread in the already-scoped `service`.
    services: useModuleServices(service)
  };
}

// Type export for consumers
export type ModuleMachineConfig = ReturnType<typeof createModuleMachineConfig>;
