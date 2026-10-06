/** @internal */
// TEMPLATE FILE — scaffold instead of {module}.machine.ts for a shared machine.
import { assign } from "xstate";
import moduleMachineServices from "./module.services";
import type { dataManagerMachine } from "../data-manager";
import type { DataManagerContext } from "../data-manager/data-manager.types";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @module module/useModule.machine
 * @description The typed `dataManagerMachine.withConfig()` payload for one
 * scoped module instance.
 */

export function createModuleMachineConfig(): Parameters<
  typeof dataManagerMachine.withConfig
>[0] {
  return {
    actions: {
      setModel: assign({
        model: (_context: DataManagerContext, { data }: AnyEventObject) => data
      })
    },
    guards: {},
    services: moduleMachineServices
  };
}

export type ModuleMachineConfig = ReturnType<typeof createModuleMachineConfig>;
