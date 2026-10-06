// TEMPLATE FILE — scaffolded by the factory; replace every placeholder.
import { interpret } from "xstate";
import { createScopedComposable } from "../scope";
import { useI18n } from "../system-localisation";
import machine from "./module.machine";
import { createModuleActions } from "./useModule.actions";
import { createModuleContext } from "./useModule.context";
import { createModuleInternals } from "./useModule.internals";
import { createModuleMeta } from "./useModule.meta";
import {
  createActor,
  DetailedError,
  ErrorOrigin,
  responseCodes
} from "../../utils";
import type { ModuleContext, ModuleScopeMatrix } from "./module.types";
import type {
  ScopeActorTypes,
  ScopeConfig,
  ScopeKey
} from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module module/useModule
 * @description Scoped, machine-backed module composable: one interpreted
 * machine per scope.
 */

function createModuleForScope(config: ScopeConfig, scopeKey: ScopeKey) {
  const actorScope = config.actor as ScopeActorTypes;

  const service = interpret(
    machine.withContext({
      scopeActor: actorScope,
      scopeContext: config.context,
      brandId: config.brandId,
      error: undefined
    } as ModuleContext),
    { devTools: true }
  );
  service.start();

  const actorRef = createActor(service);
  if (!actorRef) {
    throw new DetailedError(
      useI18n().t("error.module_unavailable"),
      responseCodes.Service_Unavailable,
      ErrorOrigin.Headless,
      { scope: config }
    );
  }

  return {
    /** Sub-composable for module actions (machine events). */
    useActions: () => createModuleActions(actorScope, actorRef, scopeKey),

    /** Sub-composable for module context (computed values). */
    useContext: () => createModuleContext(actorScope, actorRef),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () => createModuleInternals(actorScope, actorRef),

    /** Sub-composable for module meta (state flags). */
    useMeta: () => createModuleMeta(actorScope, actorRef)
  };
}
// -----------------------------------------------------------------------------
/** Scoped module composable, e.g. `useModule().as("self")`. */
export const useModule = createScopedComposable<
  ReturnType<typeof createModuleForScope>,
  ModuleScopeMatrix
>("module", createModuleForScope);

export type UseModule = ReturnType<typeof useModule>;
